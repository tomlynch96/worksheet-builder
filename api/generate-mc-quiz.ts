import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

  const { worksheetContent, questionCount, title, topic, examBoard, tier } = req.body as {
    worksheetContent: string
    questionCount: number
    title: string
    topic: string
    examBoard: string
    tier: string
  }

  if (!worksheetContent || !questionCount) {
    return res.status(400).json({ error: 'Missing worksheetContent or questionCount' })
  }

  const userPrompt = `Generate exactly ${questionCount} multiple choice questions for a follow-up quiz on this worksheet.

Worksheet: "${title}" — ${topic} (${examBoard} ${tier})

Worksheet content:
${worksheetContent}

Return exactly ${questionCount} questions covering the key concepts, facts and calculations from this worksheet.`

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text) as { questions: { id: string; text: string; options: string[] }[] }

    // Assign clean IDs and ensure exactly 4 options
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
