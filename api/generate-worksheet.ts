import type { VercelRequest, VercelResponse } from '@vercel/node'

// ── Formatting rules ──────────────────────────────────────────────────────

const FORMATTING_RULES = `
## Critical formatting rules — apply to ALL blocks
- NEVER include question numbers (1., 2., Q1, etc.) in any stem or heading — the app adds these automatically.
- NEVER include marks in brackets (e.g. [2 marks], (3)) in any stem or content — marks are displayed separately.
- NEVER include part labels like (a), (b), (i), (ii) in sub-part STEM TEXT — the app renders the label separately.
- However, DO always include the "label" field on each part object set to "a", "b", "c" etc.
- Write stems and content as plain prose only.`

// ── Shared JSON format spec ───────────────────────────────────────────────

const WORKSHEET_FORMAT = `
## JSON format

Every worksheet is a JSON object: { "id": "<uuid>", "blocks": [ ... ] }

### Block types

header: { "id":"...", "type":"header", "title":"...", "topic":"...", "examBoard":"AQA", "tier":"higher", "showName":true, "showDate":true, "showClass":true }

instructions: { "id":"...", "type":"instructions", "items":["Answer all questions.", "Show your working.", "Marks are shown in brackets."] }

question (multi-part):
{ "id":"...", "type":"question", "stem":"...", "marks":0, "lines":0,
  "parts":[ { "id":"part-001", "label":"a", "stem":"...", "marks":2, "lines":4, "markScheme":"..." },
            { "id":"part-002", "label":"b", "stem":"...", "marks":2, "lines":4, "markScheme":"..." } ],
  "markScheme":"" }
IMPORTANT: every part MUST have a "label" field set to "a", "b", "c" etc. and a unique "id".

question (single): { "id":"...", "type":"question", "stem":"...", "marks":1, "lines":2, "parts":[], "markScheme":"..." }

multiple_choice: { "id":"...", "type":"multiple_choice", "stem":"...", "marks":1, "options":["A","B","C","D"], "correctIndex":2, "markScheme":"C — ... [1]" }

worked_example: { "id":"...", "type":"worked_example", "title":"...", "steps":["Write equation: F = ma", "Substitute: F = 5 × 3", "Answer: F = 15 N"] }

information: { "id":"...", "type":"information", "heading":"Key facts", "content":"<p><strong>Term:</strong> definition or key fact here.</p><p><strong>Formula:</strong> F = ma, where F is force (N), m is mass (kg), a is acceleration (m/s²).</p>" }
IMPORTANT: The information "content" field MUST use HTML formatting:
- Wrap each separate piece of information in its own <p> tag
- Use <strong> for key terms, formula names, or bold headings within the content
- Write equations as plain text within the paragraph (e.g. F = ma, v² = u² + 2as)
- Never put all content in one long run-on string — each fact gets its own paragraph

cloze: { "id":"...", "type":"cloze", "heading":"Fill in the blanks.", "text":"A [force] changes an object's [velocity].", "showWordBank":true }

match_them_up:
{ "id":"...", "type":"match_them_up", "heading":"Match each term to its definition.",
  "items":[ { "id":"item-001", "left":"Force", "right":"A push or pull on an object" },
            { "id":"item-002", "left":"Mass",  "right":"Amount of matter in an object" },
            { "id":"item-003", "left":"Weight","right":"Gravitational force on an object" } ] }
IMPORTANT: every item MUST have a unique "id", a non-empty "left", and a non-empty "right".

order_steps: { "id":"...", "type":"order_steps", "heading":"Put these steps in order.", "steps":["Step A","Step B","Step C"] }

figure: { "id":"...", "type":"figure", "caption":"Figure 1: ...", "size":"medium" }

data: { "id":"...", "type":"data", "heading":"Table 1: Results",
  "columns":[ {"label":"Force","unit":"N"}, {"label":"Extension","unit":"cm"} ],
  "rows":[["1.0","2.1"],["2.0","4.0"],["3.0","6.2"],["4.0","7.9"],["5.0","10.1"]],
  "display":"graph",
  "graph":{ "xCol":0, "yCol":1, "showXLabel":true, "showYLabel":true, "showXScale":true, "showYScale":true, "omitRows":[], "fitType":"linear", "linkedDataId":null } }

spacer: { "id":"...", "type":"spacer", "size":"small" }

## Rules
1. Use short IDs: "id-001", "id-002", "part-001", "item-001" etc. Every array item needs a unique id.
2. Always start: header block → instructions block → information block (key facts).
3. Every question / part must have a markScheme using [1] notation.
4. Use correct exam command words: state, give, describe, explain, calculate, suggest, evaluate.
5. Output ONLY the raw JSON object — no markdown fences, no text before or after it.`

// ── System prompts ────────────────────────────────────────────────────────

