import type { Worksheet, HeaderBlock } from '../types/worksheet'
import { getQualification } from '../data/specs'

export function buildAIPrompt(worksheet: Worksheet): string {
  const header = worksheet.blocks.find(b => b.type === 'header') as HeaderBlock | undefined

  const context: string[] = []
  if (header?.title) context.push(`Title: ${header.title}`)
  if (header?.topic) context.push(`Topic: ${header.topic}`)
  if (header?.examBoard) context.push(`Exam board: ${header.examBoard}`)
  if (header?.tier) context.push(`Tier: ${header.tier}`)
  if (header?.qualification) {
    const qual = getQualification(header.qualification)
    if (qual) context.push(`Qualification: ${qual.label}`)
  }
  if (header?.specPoint) context.push(`Spec point: ${header.specPoint}`)

  const contextBlock = context.length > 0
    ? `\n## Current worksheet context\n${context.map(c => `- ${c}`).join('\n')}\n`
    : ''

  return `You are helping a teacher create a worksheet. Your ONLY output should be a single JSON object — nothing else. No explanation, no markdown fences, no code, no app. Just the raw JSON data for one worksheet.

The JSON will be pasted into a worksheet builder tool that renders and prints it. You are not building software.
${contextBlock}
## Before writing the JSON, briefly answer these questions in a short paragraph

1. What topic and spec point does this worksheet cover?
2. What year group and tier is it aimed at?
3. What question types will you include?
4. How many marks total?
5. Any diagrams or data tables needed?

Then output the raw JSON object — no markdown fences around it, no text after it.

---

## JSON format

Every worksheet is a JSON object:

\`\`\`
{
  "id": "<uuid>",
  "blocks": [ /* array of block objects */ ]
}
\`\`\`

### Block types

**header**
\`\`\`
{ "id": "...", "type": "header", "title": "Forces and Motion", "topic": "Newton's Laws", "examBoard": "AQA", "tier": "higher", "showName": true, "showDate": true, "showClass": true }
\`\`\`
- examBoard: "AQA" | "OCR" | "Edexcel" | "WJEC"
- tier: "higher" | "foundation" | "both"

**instructions**
\`\`\`
{ "id": "...", "type": "instructions", "items": ["Answer all questions.", "Show your working.", "Marks are shown in brackets."] }
\`\`\`

**question** (multi-part)
\`\`\`
{
  "id": "...", "type": "question",
  "stem": "A car accelerates from rest to 20 m/s in 8 s.",
  "marks": 0, "lines": 0,
  "parts": [
    { "id": "...", "label": "a", "stem": "Calculate the acceleration.", "marks": 2, "lines": 4, "markScheme": "a = Δv/Δt = 20/8 [1]; = 2.5 m/s² [1]" },
    { "id": "...", "label": "b", "stem": "State Newton's Second Law.", "marks": 1, "lines": 2, "markScheme": "F = ma / force = mass × acceleration [1]" }
  ],
  "markScheme": ""
}
\`\`\`

**question** (single, no parts)
\`\`\`
{ "id": "...", "type": "question", "stem": "State the unit of force.", "marks": 1, "lines": 2, "parts": [], "markScheme": "Newton (N) [1]" }
\`\`\`

**multiple_choice**
\`\`\`
{ "id": "...", "type": "multiple_choice", "stem": "Which is a vector?", "marks": 1, "options": ["Speed", "Distance", "Velocity", "Time"], "correctIndex": 2, "markScheme": "C — Velocity [1]" }
\`\`\`

**worked_example**
\`\`\`
{ "id": "...", "type": "worked_example", "title": "Calculating force", "steps": ["Write the equation: F = ma", "Substitute: F = 5 × 3", "Answer: F = 15 N"] }
\`\`\`

**information**
\`\`\`
{ "id": "...", "type": "information", "heading": "Did you know?", "content": "The speed of light is 3 × 10⁸ m/s." }
\`\`\`

**cloze** (fill in the blanks — wrap answer words in [square brackets])
\`\`\`
{ "id": "...", "type": "cloze", "heading": "Fill in the blanks.", "text": "A [force] changes an object's [velocity]. This is Newton's [second] law.", "showWordBank": true }
\`\`\`

**match_them_up**
\`\`\`
{ "id": "...", "type": "match_them_up", "heading": "Match each quantity to its unit.", "items": [{ "id": "...", "left": "Force", "right": "Newton (N)" }, { "id": "...", "left": "Mass", "right": "kg" }] }
\`\`\`

**order_steps**
\`\`\`
{ "id": "...", "type": "order_steps", "heading": "Put these steps in order.", "steps": ["Attach the spring", "Add masses one at a time", "Measure the extension", "Record results"] }
\`\`\`

**figure** (placeholder image box)
\`\`\`
{ "id": "...", "type": "figure", "caption": "Figure 1: Circuit diagram", "size": "medium" }
\`\`\`
- size: "small" | "medium" | "large"

**data** (table or graph)
\`\`\`
{
  "id": "...", "type": "data", "heading": "Table 1: Results",
  "columns": [{ "label": "Force", "unit": "N" }, { "label": "Extension", "unit": "cm" }],
  "rows": [["1.0","2.0"],["2.0","4.1"],["3.0","6.0"]],
  "display": "graph",
  "graph": { "xCol": 0, "yCol": 1, "showXLabel": true, "showYLabel": true, "showXScale": true, "showYScale": true, "omitRows": [], "fitType": "linear", "linkedDataId": null }
}
\`\`\`
- display: "table" | "graph" | "bar"
- fitType: "none" | "linear" | "curve"

**spacer**
\`\`\`
{ "id": "...", "type": "spacer", "size": "small" }
\`\`\`

---

## Rules

1. Generate unique IDs like "id-001", "id-002", etc.
2. Always start with a header block, then an instructions block.
3. Every question and part needs a markScheme string using [1] notation.
4. Use correct exam command words: describe, explain, calculate, state, suggest, evaluate.
5. Output the raw JSON object only — no markdown fences, no explanation after it.`
}
