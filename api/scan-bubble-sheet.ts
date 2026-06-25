import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'ANTHROPIC_API_KEY is not set.' })

  const { imageBase64, imageMimeType, questionCount, answerKey } = req.body as {
    imageBase64: string
    imageMimeType: string
    questionCount: number
    answerKey: string[]  // e.g. ['A', 'C', 'B', 'D', ...]
  }

  if (!imageBase64 || !questionCount || !answerKey) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const prompt = `This is a student's completed multiple choice bubble answer sheet with ${questionCount} questions.

Each question has 4 answer bubbles in a row labelled A, B, C, D. The student has filled in exactly one bubble per question by shading or marking it.

For each question (1 through ${questionCount}), identify which letter bubble is filled in.
If a question has no clearly filled bubble, guess the most likely one.

Return ONLY valid JSON with no other text:
{"answers": ["A", "C", "B", "D", ...]}`

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageMimeType || 'image/jpeg',
                data: imageBase64,
              },
            },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('[scan-bubble-sheet] Anthropic error:', anthropicRes.status, errText)
      return res.status(502).json({ error: `Vision API error ${anthropicRes.status}` })
    }

    const data = await anthropicRes.json() as { content: { type: string; text: string }[] }
    const raw = data.content[0]?.type === 'text' ? data.content[0].text : ''
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    let parsed: { answers: string[] }
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('[scan-bubble-sheet] JSON parse failed:', raw)
      return res.status(500).json({ error: 'Could not read bubble sheet — try a clearer photo' })
    }

    const studentAnswers = parsed.answers.map(a => String(a).toUpperCase().trim())

    // Score against the answer key
    let score = 0
    const results = answerKey.map((correct, i) => {
      const student = studentAnswers[i] ?? '?'
      const isCorrect = student === correct
      if (isCorrect) score++
      return { question: i + 1, studentAnswer: student, correctAnswer: correct, correct: isCorrect }
    })

    return res.status(200).json({ studentAnswers, score, total: questionCount, results })
  } catch (err) {
    console.error('[scan-bubble-sheet]', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
