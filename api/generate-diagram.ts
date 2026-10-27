import type { VercelRequest, VercelResponse } from '@vercel/node'

// ── Diagram style ─────────────────────────────────────────────────────────

const SYSTEM_DIAGRAM = `You draw diagrams for UK secondary science worksheets (KS3, GCSE, A level) in the style of AQA, OCR, Edexcel and WJEC exam papers. You output a single SVG plus metadata as JSON.

## What an exam-style diagram looks like
- Clean black line art on white. stroke="#000". Main objects stroke-width 2.5; construction lines, normals and dimension lines stroke-width 1.5.
- No colour. Use fill="none" or fill="#fff"; light grey (#d9d9d9) only where shading is genuinely needed (e.g. a mass, a planet, a liquid).
- Dashed lines (stroke-dasharray="6 4") for paths, orbits, equilibrium positions, equipotentials and hidden/construction lines.
- Labels in font-family="Arial, Helvetica, sans-serif", font-size 20 (22 for key labels) — the diagram is printed at roughly half its drawn size, so labels must stay legible on A4. Labels must never overlap lines or each other; leave at least 6px clearance. Use text-anchor so labels sit just outside the object they name. Use a thin leader line when a label cannot sit next to its object.
- Arrows: define one marker in <defs> (id="arrow", a small solid black triangle, orient="auto-start-reverse") and use marker-end / marker-start. Force and velocity arrows are straight with the arrowhead at the tip.
- Lengths: show with a dimension line (thin line with arrowheads at both ends, or short perpendicular end bars) parallel to the measured length, offset from the object, with the label centred beside it.
- Angles: draw a small arc between the two lines and put the label inside or just outside the arc. Mark right angles with a small square.
- Physics conventions: field lines carry arrows showing direction; equipotentials are dashed and perpendicular to field lines everywhere; radial fields are symmetric; uniform fields are evenly spaced parallel lines; circuit symbols follow the standard UK/IEC symbols; rays have arrows mid-ray; normals are dashed.
- Proportions should look right, but add a small italic "Not drawn to scale" in a corner when the numbers do not match the geometry.
- Leave a 20px margin inside the viewBox. Use viewBox="0 0 W H" with matching width and height attributes; W between 400 and 700, H between 250 and 500, sized to the content (no big empty areas).
- Do NOT include a figure title, caption or question text inside the SVG.
- Do NOT use <script>, <foreignObject>, <image>, <style>, external fonts, links or any href other than "#id" marker references. Use presentation attributes, not CSS.

## Labelled quantities are editable
Teachers reuse the same drawing with different numbers, so every NUMERICAL value shown in the diagram must be a placeholder:
- Write {{key}} inside the <text> element where the value appears, e.g. <text …>r = {{radius}}</text> or <text …>{{angle}}</text>.
- Do NOT write the unit after the placeholder — the unit belongs in the variable and is rendered automatically ("2.0 m", "30°").
- keys are camelCase, start with a letter, letters/digits only (radius, angle, mass1, chargeA).
- List every placeholder in "variables" with a sensible default value. Each key used in the SVG appears exactly once in the list.
- A quantity pupils are asked to CALCULATE must not be shown with a value — label it with its symbol (e.g. "v = ?") or omit it.
- Symbols and words that are not numbers (r, θ, "Sun", "string") are written directly, not as placeholders.

## Response format
Reply with JSON only — no prose, no code fences:
{
  "title": "short library title, e.g. Planet in circular orbit around a star",
  "description": "one sentence describing what is drawn and labelled, for teachers browsing the library",
  "caption": "Figure caption, e.g. Figure 1",
  "svg": "<svg …>…</svg>",
  "variables": [ { "key": "radius", "label": "Orbital radius", "value": "1.5 × 10¹¹", "unit": "m" } ],
  "topics": ["broad topics, 1–4, e.g. Circular motion", "Gravitational fields"],
  "specPoints": ["spec references this diagram supports, e.g. AQA-7408-3.6.1.1 — include the worksheet's spec point when relevant; [] if unsure"],
  "question": null
}`

