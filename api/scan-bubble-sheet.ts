import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'ANTHROPIC_API_KEY is not set.' })

  const { imageBase64, imageMimeType, questionCount, versions } = req.body as {
    imageBase64: string
    imageMimeType: string
    questionCount: number
    versions: { code: string; answerKey: string[] }[]
  }

  if (!imageBase64 || !questionCount || !versions?.length) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const versionList = versions.map(v => v.code).join(', ')

  const prompt = `This is a student's completed multiple choice bubble answer sheet.

The sheet has a version code printed near the top (e.g. "Version: A3F2-V2" or similar). The possible version codes for this quiz are: ${versionList}.

Read the version code printed on the sheet.

The sheet has ${questionCount} questions, each with 4 answer bubbles labelled A, B, C, D. The student has filled in exactly one bubble per question.

For each question (1 through ${questionCount}), identify which letter bubble is filled in. If a question has no clearly filled bubble, guess the most likely one.

Return ONLY valid JSON with no other text:
{"versionCode": "A3F2-V2", "answers": ["A", "C", "B", "D", ...]}`

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

    let parsed: { versionCode: string; answers: string[] }
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('[scan-bubble-sheet] JSON parse failed:', raw)
      return res.status(500).json({ error: 'Could not read bubble sheet — try a clearer photo' })
    }

    const detectedCode = String(parsed.versionCode ?? '').toUpperCase().trim()
    const matchedVersion = versions.find(v => v.code.toUpperCase() === detectedCode)

    if (!matchedVersion) {
      return res.status(422).json({
        error: `Could not identify version code on sheet (read: "${detectedCode}"). Please retake the photo ensuring the version code is clearly visible.`,
        detectedCode,
      })
    }

    const studentAnswers = parsed.answers.map(a => String(a).toUpperCase().trim())

    let score = 0
    const results = matchedVersion.answerKey.map((correct, i) => {
      const student = studentAnswers[i] ?? '?'
      const isCorrect = student === correct
      if (isCorrect) score++
      return { question: i + 1, studentAnswer: student, correctAnswer: correct, correct: isCorrect }
    })

    return res.status(200).json({
      versionCode: matchedVersion.code,
      studentAnswers,
      score,
      total: questionCount,
      results,
    })
  } catch (err) {
    console.error('[scan-bubble-sheet]', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
