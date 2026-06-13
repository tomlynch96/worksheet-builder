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
  "attachedDataId": null, "attachedDataIds": null,
  "parts":[ { "id":"part-001", "label":"a", "stem":"...", "marks":2, "lines":4, "markScheme":"...", "numericalAnswer":"9.8", "attachedDataId": null, "attachedDataIds": null },
            { "id":"part-002", "label":"b", "stem":"...", "marks":2, "lines":4, "markScheme":"...", "numericalAnswer":"", "attachedDataId": null, "attachedDataIds": null } ],
  "markScheme":"" }
IMPORTANT: every part MUST have a "label" field set to "a", "b", "c" etc. and a unique "id".

ATTACHING DATA BLOCKS TO QUESTIONS — use "attachedDataId" or "attachedDataIds" to display a table or graph inline with a question:
- EVERY data block MUST be attached to at least one question or part. Never leave a data block unattached — it will only appear as floating content with no context.
- Set "attachedDataId" on the QUESTION block if ALL parts refer to the same data (e.g. "Use the table to answer parts a–d").
- Set "attachedDataId" on a specific PART if only that sub-question uses the data (e.g. part c asks pupils to plot a graph).
- The data block MUST also exist as a standalone block in the worksheet (so it appears in the mark scheme), AND it must be referenced via attachedDataId/attachedDataIds on a question or part.
- Set "attachedDataId": null when no data is attached (single attachment).
- SHOWING BOTH TABLE AND GRAPH: when a question needs pupils to both read from a table AND plot a graph (very common in practicals), create TWO data blocks — one with display "table" (with all the data in rows) and one with display "graph" (with linkedDataId pointing to the table block's id and rows set to []). The graph MUST use linkedDataId and NOT duplicate the data. Then use "attachedDataIds": ["table-block-id", "graph-block-id"] on the question/part so BOTH appear inline. Never use "attachedDataId" when you need two — use "attachedDataIds" instead.
- Example: a practical question where part (b) asks pupils to plot the data AND part (c) asks them to read from the table:
  Create data-001 (display "table", rows with all data) and data-002 (display "graph", linkedDataId "data-001", rows []). Set "attachedDataIds": ["data-001","data-002"] on the question stem.
- CRITICAL: When a graph block has a linkedDataId set, its own "rows" field MUST be [] — do not copy the data into both blocks.
- Example: a question where part (d) alone uses a results table — set "attachedDataId" only on part d's object, leave it null on the others.

question (single): { "id":"...", "type":"question", "stem":"...", "marks":1, "lines":2, "parts":[], "markScheme":"...", "numericalAnswer":"15", "attachedDataId": null, "attachedDataIds": null }

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

data — represents a results table, line graph, or bar chart. One block can only display in one mode at a time.

"display" controls what is rendered:
  "table" — a results table. Use for data pupils read from or complete.
  "graph" — a line graph grid for pupils to plot and/or draw a best-fit line.
  "bar"   — a bar chart frame for pupils to complete or read from.

"columns": array of { "label": string, "unit": string }
"rows": 2D array of strings — the full data including any values pupils must work out.
  Always include ALL data in rows, even values pupils must calculate — use hiddenCells to blank them on the worksheet.

"hiddenCells": ["r,c", ...] — zero-based row,column indices to blank on the WORKSHEET.
  The mark scheme always reveals the full table. Use this for "complete the table" tasks.
  Example: hide the "Density" column when pupils must calculate it from Mass and Volume.
  Example: hide every other row of a results column to create a partial dataset.

"graph" object (used when display is "graph" or "bar"):
  "xCol": 0         — 0-based column index for the x-axis / category axis
  "yCol": 1         — 0-based column index for the y-axis / value axis
  "showXLabel": true  — print the x-axis label (column name + unit). Set false to omit.
  "showYLabel": true  — print the y-axis label. Set false to omit.
  "showXScale": true  — print numerical tick values on the x-axis.
    Set false to give pupils a completely blank x-axis to scale themselves.
  "showYScale": true  — print numerical tick values on the y-axis.
    Set false to give pupils a blank y-axis to scale themselves.
  "omitRows": [0,1,2,...] — zero-based row indices NOT pre-plotted on the graph.
    Points in omitRows are the ones PUPILS must plot. Points not in omitRows are pre-plotted.
    For a practical worksheet where pupils plot everything: list all row indices, e.g. [0,1,2,3,4,5].
    For a reference/worked-example graph with all points shown: use [].
    For a partially-completed graph: omit a subset of rows.
  "fitType": "none" | "linear" | "curve"
    "none"   — no best-fit line. Use when pupils are not expected to draw one.
    "linear" — straight line of best fit. Use for linear relationships (e.g. F=kx, V=IR).
    "curve"  — smooth curve of best fit. Use for non-linear relationships (e.g. radioactive decay).
  "showFitLine": true | false
    Controls whether the best-fit line appears on the WORKSHEET.
    The line ALWAYS appears on the mark scheme regardless of this setting.
    Set false (typical for practical worksheets) so pupils draw their own line — the mark scheme shows the correct answer.
    Set true only when showing pupils a completed reference graph or worked example.
  "linkedDataId": null | "<id>"
    If set to another data block's id, this graph takes its data from that block instead of its own rows.
    Use when you want a table AND a graph of the same data as separate blocks — set the graph block's linkedDataId to the table block's id so you only maintain one set of data.

CRITICAL omitRows rule: rows listed in omitRows are the ones PUPILS must plot — they are NOT pre-plotted by the app. Rows NOT listed are pre-plotted by the app.
  - All rows omitted (e.g. [0,1,2,3,4]): pupils plot everything.
  - Subset omitted (e.g. [2,3,4,5]): app pre-plots rows 0 and 1, pupils plot the rest. Use this for "plot the remaining points" questions.
  - Empty [] : all points pre-plotted (reference graph only — not for pupil tasks).

Example — practical worksheet graph (pupils plot all points, draw their own best-fit line):
{ "id":"...", "type":"data", "heading":"Table 1: Extension results",
  "columns":[ {"label":"Force","unit":"N"}, {"label":"Extension","unit":"cm"} ],
  "rows":[["1.0","2.1"],["2.0","4.0"],["3.0","6.2"],["4.0","7.9"],["5.0","10.1"]],
  "display":"graph",
  "hiddenCells":[],
  "graph":{ "xCol":0, "yCol":1, "showXLabel":true, "showYLabel":true, "showXScale":true, "showYScale":true, "omitRows":[0,1,2,3,4], "fitType":"linear", "showFitLine":false, "linkedDataId":null } }

Example — table + linked graph + question (REQUIRED pattern for any "plot the graph" question):
This is THREE separate blocks. The graph block pulls its data from the table via linkedDataId — do NOT duplicate the rows.

Block 1 — table (contains all data):
{ "id":"data-001", "type":"data", "heading":"Table 1: Activity of a radioactive isotope",
  "columns":[{"label":"Time","unit":"days"},{"label":"Activity","unit":"Bq"}],
  "rows":[["0","6400"],["8","3200"],["16","1600"],["24","800"],["32","400"],["40","200"]],
  "display":"table", "hiddenCells":[],
  "graph":{"xCol":0,"yCol":1,"fitType":"curve","omitRows":[],"showXLabel":true,"showXScale":true,"showYLabel":true,"showYScale":true,"showFitLine":false,"linkedDataId":null} }

Block 2 — graph linked to table (rows MUST be [], columns MUST be a full copy of the table's columns array; xCol/yCol select which columns to plot):
{ "id":"data-002", "type":"data", "heading":"Graph 1: Activity of a radioactive isotope",
  "columns":[{"label":"Time","unit":"days"},{"label":"Activity","unit":"Bq"}],
  "rows":[],
  "display":"graph", "hiddenCells":[],
  "graph":{"xCol":0,"yCol":1,"fitType":"curve","omitRows":[2,3,4,5],"showXLabel":true,"showXScale":true,"showYLabel":true,"showYScale":true,"showFitLine":false,"linkedDataId":"data-001"} }

Block 3 — question referencing BOTH blocks via attachedDataIds:
{ "id":"q-001", "type":"question", "stem":"Use Table 1 and Graph 1 to answer the following questions.",
  "marks":0, "lines":0, "attachedDataId":null, "attachedDataIds":["data-001","data-002"],
  "parts":[
    {"id":"part-001","label":"a","stem":"Identify the half-life from the table.","marks":1,"lines":2,"markScheme":"8 days [1].","numericalAnswer":"8","attachedDataId":null,"attachedDataIds":null},
    {"id":"part-002","label":"b","stem":"Plot the remaining data points on Graph 1 and draw a smooth curve of best fit through all the points.","marks":3,"lines":2,"markScheme":"All remaining points plotted correctly [2]; smooth curve of best fit [1].","numericalAnswer":"","attachedDataId":null,"attachedDataIds":null},
    {"id":"part-003","label":"c","stem":"Use your graph to estimate the activity after 12 days.","marks":1,"lines":2,"markScheme":"Accept any value in range 2100–2300 Bq [1].","numericalAnswer":"","attachedDataId":null,"attachedDataIds":null}
  ], "markScheme":"" }

Example — "complete the table" (density column hidden, pupils calculate it):
{ "id":"...", "type":"data", "heading":"Table 2: Density calculations",
  "columns":[ {"label":"Mass","unit":"g"}, {"label":"Volume","unit":"cm³"}, {"label":"Density","unit":"g/cm³"} ],
  "rows":[["50","25","2.0"],["80","40","2.0"],["120","60","2.0"]],
  "display":"table",
  "hiddenCells":["0,2","1,2","2,2"],
  "graph":{ "xCol":0, "yCol":1, "showXLabel":true, "showYLabel":true, "showXScale":true, "showYScale":true, "omitRows":[], "fitType":"none", "showFitLine":false, "linkedDataId":null } }

spacer: { "id":"...", "type":"spacer", "size":"small" }

## Rules
1. Use short IDs: "id-001", "id-002", "part-001", "item-001" etc. Every array item needs a unique id.
   CRITICAL — ID consistency: the id you assign to a block MUST exactly match every linkedDataId, attachedDataId, and attachedDataIds reference to that block elsewhere in the worksheet. Never copy the example IDs (data-001, data-002, q-001) literally — generate your own unique short IDs (e.g. "tbl-001", "gph-001") and use those same IDs in all cross-references. If you create a table with "id":"tbl-001", the linked graph MUST have "linkedDataId":"tbl-001" and the question MUST have "attachedDataIds":["tbl-001","gph-001"]. Mismatched IDs cause the graph to be blank and the attachment to break.
2. Always start: header block → instructions block → information block (key facts).
3. Every question / part must have a markScheme using [1] notation.
4. Use correct exam command words: state, give, describe, explain, calculate, suggest, evaluate.
5. Output ONLY the raw JSON object — no markdown fences, no text before or after it.
6. numericalAnswer: for any question or part whose answer is a single number, set "numericalAnswer" to that number as a plain string with no units (e.g. "9.8", "0.025", "1500"). For non-numerical questions (describe, explain, etc.) set "numericalAnswer" to "". Never include units in numericalAnswer.
7. Every data block MUST be attached to a question or part via attachedDataId or attachedDataIds. It is an error to have a data block in the blocks array that is not referenced by any question or part.
8. Column indices for graphs and bar charts: xCol and yCol are zero-based indices into the columns array. The linked graph or bar chart's columns array MUST be an exact full copy of the table's columns array — never abbreviate it to just the two plotted columns. Set xCol and yCol to the indices of the variables named in the graph/chart heading — e.g. for a 4-column table [Object, Mass, Volume, Density] and a bar chart heading "Density of objects", use xCol:0 (Object) and yCol:3 (Density), NOT yCol:1 (Mass). Always read the heading to pick the correct indices.`

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

1. Open with ONE information block. It must contain ONLY: the equation(s) being practised, the meaning of each symbol with units (e.g. F = force in N), and any required constants. Nothing else — no background science, no context, no applications.
2. Include one worked_example block immediately before the questions begin.
3. Question sequence — produce AT LEAST ${total} questions with this distribution:
   First ${d.simple} questions : Single-step substitution only. Values given explicitly. No rearranging. No unit conversions.
   Next  ${d.unit} questions   : Introduce unit conversions (e.g. km→m, g→kg, min→s, cm→m). Still single-step otherwise.
   Next  ${d.rearrange} questions: Introduce rearranging — the subject is NOT isolated in the equation. Values given.
   Final ${d.multi}+ questions : Multi-step problems requiring a second relevant equation or combining concepts.
4. Use realistic numerical values with appropriate significant figures.
5. Each question is a single-part question block (no sub-parts for simple ones).
6. All markScheme fields must show full working with [marks].
7. Every calculation question MUST have a "numericalAnswer" field set to the plain numeric answer (no units).
8. End the worksheet with a numerical_answers block: { "id":"id-na", "type":"numerical_answers", "heading":"Numerical answers" }
9. The worksheet structure must be EXACTLY: header → instructions → information → worked_example → [calculation question blocks] → numerical_answers. Do NOT add any other block types (cloze, match_them_up, information, order_steps, etc.) anywhere in the worksheet.
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
2. Create a data block with realistic scattered data (±5–10% noise). Assign it a unique id (e.g. "data-001").
3. ALWAYS use the table + linked graph + question trio (shown in the format guide) for any question where pupils plot points. Never use a standalone graph block for pupil plotting tasks.
   - Create data-001 (display "table", all rows of data).
   - Create data-002 (display "graph", rows:[], linkedDataId:"data-001", columns matching data-001).
   - Set omitRows on the GRAPH block to the rows pupils must plot. Pre-plot only the first 1–2 rows so pupils can see the scale before plotting (e.g. omitRows:[2,3,4,5] if 6 rows total).
   - Use "attachedDataIds":["data-001","data-002"] on the question so both appear inline.
4. For any topic involving exponential or non-linear change (radioactive decay, cooling curves, charging/discharging, population growth): set fitType:"curve" and showFitLine:false on the graph block. Never use fitType:"linear" for these topics.
5. For linear relationships (Hooke's law, V=IR, F=ma): set fitType:"linear" and showFitLine:false so pupils draw their own best-fit line.
6. Graph question parts must include: plot remaining points [2 marks], draw curve/line of best fit [1 mark], extract a value from the graph [1–2 marks].
7. Follow-up: conclusion question, evaluation question.
8. All markScheme fields must show full marking points with [marks].
${FORMATTING_RULES}
${WORKSHEET_FORMAT}`

const SYSTEM_BLOCK = `You are generating content for a science worksheet.

NORMAL CASE — output a single JSON block object.

EXCEPTION — if the teacher asks for a question that needs an accompanying data table or graph:
  Output a JSON ARRAY. Examples:
  - Single data view: [data-block, question-block-with-"attachedDataId":"data-001"]
  - Table AND graph: [table-block (id "data-001"), graph-block (id "data-002", linkedDataId "data-001"), question-block-with-"attachedDataIds":["data-001","data-002"]]

Use "id": "ai-block-001" for the primary block when returning a single block.
No markdown fences, no explanation — raw JSON only.
${FORMATTING_RULES}
${WORKSHEET_FORMAT}`

const SYSTEM_VARY = `You are varying a single science worksheet block. Generate a new block of the same type that tests the same knowledge or skill but uses different numbers, different wording, or a slightly different scenario. Keep the same difficulty level and mark allocation.
Output ONLY the raw JSON for that one block — no array wrapper, no worksheet wrapper, no markdown fences, no explanation.
Use "id": "ai-block-001" as the id. Follow the exact JSON structure shown in the format guide below.
${FORMATTING_RULES}
${WORKSHEET_FORMAT}`

const SYSTEM_ADD_PART = `You are extending a multi-part science worksheet question by adding one more sub-part.
Return the COMPLETE question JSON with the new part appended to the parts array.
The new part must:
- Progress logically from the existing parts (e.g. if a=recall, b=apply, c=evaluate — add a c or d that goes one step further)
- Use the same scenario, context, and equation as the existing parts
- Use the same or slightly varied numbers — do NOT reuse identical values from earlier parts
- Carry the correct next label ("c" if a and b exist, "d" if a, b, c exist, etc.)
- Have a fully worked markScheme with [marks] notation
Output ONLY the updated complete question JSON — no array wrapper, no worksheet wrapper, no markdown fences, no explanation.
${FORMATTING_RULES}
${WORKSHEET_FORMAT}`

const SYSTEM_EDIT = `You are editing an existing science worksheet based on a teacher's instruction.
You will receive the current worksheet JSON and the teacher's request.
Output ONLY the updated complete worksheet as a raw JSON object — same id, same format, no markdown fences, no text before or after.
${FORMATTING_RULES}`

// ── Handler ───────────────────────────────────────────────────────────────

// ── Post-processing types (minimal, matching worksheet types) ─────────────

type Part = { attachedDataId?: string | null; attachedDataIds?: string[] | null }
type QuestionBlock = { type: 'question'; id: string; attachedDataId?: string | null; attachedDataIds?: string[] | null; parts?: Part[] }
type DataBlock = { type: 'data'; id: string; display?: string; rows?: string[][]; columns?: { label: string }[]; graph?: { linkedDataId?: string | null } }
type Block = { type: string; id: string } & Partial<QuestionBlock> & Partial<DataBlock>

// Collect all data IDs already referenced by questions/parts
function referencedDataIds(blocks: Block[]): Set<string> {
  const ids = new Set<string>()
  for (const b of blocks) {
    if (b.type !== 'question' && b.type !== 'multiple_choice') continue
    const q = b as QuestionBlock
    if (q.attachedDataId) ids.add(q.attachedDataId)
    if (q.attachedDataIds) q.attachedDataIds.forEach(id => ids.add(id))
    for (const p of q.parts ?? []) {
      if (p.attachedDataId) ids.add(p.attachedDataId)
      if (p.attachedDataIds) p.attachedDataIds.forEach(id => ids.add(id))
    }
  }
  return ids
}

function fixDataBlocks(blocks: Block[]): Block[] {
  const blockIds = new Set(blocks.map(b => b.id))
  const tableBlocks = blocks.filter(b => b.type === 'data' && (b as DataBlock).display === 'table') as DataBlock[]

  // Step 0: Resolve stale cross-reference IDs.
  // The AI frequently generates UUID block ids but writes short placeholder IDs
  // (e.g. "tbl-001", "gph-001") in linkedDataId / attachedDataIds, so they never match.
  // Fix graph.linkedDataId: if the value isn't a real block id, find the matching table.
  for (const b of blocks) {
    if (b.type !== 'data') continue
    const d = b as DataBlock
    if (d.display !== 'graph' && d.display !== 'bar') continue
    if (!d.graph?.linkedDataId || blockIds.has(d.graph.linkedDataId)) continue
    // Stale linkedDataId — resolve by column-label match first, then proximity
    const byColumns = tableBlocks.find(t =>
      t.columns?.length === d.columns?.length &&
      t.columns?.every((col, i) => col.label === d.columns?.[i]?.label)
    )
    const graphIdx = blocks.indexOf(b)
    const byProximity = (() => {
      for (let k = graphIdx - 1; k >= 0; k--) {
        const c = blocks[k] as DataBlock
        if (c.type === 'data' && c.display === 'table') return c
      }
      return null
    })()
    const resolved = byColumns ?? byProximity
    if (resolved) {
      d.graph = { ...d.graph, linkedDataId: resolved.id }
      d.rows = []
    }
  }

  // Fix question.attachedDataIds / attachedDataId: replace non-existent IDs with
  // real block IDs of the immediately-preceding data blocks.
  for (let qi = 0; qi < blocks.length; qi++) {
    const b = blocks[qi]
    if (b.type !== 'question' && b.type !== 'multiple_choice') continue
    const q = b as QuestionBlock

    if (q.attachedDataIds?.length) {
      const validIds = q.attachedDataIds.filter(id => blockIds.has(id))
      const hasInvalid = q.attachedDataIds.some(id => !blockIds.has(id))
      if (hasInvalid) {
        if (validIds.length > 0) {
          // Already has some real IDs mixed in — strip the stale ones, keep the real ones
          q.attachedDataIds = validIds
          if (validIds.length > 1) q.attachedDataId = null
        } else {
          // All IDs are stale — resolve by looking backwards from the question,
          // closest-first. This correctly handles multiple trios on the same page
          // because it picks the immediately-preceding trio's blocks, not earlier ones.
          const precedingData: DataBlock[] = []
          for (let k = qi - 1; k >= 0 && precedingData.length < 8; k--) {
            const c = blocks[k] as DataBlock
            if (c.type === 'data') precedingData.push(c)
          }
          // precedingData is closest-first
          const precTables = precedingData.filter(d => d.display === 'table')
          const precGraphs = precedingData.filter(d => d.display === 'graph' || d.display === 'bar')
          const fixed = q.attachedDataIds.map(id => {
            if (blockIds.has(id)) return id
            if (/tbl|table/i.test(id) && precTables.length) return precTables[0].id
            if (/gph|graph|bar/i.test(id) && precGraphs.length) return precGraphs[0].id
            return precedingData[0]?.id ?? id
          })
          const deduped = [...new Set(fixed)].filter(id => blockIds.has(id))
          q.attachedDataIds = deduped.length ? deduped : null as unknown as string[]
          if ((q.attachedDataIds?.length ?? 0) > 1) q.attachedDataId = null
        }
      }
    }

    if (q.attachedDataId && !blockIds.has(q.attachedDataId)) {
      for (let k = qi - 1; k >= 0; k--) {
        const c = blocks[k] as DataBlock
        if (c.type === 'data' && c.display === 'table') { q.attachedDataId = c.id; break }
      }
    }

    // Fix stale attachedDataId/attachedDataIds on individual parts too
    for (const part of q.parts ?? []) {
      const p = part as Part & { attachedDataIds?: string[] | null }
      if (p.attachedDataId && !blockIds.has(p.attachedDataId)) {
        const precedingData: DataBlock[] = []
        for (let k = qi - 1; k >= 0 && precedingData.length < 8; k--) {
          const c = blocks[k] as DataBlock
          if (c.type === 'data') precedingData.push(c)
        }
        const precTables = precedingData.filter(d => d.display === 'table')
        const precGraphsOrBars = precedingData.filter(d => d.display === 'graph' || d.display === 'bar')
        if (/tbl|table/i.test(p.attachedDataId) && precTables.length) p.attachedDataId = precTables[0].id
        else if (/gph|graph|bar/i.test(p.attachedDataId) && precGraphsOrBars.length) p.attachedDataId = precGraphsOrBars[0].id
        else if (precTables.length) p.attachedDataId = precTables[0].id
      }
      if (p.attachedDataIds?.length && p.attachedDataIds.some(id => !blockIds.has(id))) {
        p.attachedDataIds = p.attachedDataIds.map(id => blockIds.has(id) ? id : id).filter(id => blockIds.has(id))
        if (!p.attachedDataIds.length) p.attachedDataIds = null
      }
    }
  }

  // Step 1. Deduplicate table+graph pairs: if a graph block has its own rows AND
  // no linkedDataId yet, wire up linkedDataId and clear the graph's rows.
  for (const b of blocks) {
    if (b.type !== 'data') continue
    const d = b as DataBlock
    if (d.display !== 'graph' && d.display !== 'bar') continue
    if (d.graph?.linkedDataId) continue                     // already linked (including from Step 0)
    if (!d.rows?.length) continue                            // no duplicate data
    const matchingTable = tableBlocks.find(t =>
      t.columns?.length === d.columns?.length &&
      t.columns?.every((col, i) => col.label === d.columns?.[i]?.label)
    )
    if (matchingTable) {
      d.graph = { ...(d.graph ?? {}), linkedDataId: matchingTable.id }
      d.rows = []
    }
  }

  // Step 2. Attach any still-unattached data blocks to the nearest preceding question,
  // but only if that question doesn't already have a full table+graph attachment.
  // This prevents spurious AI-generated extra data blocks from polluting a question
  // that is already correctly wired.
  const referenced = referencedDataIds(blocks)
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    if (b.type !== 'data') continue
    if (referenced.has(b.id)) continue
    let target: QuestionBlock | null = null
    for (let j = i - 1; j >= 0; j--) {
      if (blocks[j].type === 'question' || blocks[j].type === 'multiple_choice') {
        target = blocks[j] as QuestionBlock
        break
      }
    }
    if (!target) {
      for (let j = i + 1; j < blocks.length; j++) {
        if (blocks[j].type === 'question' || blocks[j].type === 'multiple_choice') {
          target = blocks[j] as QuestionBlock
          break
        }
      }
    }
    if (!target) continue
    // Skip if the question already has two or more data attachments — it's fully wired
    if ((target.attachedDataIds?.length ?? 0) >= 2) continue
    if (target.attachedDataId) {
      target.attachedDataIds = [target.attachedDataId, b.id]
      target.attachedDataId = null
    } else if (target.attachedDataIds?.length) {
      target.attachedDataIds = [...target.attachedDataIds, b.id]
    } else {
      target.attachedDataId = b.id
    }
    referenced.add(b.id)
  }

  return blocks
}

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

  const { teachingPhilosophy } = params as Record<string, string>
  const philosophySection = teachingPhilosophy?.trim()
    ? `\n## This teacher's approach\n${teachingPhilosophy.trim()}\n`
    : ''

  interface OakContext {
    lessonTitle: string
    learningPoints: string[]
    keywords: Array<{ keyword: string; description: string }>
    misconceptions: Array<{ misconception: string; response: string }>
    images?: string[]
  }
  const oakContext = (params as Record<string, unknown>).oakContext as OakContext | undefined
  const oakSection = oakContext
    ? `\n## Oak National Academy lesson context\nLesson: ${oakContext.lessonTitle}\nKey learning points:\n${oakContext.learningPoints.map(p => `- ${p}`).join('\n')}\nKeywords:\n${oakContext.keywords.map(k => `- ${k.keyword}: ${k.description}`).join('\n')}\nCommon misconceptions to address:\n${oakContext.misconceptions.map(m => `- ${m.misconception} (response: ${m.response})`).join('\n')}${oakContext.images?.length ? `\nLesson images: ${oakContext.images.length} diagram(s) from this lesson are included in this message. You may reference or use these diagrams in questions (e.g. "Refer to the diagram." or "Use the figure to answer…"). When using an image, create a figure block with the exact imageUrl provided and attach it to the relevant question using attachedFigureId.` : ''}\nUse this content to make questions specific and targeted at these exact learning outcomes.\n`
    : ''

  interface PriorAnnotation { topic: string; rating: number | null; annotation: string }
  interface PriorBlockAnnotation { block_type: string; topic: string; annotation: string; change_summary?: string; insight?: string }
  const priorAnnotations = (params as Record<string, unknown>).priorAnnotations as PriorAnnotation[] | undefined
  const priorBlockAnnotations = (params as Record<string, unknown>).priorBlockAnnotations as PriorBlockAnnotation[] | undefined

  const priorSection = priorAnnotations?.length
    ? `\n## Teacher feedback on previous worksheets\n${
        priorAnnotations.map(a =>
          `- "${a.topic}"${a.rating ? ` (rated ${a.rating}/5)` : ''}: ${a.annotation}`
        ).join('\n')
      }\n`
    : ''

  const priorBlockSection = priorBlockAnnotations?.length
    ? `\n## Teacher edit history on previous blocks — apply these preferences\n${
        priorBlockAnnotations.slice(0, 12).map(b => {
          const topicTag = b.topic ? ` on "${b.topic}"` : ''
          const changeTag = b.change_summary ? ` [what changed: ${b.change_summary}]` : ''
          const insightTag = b.insight ? ` [interpretation: ${b.insight}]` : ''
          return `- ${b.block_type}${topicTag}: teacher note: "${b.annotation}"${changeTag}${insightTag}`
        }).join('\n')
      }\nWhen generating ${priorBlockAnnotations.map(b => b.block_type).filter((v,i,a)=>a.indexOf(v)===i).join('/')} blocks, apply these preferences directly.\n`
    : ''

  const contextSection = philosophySection + oakSection + priorSection + priorBlockSection

  if (mode === 'worksheet') {
    const { topic, examBoard, tier, qualification, specPoint, worksheetType, extraNotes, difficulty, equations } = params as Record<string, unknown>
    const mathsPrompt = buildMathsPrompt(
      typeof difficulty === 'number' ? difficulty : 3,
      Array.isArray(equations) ? equations as string[] : [],
    )
    const typeMap: Record<string, string> = { maths: mathsPrompt, knowledge: SYSTEM_KNOWLEDGE, practical: SYSTEM_PRACTICAL }
    const basePrompt = typeMap[worksheetType as string] ?? SYSTEM_KNOWLEDGE
    systemPrompt = contextSection
      ? basePrompt.replace('\nPEDAGOGICAL RULES', `${contextSection}\nPEDAGOGICAL RULES`)
      : basePrompt
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
    const { blockType, context, request, currentBlock } = params as Record<string, unknown>
    systemPrompt = contextSection ? SYSTEM_BLOCK + contextSection : SYSTEM_BLOCK
    userMessage = [
      `Generate a single "${blockType}" block.`,
      context ? `Worksheet context: ${context}` : '',
      currentBlock
        ? `Current block content (the teacher has already filled in some fields — preserve any content they have written and use it as the basis; only fill in what is missing or explicitly requested):\n${JSON.stringify(currentBlock)}`
        : '',
      request ? `Teacher's request: ${request}` : '',
    ].filter(Boolean).join('\n')

  } else if (mode === 'vary') {
    const { block, context } = params as { block: unknown; context: string }
    systemPrompt = SYSTEM_VARY
    userMessage = [
      'Generate a variation of this block:',
      context ? `Worksheet context: ${context}` : '',
      `Block JSON:\n${JSON.stringify(block)}`,
    ].filter(Boolean).join('\n')

  } else if (mode === 'add_part') {
    const { block, context } = params as { block: unknown; context: string }
    systemPrompt = SYSTEM_ADD_PART
    userMessage = [
      'Add one more sub-part to this question:',
      context ? `Worksheet context: ${context}` : '',
      `Question JSON:\n${JSON.stringify(block)}`,
    ].filter(Boolean).join('\n')

  } else if (mode === 'edit') {
    const { worksheet, request } = params as { worksheet: unknown; request: string }
    systemPrompt = contextSection ? SYSTEM_EDIT + contextSection : SYSTEM_EDIT
    userMessage = `Teacher's request: ${request}\n\nCurrent worksheet:\n${JSON.stringify(worksheet)}`

  } else {
    return res.status(400).json({ error: `Unknown mode: ${mode}` })
  }

  try {
    type TextBlock = { type: 'text'; text: string }
    type ImageBlock = { type: 'image'; source: { type: 'url'; url: string } }
    type ContentBlock = TextBlock | ImageBlock
    type Message = { role: string; content: string | ContentBlock[] }

    // Cloudinary URLs support on-the-fly resizing via upload transformation params.
    // Anthropic's many-image limit is 2000px per dimension; cap at 1500px to be safe.
    // Also cap total images at 10 — the API becomes slow and expensive beyond that.
    function resizeCloudinaryUrl(url: string): string {
      return url.replace(
        /\/image\/upload\//,
        '/image/upload/w_1500,h_1500,c_limit,f_auto/'
      )
    }

    const rawOakImages = ['worksheet', 'block', 'vary', 'add_part'].includes(mode as string)
      ? (oakContext?.images ?? [])
      : []
    const oakImages = rawOakImages.slice(0, 10).map(resizeCloudinaryUrl)
    let userContent: string | ContentBlock[]
    if (oakImages.length > 0) {
      userContent = [
        { type: 'text', text: userMessage },
        ...oakImages.map((url): ImageBlock => ({ type: 'image', source: { type: 'url', url } })),
        { type: 'text', text: `The ${oakImages.length} image(s) above are diagrams from the Oak lesson. Their URLs (in order) are:\n${rawOakImages.slice(0, 10).map((url, i) => `Image ${i + 1}: ${url}`).join('\n')}\nWhen using an image in a question, set the figure block's imageUrl to the exact URL listed above (use the original URL, not the resized one).` },
      ]
    } else {
      userContent = userMessage
    }

    const messages: Message[] = [
      { role: 'user', content: userContent },
    ]

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
        messages,
      }),
    })

    if (!anthropicRes.ok) {
      const text = await anthropicRes.text()
      return res.status(502).json({ error: `Anthropic API error ${anthropicRes.status}: ${text}` })
    }

    const data = await anthropicRes.json() as { content: { type: string; text: string }[] }
    const raw = data.content[0]?.type === 'text' ? data.content[0].text : ''
    const stripped = raw.replace(/^```[a-z]*\n?/gm, '').replace(/^```\s*$/gm, '').trim()
    // Strip any prose preamble before the JSON starts
    const jsonStart = stripped.search(/[{[]/)
    const cleaned = jsonStart > 0 ? stripped.slice(jsonStart) : stripped

    let parsed: { id?: string; blocks?: unknown[] }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return res.status(502).json({
        error: `The AI returned an unexpected response instead of JSON. Try rephrasing your request.\n\nModel said: "${stripped.slice(0, 200)}${stripped.length > 200 ? '…' : ''}"`,
      })
    }

    // Post-process: repair stale cross-reference IDs the AI generates
    if (mode === 'worksheet' && Array.isArray(parsed.blocks)) {
      parsed.blocks = fixDataBlocks(parsed.blocks as Block[]) as unknown[]
    } else if ((mode === 'block' || mode === 'vary') && Array.isArray(parsed)) {
      // Block-mode trio responses ([table, graph, question]) need the same repair
      parsed = fixDataBlocks(parsed as unknown as Block[]) as unknown as typeof parsed
    }

    return res.status(200).json({ result: JSON.stringify(parsed) })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
