const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Shared JSON format spec ────────────────────────────────────────────────

const WORKSHEET_FORMAT = `
## JSON format

Every worksheet is a JSON object: { "id": "<uuid>", "blocks": [ ... ] }

### Block types

header: { "id":"...", "type":"header", "title":"...", "topic":"...", "examBoard":"AQA", "tier":"higher", "showName":true, "showDate":true, "showClass":true }
  examBoard: "AQA" | "OCR" | "Edexcel" | "WJEC"
  tier: "higher" | "foundation" | "both"

instructions: { "id":"...", "type":"instructions", "items":["Answer all questions.", "Show your working.", "Marks are shown in brackets."] }

question (multi-part): { "id":"...", "type":"question", "stem":"...", "marks":0, "lines":0,
  "parts":[ { "id":"...", "label":"a", "stem":"...", "marks":2, "lines":4, "markScheme":"a = Δv/Δt = 20/8 [1]; = 2.5 m/s² [1]" } ], "markScheme":"" }

question (single): { "id":"...", "type":"question", "stem":"...", "marks":1, "lines":2, "parts":[], "markScheme":"..." }

multiple_choice: { "id":"...", "type":"multiple_choice", "stem":"...", "marks":1, "options":["A","B","C","D"], "correctIndex":2, "markScheme":"C — ... [1]" }

worked_example: { "id":"...", "type":"worked_example", "title":"...", "steps":["Write equation: F = ma", "Substitute: F = 5 × 3", "Answer: F = 15 N"] }

information: { "id":"...", "type":"information", "heading":"Key facts", "content":"..." }

cloze: { "id":"...", "type":"cloze", "heading":"Fill in the blanks.", "text":"A [force] changes an object's [velocity].", "showWordBank":true }

match_them_up: { "id":"...", "type":"match_them_up", "heading":"Match each term to its definition.", "items":[ { "id":"...", "left":"Force", "right":"Newton (N)" } ] }

order_steps: { "id":"...", "type":"order_steps", "heading":"Put these steps in order.", "steps":["Step A","Step B","Step C"] }

figure: { "id":"...", "type":"figure", "caption":"Figure 1: ...", "size":"medium" }
  size: "small" | "medium" | "large"

data: { "id":"...", "type":"data", "heading":"Table 1: Results",
  "columns":[ {"label":"Force","unit":"N"}, {"label":"Extension","unit":"cm"} ],
  "rows":[["1.0","2.1"],["2.0","4.0"],["3.0","6.2"],["4.0","7.9"],["5.0","10.1"]],
  "display":"graph",
  "graph":{ "xCol":0, "yCol":1, "showXLabel":true, "showYLabel":true, "showXScale":true, "showYScale":true, "omitRows":[], "fitType":"linear", "linkedDataId":null } }
  display: "table" | "graph" | "bar"   fitType: "none" | "linear" | "curve"
  omitRows: array of row indices the PUPIL must plot (leave blank on printed sheet)

spacer: { "id":"...", "type":"spacer", "size":"small" }

## Rules
1. Use short IDs: "id-001", "id-002", etc.
2. Always start: header block → instructions block → information block (key facts).
3. Every question / part must have a markScheme using [1] notation.
4. Use correct exam command words: state, give, describe, explain, calculate, suggest, evaluate.
5. Output ONLY the raw JSON object — no markdown fences, no text before or after it.`

// ── System prompts ─────────────────────────────────────────────────────────

const SYSTEM_MATHS = `You are generating a maths/calculation science worksheet for secondary school pupils.

PEDAGOGICAL RULES — follow exactly:

1. Open with an information block listing every equation, symbol definition, and constant needed.
2. Include one worked_example block immediately before the questions begin.
3. Question sequence — produce AT LEAST 21 numbered questions:
   Q1–Q6  (6 questions): Single-step substitution only. Values given explicitly in the question stem. No rearranging. No unit conversions.
   Q7–Q12 (6 questions): Introduce unit conversions (e.g. km→m, g→kg, min→s, cm→m). Still single-step otherwise. Values still given.
   Q13–Q18 (6 questions): Introduce rearranging — the subject is NOT isolated in the equation. Values given.
   Q19+   (at least 3 questions): Multi-step problems requiring a second relevant equation or combining concepts.
4. Use realistic numerical values with appropriate significant figures.
5. Each question is a single-part question block (no sub-parts for the simple ones).
6. All markScheme fields must show full working with [marks].
${FORMATTING_RULES}
${WORKSHEET_FORMAT}`