function buildMathsPrompt(difficulty: number, equations: string[]): string {
  const dists: Record<number, { simple: number; unit: number; rearrange: number; multi: number }> = {
    1: { simple: 10, unit: 4,  rearrange: 2,  multi: 1  },
    2: { simple: 8,  unit: 5,  rearrange: 4,  multi: 2  },
    3: { simple: 6,  unit: 6,  rearrange: 6,  multi: 3  },
    4: { simple: 5,  unit: 4,  rearrange: 7,  multi: 4  },
    5: { simple: 5,  unit: 3,  rearrange: 7,  multi: 6  },
  }
  const d = dists[difficulty] ?? dists[3]
  const total = d.simple + d.unit + d.rearrange + d.multi
  const eqList = equations.length > 0
    ? `\nEquations to use (only these — do not introduce others):\n${equations.map(e => `  - ${e}`).join('\n')}`
    : ''

  return `You are generating a maths/calculation science worksheet for secondary school pupils.
${eqList}
PEDAGOGICAL RULES — follow exactly:

1. Open with an information block listing every equation, symbol definition, and constant needed.
2. Include one worked_example block immediately before the questions begin.
3. Question sequence — produce AT LEAST ${total} questions with this distribution:
   First ${d.simple} questions : Single-step substitution only. Values given explicitly. No rearranging. No unit conversions.
   Next  ${d.unit} questions   : Introduce unit conversions (e.g. km→m, g→kg, min→s, cm→m). Still single-step otherwise.
   Next  ${d.rearrange} questions: Introduce rearranging — the subject is NOT isolated in the equation. Values given.
   Final ${d.multi}+ questions : Multi-step problems requiring a second relevant equation or combining concepts.
4. Use realistic numerical values with appropriate significant figures.
5. Each question is a single-part question block (no sub-parts for simple ones).
6. All markScheme fields must show full working with [marks].
${FORMATTING_RULES}
${WORKSHEET_FORMAT}`
}

const SYSTEM_KNOWLEDGE = `You are generating a knowledge-recall science worksheet for secondary school pupils.

PEDAGOGICAL RULES — follow exactly:

1. Open with an information block listing all key terms, definitions, and facts.
2. Section 1 — Easy (minimum 4 blocks): match_them_up and cloze blocks.
3. Section 2 — Medium (minimum 4 questions): state, give, name, identify. 1–2 marks each.
4. Section 3 — Hard (minimum 3 questions): describe and explain. 3–4 marks each.
5. Every key term must appear in at least 3 different formats across the sheet.
6. All markScheme fields must show full marking points with [marks].
${FORMATTING_RULES}
${WORKSHEET_FORMAT}`

const SYSTEM_PRACTICAL = `You are generating a practical/experimental science worksheet for secondary school pupils.

PEDAGOGICAL RULES — follow exactly:

1. Open with an information block relevant to the experiment.
2. Include a data block with realistic scattered data (±5–10% noise). Set ~40% of row indices in omitRows for pupils to plot.
3. Graph questions: plot remaining points [2], draw best fit [1], extract a value [2–3].
4. Follow-up: conclusion question, evaluation question.
5. All markScheme fields must show full marking points with [marks].
${FORMATTING_RULES}
${WORKSHEET_FORMAT}`

const SYSTEM_BLOCK = `You are generating a single content block for a science worksheet.
Output ONLY the raw JSON object for that one block — no array wrapper, no worksheet wrapper, no markdown fences, no explanation.
Use "id": "ai-block-001" as the id. Follow the exact JSON structure shown in the format guide below.
${FORMATTING_RULES}
${WORKSHEET_FORMAT}`

const SYSTEM_EDIT = `You are editing an existing science worksheet based on a teacher's instruction.
You will receive the current worksheet JSON and the teacher's request.
Output ONLY the updated complete worksheet as a raw JSON object — same id, same format, no markdown fences, no text before or after.
${FORMATTING_RULES}`

// ── Handler ───────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY is not set in Vercel environment variables.' })
  }

  const { mode, ...params } = req.body as Record<string, unknown>

  let systemPrompt: string
  let userMessage: string

  if (mode === 'worksheet') {
    const { topic, examBoard, tier, qualification, specPoint, worksheetType, extraNotes, difficulty, equations } = params as Record<string, unknown>
    const mathsPrompt = buildMathsPrompt(
      typeof difficulty === 'number' ? difficulty : 3,
      Array.isArray(equations) ? equations as string[] : [],
    )
    const typeMap: Record<string, string> = { maths: mathsPrompt, knowledge: SYSTEM_KNOWLEDGE, practical: SYSTEM_PRACTICAL }
    systemPrompt = typeMap[worksheetType as string] ?? SYSTEM_KNOWLEDGE
    userMessage = [
      'Generate a worksheet with these parameters:',
      `Topic: ${topic}`,
      `Exam board: ${examBoard}`,
      `Tier: ${tier}`,
      qualification ? `Qualification: ${qualification}` : '',
      specPoint ? `Spec point: ${specPoint}` : '',
      extraNotes ? `Extra notes from teacher: ${extraNotes}` : '',
    ].filter(Boolean).join('\n')

  } else if (mode === 'block') {
    const { blockType, context, request } = params as Record<string, string>
    systemPrompt = SYSTEM_BLOCK
    userMessage = [
      `Generate a single "${blockType}" block.`,
      context ? `Worksheet context: ${context}` : '',
      request ? `Teacher's request: ${request}` : '',
    ].filter(Boolean).join('\n')

  } else if (mode === 'edit') {
    const { worksheet, request } = params as { worksheet: unknown; request: string }
    systemPrompt = SYSTEM_EDIT
    userMessage = `Teacher's request: ${request}\n\nCurrent worksheet:\n${JSON.stringify(worksheet)}`

  } else {
    return res.status(400).json({ error: `Unknown mode: ${mode}` })
  }

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
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!anthropicRes.ok) {
      const text = await anthropicRes.text()
      return res.status(502).json({ error: `Anthropic API error ${anthropicRes.status}: ${text}` })
    }

    const data = await anthropicRes.json() as { content: { type: string; text: string }[] }
    const raw = data.content[0]?.type === 'text' ? data.content[0].text : ''
    const cleaned = raw.replace(/^```[a-z]*\n?/gm, '').replace(/^```\s*$/gm, '').trim()

    return res.status(200).json({ result: cleaned })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
