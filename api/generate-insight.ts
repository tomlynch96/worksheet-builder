import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'ANTHROPIC_API_KEY not set.' })

  const { original_block, final_block, annotation } = req.body as {
    original_block: unknown
    final_block: unknown
    annotation: string
  }

  const hasDiff = original_block != null &&
    JSON.stringify(original_block) !== JSON.stringify(final_block)

  const userMessage = [
    hasDiff
      ? `Original block:\n${JSON.stringify(original_block, null, 2)}`
      : 'No original block available — only the final edited version is known.',
    `Final block:\n${JSON.stringify(final_block, null, 2)}`,
    annotation?.trim() ? `Teacher's note: "${annotation.trim()}"` : '',
  ].filter(Boolean).join('\n\n')

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
        max_tokens: 256,
        system: `You are analysing how a secondary science teacher edited an AI-generated worksheet block.
In 2–3 sentences, summarise what specifically changed and what this suggests about the teacher's preferences or their students' needs. Be concrete — reference actual content changes, not just structure. Write plain prose only, no bullet points or headers.`,
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
