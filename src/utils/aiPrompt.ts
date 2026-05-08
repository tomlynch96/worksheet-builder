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

  return `You are an expert secondary science teacher creating exam-quality worksheets. Generate a worksheet as a JSON object matching the schema below.

${contextBlock}
## Qualifying questions — answer these before generating

Before writing the JSON, briefly answer:
1. What is the **topic and spec point** this worksheet covers?
2. What **year group and tier** is it aimed at (e.g. Year 10 Higher)?
3. What **question types** will you include (structured questions, multiple choice, worked example, cloze, match)?
4. How many **marks total** should the worksheet be worth?
5. Are there any **required diagrams or data tables**?

Then output the JSON object only — no other text after it.

---

## JSON Schema

Every worksheet is a JSON object with this shape:

\`\`\`json
{
  "id": "<uuid>",
  "blocks": [ /* array of block objects */ ]
}
\`\`\`

### Block types

#### header
\`\`\`json
{
  "id": "<uuid>",
  "type": "header",
  "title": "Forces and Motion",
  "topic": "Newton's Laws — AQA GCSE Physics",
  "examBoard": "AQA",
  "tier": "higher",
  "showName": true,
  "showDate": true,
  "showClass": true
}
\`\`\`
- \`examBoard\`: "AQA" | "OCR" | "Edexcel" | "WJEC"
- \`tier\`: "higher" | "foundation" | "both"

#### instructions
\`\`\`json
{
  "id": "<uuid>",
  "type": "instructions",
  "items": [
    "Answer all questions.",
    "Write your answers in the spaces provided.",
    "The marks for each question are shown in brackets."
  ]
}
\`\`\`

#### question
\`\`\`json
{
  "id": "<uuid>",
  "type": "question",
  "stem": "A car accelerates from rest to 20 m/s in 8 s.",
  "marks": 0,
  "lines": 0,
  "parts": [
    {
      "id": "<uuid>",
      "label": "a",
      "stem": "Calculate the acceleration of the car.",
      "marks": 2,
      "lines": 4,
      "markScheme": "a = Δv/Δt = 20/8 [1]; = 2.5 m/s² [1]"
    },
    {
      "id": "<uuid>",
      "label": "b",
      "stem": "State Newton's Second Law.",
      "marks": 1,
      "lines": 2,
      "markScheme": "Force equals mass times acceleration / F = ma [1]"
    }
  ],
  "markScheme": ""
}
\`\`\`
- Use \`parts\` for multi-part questions; leave \`parts: []\` for single-part questions and put marks/lines/markScheme at the top level instead.
- \`lines\`: number of answer lines to show (0–8)
- \`markScheme\`: mark scheme text (shown in mark scheme view only)

#### multiple_choice
\`\`\`json
{
  "id": "<uuid>",
  "type": "multiple_choice",
  "stem": "Which of the following is a vector quantity?",
  "marks": 1,
  "options": ["Speed", "Distance", "Velocity", "Time"],
  "correctIndex": 2,
  "markScheme": "C — Velocity [1]"
}
\`\`\`

#### worked_example
\`\`\`json
{
  "id": "<uuid>",
  "type": "worked_example",
  "title": "Calculating resultant force",
  "steps": [
    "Write down the equation: F = ma",
    "Substitute values: F = 5 kg × 3 m/s²",
    "Calculate: F = 15 N"
  ]
}
\`\`\`

#### information
\`\`\`json
{
  "id": "<uuid>",
  "type": "information",
  "heading": "Did you know?",
  "content": "The speed of light in a vacuum is approximately 3 × 10⁸ m/s."
}
\`\`\`

#### cloze
\`\`\`json
{
  "id": "<uuid>",
  "type": "cloze",
  "heading": "Fill in the blanks using the words in the box.",
  "text": "A [force] is needed to change the [velocity] of an object. This is described by Newton's [second] law.",
  "showWordBank": true
}
\`\`\`
- Wrap each answer word in square brackets: \`[word]\`

#### match_them_up
\`\`\`json
{
  "id": "<uuid>",
  "type": "match_them_up",
  "heading": "Match each quantity to its unit.",
  "items": [
    { "id": "<uuid>", "left": "Force", "right": "Newton (N)" },
    { "id": "<uuid>", "left": "Mass", "right": "Kilogram (kg)" },
    { "id": "<uuid>", "left": "Acceleration", "right": "m/s²" }
  ]
}
\`\`\`

#### order_steps
\`\`\`json
{
  "id": "<uuid>",
  "type": "order_steps",
  "heading": "Put these steps in the correct order.",
  "steps": [
    "Record the reading on the newton-meter",
    "Attach the spring to a clamp stand",
    "Add 100 g masses one at a time",
    "Measure the extension of the spring"
  ]
}
\`\`\`

#### figure
\`\`\`json
{
  "id": "<uuid>",
  "type": "figure",
  "caption": "Figure 1: Diagram of a circuit",
  "size": "medium"
}
\`\`\`
- \`size\`: "small" | "medium" | "large"

#### data (table or graph)
\`\`\`json
{
  "id": "<uuid>",
  "type": "data",
  "heading": "Table 1: Results",
  "columns": [
    { "label": "Force", "unit": "N" },
    { "label": "Extension", "unit": "cm" }
  ],
  "rows": [
    ["1.0", "2.0"],
    ["2.0", "4.1"],
    ["3.0", "6.0"],
    ["4.0", "8.2"],
    ["5.0", "10.0"]
  ],
  "display": "graph",
  "graph": {
    "xCol": 0,
    "yCol": 1,
    "showXLabel": true,
    "showYLabel": true,
    "showXScale": true,
    "showYScale": true,
    "omitRows": [],
    "fitType": "linear",
    "linkedDataId": null
  }
}
\`\`\`
- \`display\`: "table" | "graph" | "bar"
- \`omitRows\`: indices of rows to hide from students (leave empty to show all data points)
- \`fitType\`: "none" | "linear" | "curve"

#### spacer
\`\`\`json
{
  "id": "<uuid>",
  "type": "spacer",
  "size": "small"
}
\`\`\`
- \`size\`: "small" | "medium" | "large"

---

## Rules

1. Generate all UUIDs as random strings like \`"b3f2a1d0-0001"\`, \`"b3f2a1d0-0002"\`, etc. — unique within the document.
2. Always start with a \`header\` block, then an \`instructions\` block.
3. Use \`parts\` for multi-part questions (a, b, c…). Single questions with one answer go at the top level.
4. Every question and part must have a \`markScheme\` string — even if brief.
5. Mark scheme text should use \`[1]\` notation: e.g. \`"Correct answer [1]; correct unit [1]"\`
6. Keep language age-appropriate and use correct scientific terminology.
7. Exam command words: \`describe\`, \`explain\`, \`calculate\`, \`state\`, \`suggest\`, \`evaluate\` — use the right one for the marks/AO.
8. Output only the JSON object — no markdown fences, no commentary after the object.`
}