const SYSTEM_KNOWLEDGE = `You are generating a knowledge-recall science worksheet for secondary school pupils.

PEDAGOGICAL RULES — follow exactly:

1. Open with an information block listing all key terms, definitions, and facts pupils need.
2. Section 1 — Easy (minimum 4 blocks):
   - match_them_up: match terms to definitions.
   - cloze: fill-in-the-blank sentences. All answers must come from the key facts box.
3. Section 2 — Medium (minimum 4 questions):
   - Short-answer recall: state, give, name, identify. 1–2 marks each.
4. Section 3 — Hard (minimum 3 questions):
   - describe and explain questions requiring structured full-sentence answers. 3–4 marks each.
5. Every key term and concept must appear in at least 3 different question formats across the sheet.
6. All markScheme fields must show full marking points with [marks].
${FORMATTING_RULES}
${WORKSHEET_FORMAT}`

const SYSTEM_PRACTICAL = `You are generating a practical/experimental science worksheet for secondary school pupils.

PEDAGOGICAL RULES — follow exactly:

1. Open with an information block relevant to the experiment (method summary, variables, safety).
2. Data table and graph:
   - Include a data block with realistic experimental results. Add ±5–10% random scatter to ideal values — do NOT use perfectly linear data.
   - Set display to "graph" with fitType "linear" or "curve" as appropriate.
   - Put ~60% of rows as visible data. List the remaining ~40% row indices in omitRows — pupils plot these themselves on the printed sheet.
3. Graph questions (in this order):
   a) "Plot the remaining data points on the graph." [2 marks]
   b) "Draw a line/curve of best fit through all the data points." [1 mark]
   c) "Use your graph to [read off a value / find the gradient / find the intercept]." [2–3 marks]
4. Follow-up questions:
   - Conclusion: what relationship does the data show?
   - Evaluation: suggest one improvement to the method and explain why.
5. All markScheme fields must show full marking points with [marks].
${FORMATTING_RULES}
${WORKSHEET_FORMAT}`

const FORMATTING_RULES = `
## Critical formatting rules — apply to ALL blocks
- NEVER include question numbers (1., 2., Q1, etc.) in any stem or heading — the app adds these automatically.
- NEVER include marks in brackets (e.g. [2 marks], (3)) in any stem or content — marks are displayed separately.
- NEVER include part labels (a), (b), (i), (ii) in sub-part stems — the app adds these automatically.
- Write stems and content as plain prose only.`

const SYSTEM_BLOCK = `You are generating a single content block for a science worksheet.
Output ONLY the raw JSON object for that one block — no array wrapper, no worksheet wrapper, no markdown fences, no explanation.
Use "id": "ai-block-001" as the id. The teacher will review and add it to their worksheet.
${FORMATTING_RULES}`

const SYSTEM_EDIT = `You are editing an existing science worksheet based on a teacher's instruction.
You will receive the current worksheet JSON and the teacher's request.
Output ONLY the updated complete worksheet as a raw JSON object — same id, same format, no markdown fences, no text before or after.
${FORMATTING_RULES}`

// ── Handler ────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured on this Supabase project. See setup instructions.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const body = await req.json()
    const { mode } = body as { mode: string }

    let systemPrompt: string
    let userMessage: string

    if (mode === 'worksheet') {
      const { topic, examBoard, tier, qualification, specPoint, worksheetType, extraNotes } =
        body as Record<string, string>
      const typeMap: Record<string, string> = {
        maths: SYSTEM_MATHS,
        knowledge: SYSTEM_KNOWLEDGE,
        practical: SYSTEM_PRACTICAL,
      }
      systemPrompt = typeMap[worksheetType] ?? SYSTEM_KNOWLEDGE
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
      const { blockType, context, request } = body as Record<string, string>
      systemPrompt = SYSTEM_BLOCK
      userMessage = [
        `Generate a single "${blockType}" block.`,
        context ? `Worksheet context: ${context}` : '',
        request ? `Teacher's request: ${request}` : '',
      ].filter(Boolean).join('\n')

    } else if (mode === 'edit') {
      const { worksheet, request } = body as { worksheet: unknown; request: string }
      systemPrompt = SYSTEM_EDIT
      userMessage = `Teacher's request: ${request}\n\nCurrent worksheet:\n${JSON.stringify(worksheet)}`

    } else {
      return new Response(
        JSON.stringify({ error: `Unknown mode: ${mode}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

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
      const errText = await anthropicRes.text()
      throw new Error(`Anthropic API error ${anthropicRes.status}: ${errText}`)
    }

    const anthropicJson = await anthropicRes.json() as { content: { type: string; text: string }[] }
    const raw = anthropicJson.content[0]?.type === 'text' ? anthropicJson.content[0].text : ''
    const cleaned = raw.replace(/^```[a-z]*\n?/gm, '').replace(/^```\s*$/gm, '').trim()

    return new Response(
      JSON.stringify({ result: cleaned }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