const QUESTION_RULES = `
## Also write the question that uses this diagram
Set "question" to an object:
{ "stem": "…", "marks": 0, "lines": 0, "markScheme": "", "numericalAnswer": "",
  "parts": [ { "label": "a", "stem": "…", "marks": 2, "lines": 4, "markScheme": "…", "numericalAnswer": "…" } ] }
- For a single-part question use "parts": [] and put marks/lines/markScheme/numericalAnswer on the question itself.
- The question must refer to the diagram ("Figure 1 shows…", "Use the figure to…") and to quantities exactly as labelled in it.
- Wherever a value shown in the diagram appears in the question text or mark scheme, write the same {{key}} placeholder (with the unit written after it only in prose that needs it — the placeholder already includes the unit). Numerical answers and mark-scheme working must be correct for the default variable values.
- Use the exam board's command words exactly (State, Describe, Explain, Calculate, Show that, Determine, Sketch, Draw) and mark-scheme style with [1] per marking point.
- NEVER put question numbers, part labels like (a) or marks like [2] inside stem text — the app adds them.
- Lines: about 2 lines per mark for written answers; calculation parts 4–6 lines.`

interface DiagramVariable { key: string; label: string; value: string; unit?: string }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'ANTHROPIC_API_KEY is not set in Vercel environment variables.' })

  const { request, context, includeQuestion, questionContext, current, history } = req.body as {
    request: string
    context?: string
    includeQuestion?: boolean
    questionContext?: string
    current?: { template: string; variables: DiagramVariable[] }
    history?: string[]
  }
  if (!request?.trim()) return res.status(400).json({ error: 'Describe the diagram you want.' })

  const systemPrompt = SYSTEM_DIAGRAM + (includeQuestion ? QUESTION_RULES : '\nKeep "question": null.')

  const userMessage = [
    context ? `Worksheet context: ${context}` : '',
    questionContext ? `The diagram is attached to this question (match it):\n${questionContext}` : '',
    current
      ? [
          'Here is the current diagram. Apply the teacher\'s change and return the FULL updated diagram (keep everything they did not ask to change, keep existing placeholder keys where the quantity is unchanged).',
          history?.length ? `Earlier requests: ${history.map(h => `"${h}"`).join('; ')}` : '',
          `Current SVG:\n${current.template}`,
          `Current variables:\n${JSON.stringify(current.variables)}`,
          `Teacher's change: ${request.trim()}`,
        ].filter(Boolean).join('\n\n')
      : `Draw: ${request.trim()}`,
  ].filter(Boolean).join('\n\n')

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'server-side-fallback-2026-07-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-5-5',
        max_tokens: 16000,
        output_config: { effort: 'medium' },
        fallbacks: 'default',
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!anthropicRes.ok) {
      const text = await anthropicRes.text()
      return res.status(502).json({ error: `Anthropic API error ${anthropicRes.status}: ${text}` })
    }

    const data = await anthropicRes.json() as { stop_reason?: string; content: { type: string; text?: string }[] }
    if (data.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'The AI declined to draw this diagram. Try rephrasing the request.' })
    }
    // Opus thinks first, so the answer is the text block rather than content[0]
    const raw = data.content.find(b => b.type === 'text')?.text ?? ''
    const stripped = raw.replace(/^```[a-z]*\n?/gm, '').replace(/^```\s*$/gm, '').trim()
    const jsonStart = stripped.indexOf('{')
    const jsonEnd = stripped.lastIndexOf('}')
    if (jsonStart < 0 || jsonEnd < jsonStart) {
      return res.status(502).json({ error: 'The AI returned an unexpected response. Try rephrasing your request.' })
    }

    let parsed: { svg?: string; variables?: DiagramVariable[] } & Record<string, unknown>
    try {
      parsed = JSON.parse(stripped.slice(jsonStart, jsonEnd + 1))
    } catch {
      return res.status(502).json({ error: 'The AI returned malformed JSON. Try again.' })
    }
    if (typeof parsed.svg !== 'string' || !parsed.svg.includes('<svg')) {
      return res.status(502).json({ error: 'The AI response did not include an SVG diagram. Try again.' })
    }
    // First-pass strip; the client sanitises properly with DOMParser
    parsed.svg = parsed.svg.replace(/<script[\s\S]*?<\/script>/gi, '')
    parsed.variables = Array.isArray(parsed.variables) ? parsed.variables : []

    return res.status(200).json({ result: parsed })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
