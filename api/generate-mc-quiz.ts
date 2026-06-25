import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are generating multiple choice questions for a follow-up quiz based on a science worksheet.

Rules:
- Questions must assess exactly the content covered in the worksheet — no new topics.
- Each question has exactly 4 options. options[0] MUST always be the correct answer. The app shuffles order per version.
- Questions should vary in difficulty and style: recall, application, and common misconceptions as distractors.
- Write concisely — stem max 2 sentences, options max ~8 words each.
- Distractors must be plausible — wrong answers a student might actually choose.
- Use correct scientific language and units.
- Output ONLY valid JSON — no markdown, no extra text.

Output format:
{
  "questions": [
    {
      "id": "q1",
      "text": "Question stem here?",
      "options": ["Correct answer", "Wrong option B", "Wrong option C", "Wrong option D"]
    }
  ]
}`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'ANTHROPIC_API_KEY is not set in Vercel environment variables.' })

  const { worksheetContent, questionCount, title, topic, examBoard, tier, replaceContext } = req.body as {
    worksheetContent: string
    questionCount: number
    title: string
    topic: string
    examBoard: string
    tier: string
    replaceContext?: string
  }

  if (!worksheetContent || !questionCount) {
    return res.status(400).json({ error: 'Missing worksheetContent or questionCount' })
  }

  const userPrompt = `Generate exactly ${questionCount} multiple choice question${questionCount === 1 ? '' : 's'} for a follow-up quiz on this worksheet.

Worksheet: "${title}" — ${topic} (${examBoard} ${tier})

Worksheet content:
${worksheetContent}
${replaceContext ? `\n${replaceContext}\n` : ''}
Return exactly ${questionCount} question${questionCount === 1 ? '' : 's'} covering the key concepts, facts and calculations from this worksheet.`

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('[generate-mc-quiz] Anthropic API error:', anthropicRes.status, errText)
      return res.status(502).json({ error: `Anthropic API error ${anthropicRes.status}: ${errText.slice(0, 200)}` })
    }

    const data = await anthropicRes.json() as { content: { type: string; text: string }[] }
    const raw = data.content[0]?.type === 'text' ? data.content[0].text : ''

    // Strip markdown code fences if Claude wrapped the JSON
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    let parsed: { questions: { id: string; text: string; options: string[] }[] }
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('[generate-mc-quiz] JSON parse failed. Raw response:', raw)
      return res.status(500).json({ error: 'Model returned invalid JSON', raw: raw.slice(0, 500) })
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return res.status(500).json({ error: 'Model response missing questions array' })
    }

    const questions = parsed.questions.slice(0, questionCount).map((q, i) => ({
      id: `q${i + 1}`,
      text: q.text,
      options: q.options.slice(0, 4),
    }))

    return res.status(200).json({ questions })
  } catch (err) {
    console.error('[generate-mc-quiz]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: msg })
  }
}
