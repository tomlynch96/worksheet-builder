import type { VercelRequest, VercelResponse } from '@vercel/node'
import mammoth from 'mammoth'

const SYSTEM_PROMPT = `You are generating multiple choice questions for a follow-up quiz based on a source document a teacher has uploaded.

Rules:
- Questions must assess exactly the content covered in the document — no new topics.
- Each question has exactly 4 options. options[0] MUST always be the correct answer. The app shuffles order per version.
- Questions should vary in difficulty and style: recall, application, and common misconceptions as distractors.
- Write concisely — stem max 2 sentences, options max ~8 words each.
- Distractors must be plausible — wrong answers a student might actually choose.
- Use correct scientific/subject language and units where relevant.
- Do NOT reference specific values from graphs, tables, diagrams, or images that pupils would need to see to answer — pupils will not have those visuals in front of them during the quiz. Ask about concepts and relationships instead.
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

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function buildUserContentBlocks(
  mimeType: string,
  fileBase64: string,
  textContent: string | null,
): Record<string, unknown>[] {
  if (textContent !== null) {
    return [{ type: 'text', text: textContent }]
  }
  if (mimeType === 'application/pdf') {
    return [{
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 },
    }]
  }
  return [{
    type: 'image',
    source: { type: 'base64', media_type: mimeType, data: fileBase64 },
  }]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'ANTHROPIC_API_KEY is not set in Vercel environment variables.' })

  const { fileBase64, mimeType, title, questionCount, replaceContext } = req.body as {
    fileBase64: string
    mimeType: string
    title: string
    questionCount: number
    replaceContext?: string
  }

  if (!fileBase64 || !mimeType || !questionCount) {
    return res.status(400).json({ error: 'Missing fileBase64, mimeType, or questionCount' })
  }

  if (mimeType === 'application/msword') {
    return res.status(415).json({ error: 'Legacy .doc files are not supported — please upload a PDF, .docx, or image instead.' })
  }

  let textContent: string | null = null
  if (mimeType === DOCX_MIME) {
    try {
      const buffer = Buffer.from(fileBase64, 'base64')
      const result = await mammoth.extractRawText({ buffer })
      textContent = result.value.trim()
      if (!textContent) {
        return res.status(422).json({ error: 'Could not extract any text from this document.' })
      }
    } catch (err) {
      console.error('[generate-follow-up-quiz] mammoth extraction failed:', err)
      return res.status(422).json({ error: 'Could not read this .docx file.' })
    }
  } else if (mimeType !== 'application/pdf' && !mimeType.startsWith('image/')) {
    return res.status(415).json({ error: 'Unsupported file type — please upload a PDF, .docx, or image.' })
  }

  const instructions = `Generate exactly ${questionCount} multiple choice question${questionCount === 1 ? '' : 's'} for a follow-up quiz based on the attached source document.

Document title: "${title}"
${replaceContext ? `\n${replaceContext}\n` : ''}
Return exactly ${questionCount} question${questionCount === 1 ? '' : 's'} covering the key concepts, facts and calculations from this document.`

  const contentBlocks = buildUserContentBlocks(mimeType, fileBase64, textContent)
  contentBlocks.push({ type: 'text', text: instructions })

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: contentBlocks }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('[generate-follow-up-quiz] Anthropic API error:', anthropicRes.status, errText)
      return res.status(502).json({ error: `Anthropic API error ${anthropicRes.status}: ${errText.slice(0, 200)}` })
    }

    const data = await anthropicRes.json() as { content: { type: string; text: string }[] }
    const raw = data.content[0]?.type === 'text' ? data.content[0].text : ''

    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    let parsed: { questions: { id: string; text: string; options: string[] }[] }
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('[generate-follow-up-quiz] JSON parse failed. Raw response:', raw)
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
    console.error('[generate-follow-up-quiz]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: msg })
  }
}
