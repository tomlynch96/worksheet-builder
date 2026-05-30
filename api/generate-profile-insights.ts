import type { VercelRequest, VercelResponse } from '@vercel/node'

interface BlockAnnotationInput {
  block_type: string
  annotation: string
  topic: string
  exam_board: string
  tier: string
}

interface WorksheetAnnotationInput {
  topic: string
  exam_board: string
  rating: number | null
  annotation: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'ANTHROPIC_API_KEY not set.' })

  const { blockAnnotations, worksheetAnnotations } = req.body as {
    blockAnnotations: BlockAnnotationInput[]
    worksheetAnnotations: WorksheetAnnotationInput[]
  }

  if (!blockAnnotations?.length && !worksheetAnnotations?.length) {
    return res.status(400).json({ error: 'No annotations provided.' })
  }

  const blockSection = blockAnnotations?.length
    ? `Block-level notes (${blockAnnotations.length} total):\n${
        blockAnnotations.map(a =>
          `- [${a.block_type.replace(/_/g, ' ')} on "${a.topic}" · ${a.exam_board} ${a.tier}]: "${a.annotation}"`
        ).join('\n')
      }`
    : ''

  const sheetSection = worksheetAnnotations?.length
    ? `\nOverall worksheet notes (${worksheetAnnotations.length} total):\n${
        worksheetAnnotations.map(a =>
          `- "${a.topic}" (${a.exam_board}${a.rating ? `, rated ${a.rating}/5` : ''}): "${a.annotation}"`
        ).join('\n')
      }`
    : ''

  const userMessage = [blockSection, sheetSection].filter(Boolean).join('\n')

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
        max_tokens: 1024,
        system: `You are analysing the editing and annotation patterns of a secondary science teacher across their full worksheet portfolio.

Write a 3–4 paragraph analysis for the teacher. Your analysis should:
1. Identify the most recurring patterns in how they edit or comment on AI-generated content
2. Name specific block types or question formats that consistently need adjustment, with concrete examples from the annotations
3. Suggest what these patterns imply about their teaching context — student ability, year group, exam board expectations, or common misconceptions
4. Note any topics or worksheet types where the AI appears to be generating well (few edits, high ratings)

Address the teacher directly (use "you" and "your"). Be specific — quote or paraphrase actual annotation content. Do not use bullet points or headers; write in plain paragraphs.`,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!anthropicRes.ok) {
      const text = await anthropicRes.text()
      return res.status(502).json({ error: `Anthropic API error ${anthropicRes.status}: ${text}` })
    }

    const data = await anthropicRes.json() as { content: { type: string; text: string }[] }
    const insight = data.content[0]?.type === 'text' ? data.content[0].text.trim() : ''
    return res.status(200).json({ insight })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
