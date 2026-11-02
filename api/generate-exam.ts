import type { VercelRequest, VercelResponse } from '@vercel/node'
import { FORMATTING_RULES, WORKSHEET_FORMAT, fixDataBlocks, type Block } from './generate-worksheet.js'

// Two modes:
//   split    — page images of an exemplar paper → the paper's top-level questions,
//              each with its marks and where it sits on the pages (for thumbnails).
//   generate — cropped images of the questions the teacher picked → a new exam in the
//              same style with changed numbers and contexts, scaled to a mark total.

export const config = { maxDuration: 300 }

const MODEL = 'claude-opus-5-5'

const SYSTEM_SPLIT = `You read scanned or exported pages of a UK secondary science exam paper (GCSE, A level, KS3) and list its questions.

For every top-level numbered question (1, 2, 3 … or 01, 02 …) return:
- "number": the question number exactly as printed, e.g. "3" or "07".
- "marks": the total marks for the whole question including all sub-parts. Add up the bracketed marks, e.g. [2] (3 marks). If a total is printed, use it.
- "summary": one short line saying what it assesses, e.g. "Specific heat capacity practical: table, graph and calculation".
- "hasDiagram": true if the question includes a diagram, circuit, apparatus drawing or graph (not just a table).
- "segments": where the question appears. One entry per page it covers, in order: { "page": <0-based index of the image>, "top": <0–1>, "bottom": <0–1> }. top and bottom are fractions of that page's height. Start each question at its number and end just before the next question starts (or at the end of that page's content). Include its tables, figures and answer space. If a question continues onto the next page, add a second segment starting at the top content of that page.

Ignore cover pages, formula/equation sheets, periodic tables, blank pages and "turn over" footers. Do not split sub-parts (a), (b) into separate questions.
The image index is the order the images are given, starting at 0 — use the label before each image.`

const SPLIT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['paperTitle', 'questions'],
  properties: {
    paperTitle: { type: 'string' },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['number', 'marks', 'summary', 'hasDiagram', 'segments'],
        properties: {
          number: { type: 'string' },
          marks: { type: 'integer' },
          summary: { type: 'string' },
          hasDiagram: { type: 'boolean' },
          segments: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['page', 'top', 'bottom'],
              properties: {
                page: { type: 'integer' },
                top: { type: 'number' },
                bottom: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
}

const SYSTEM_GENERATE = `You write UK secondary science exam papers. A teacher has picked questions from real exemplar papers. You write a NEW paper that replicates them as closely as possible, so it feels like a sibling paper from the same exam board — but pupils cannot recall the answers.

## Replicating each exemplar question
- Produce one question for each exemplar question, in the order given (unless mark changes below require cutting one).
- Keep: the structure (same number of sub-parts in the same order), the command words, the skills each part assesses, the mark allocation per part, the question type (multiple choice stays multiple choice, a 6-mark extended response stays one), the reading level and the answer space.
- Change: every number and numerical value (keep them realistic and keep the arithmetic the same difficulty), and the context/scenario (different object, organism, substance, setting or experiment that tests the same physics/chemistry/biology). Answers must not be the same as the exemplar's.
- Recreate tables and graphs as data blocks, with new data that fits the new context, attached to the question exactly as in the format guide.
- DIAGRAMS. If the exemplar question has a diagram that pupils need (apparatus, circuit, ray diagram, forces, field lines, graph sketch, etc.), add a figure block with a "diagramRequest" describing the equivalent diagram for your new context, with every label and value the question relies on. Attach it with "attachedFigureId" on the question (or the part that uses it) and place it immediately before the question in the blocks array. Refer to it as "Figure 1", "Figure 2"… numbered through the paper. Do not set imageUrl or imageData. Skip photos or decorative images that pupils do not need. At most 8 diagrams.
- Mark schemes in the exam board's style: one marking point per mark with [1], accept/allow alternatives where an examiner would, "ecf" where a later calculation step depends on an earlier one. Level-of-response descriptors for 6-mark extended responses (Level 3: 5–6 marks … Level 1: 1–2 marks) plus indicative content.
- numericalAnswer for every part whose answer is a single number.
- Answer lines: match the exemplar's answer space; roughly 2 lines per mark for written answers, 4–6 lines for calculations.

## Hitting the requested total
The teacher asks for a total number of marks. The paper's marks MUST add up to exactly that number.
- If it is fewer than the exemplars' total: cut whole sub-parts first (the least essential ones, keeping each question coherent), then whole questions, then reduce a part's marks. Keep each remaining question as close to its exemplar as possible.
- If it is more: first add sub-parts in the style of the existing ones (a further calculation, an "explain" follow-up, an evaluation), then add whole new questions that mirror the style, difficulty and topic coverage of the exemplars.
- Count the marks before you answer. multiple_choice marks are in "marks"; question marks are the sum of the parts' marks (or the question's own marks when it has no parts).

## Output
Return ONLY a raw JSON object { "id": "exam", "blocks": [ ... ] } — no prose, no markdown fences.
Do NOT include header, instructions, information, worked_example or numerical_answers blocks — the app adds the front page. Use only: question, multiple_choice, data, figure and (rarely) spacer blocks.
${FORMATTING_RULES}
${WORKSHEET_FORMAT}`

interface ExemplarQuestion {
  source: string
  number: string
  marks: number
  summary?: string
  images: string[]   // base64 JPEG, no data: prefix
}

type ImagePart = { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } }
type TextPart = { type: 'text'; text: string }

const img = (data: string): ImagePart => ({
  type: 'image',
  source: { type: 'base64', media_type: 'image/jpeg', data: data.replace(/^data:image\/\w+;base64,/, '') },
})

async function callClaude(apiKey: string, body: Record<string, unknown>) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    body: JSON.stringify({ model: MODEL, fallbacks: 'default', ...body }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw Object.assign(new Error(`Anthropic API error ${res.status}: ${text.slice(0, 300)}`), { status: 502 })
  }
  const data = await res.json() as { stop_reason?: string; content: { type: string; text?: string }[] }
  if (data.stop_reason === 'refusal') {
    throw Object.assign(new Error('The AI declined this request. Try different exemplar questions.'), { status: 422 })
  }
  if (data.stop_reason === 'max_tokens') {
    throw Object.assign(new Error('The exam was too long to generate in one go. Try fewer marks or fewer exemplar questions.'), { status: 502 })
  }
  // Thinking comes first, so take the text block rather than content[0]
  return data.content.filter(b => b.type === 'text').map(b => b.text ?? '').join('')
}

function parseJSON(raw: string): unknown {
  const stripped = raw.replace(/^```[a-z]*\n?/gm, '').replace(/^```\s*$/gm, '').trim()
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start < 0 || end < start) throw Object.assign(new Error('The AI returned an unexpected response. Try again.'), { status: 502 })
  try {
    return JSON.parse(stripped.slice(start, end + 1))
  } catch {
    throw Object.assign(new Error('The AI returned malformed JSON. Try again.'), { status: 502 })
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'ANTHROPIC_API_KEY is not set in Vercel environment variables.' })

  const { mode } = req.body as { mode?: string }

  try {
    if (mode === 'split') {
      const { pages, fileName } = req.body as { pages: string[]; fileName?: string }
      if (!Array.isArray(pages) || pages.length === 0) return res.status(400).json({ error: 'No pages to read.' })
      const content: (ImagePart | TextPart)[] = []
      pages.forEach((p, i) => {
        content.push({ type: 'text', text: `Image ${i}:` })
        content.push(img(p))
      })
      content.push({ type: 'text', text: `These are the ${pages.length} pages of "${fileName ?? 'an exam paper'}". List its questions.` })

      const raw = await callClaude(apiKey, {
        max_tokens: 16000,
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: SPLIT_SCHEMA } },
        system: SYSTEM_SPLIT,
        messages: [{ role: 'user', content }],
      })
      const parsed = parseJSON(raw) as { paperTitle?: string; questions?: unknown[] }
      return res.status(200).json({ result: { paperTitle: parsed.paperTitle ?? '', questions: parsed.questions ?? [] } })
    }

    if (mode === 'generate') {
      const { questions, targetMarks, examBoard, tier, qualification, topic, specPoint, title, extraNotes } = req.body as {
        questions: ExemplarQuestion[]
        targetMarks: number
        examBoard?: string
        tier?: string
        qualification?: string
        topic?: string
        specPoint?: string
        title?: string
        extraNotes?: string
      }
      if (!Array.isArray(questions) || questions.length === 0) return res.status(400).json({ error: 'Pick at least one exemplar question.' })
      const exemplarTotal = questions.reduce((s, q) => s + (Number(q.marks) || 0), 0)
      const target = Number(targetMarks) > 0 ? Number(targetMarks) : exemplarTotal

      const content: (ImagePart | TextPart)[] = []
      questions.forEach((q, i) => {
        content.push({
          type: 'text',
          text: `Exemplar question ${i + 1} (Q${q.number} from "${q.source}", ${q.marks} mark${q.marks === 1 ? '' : 's'}${q.summary ? ` — ${q.summary}` : ''}):`,
        })
        q.images.slice(0, 3).forEach(im => content.push(img(im)))
      })
      content.push({
        type: 'text',
        text: [
          'Write the new exam paper.',
          title ? `Paper title: ${title}` : '',
          examBoard ? `Exam board: ${examBoard}` : '',
          tier ? `Tier: ${tier}` : '',
          qualification ? `Qualification: ${qualification}` : '',
          topic ? `Topic: ${topic}` : '',
          specPoint ? `Spec point: ${specPoint}` : '',
          `The exemplar questions total ${exemplarTotal} marks.`,
          `The new paper MUST total exactly ${target} marks${target === exemplarTotal
            ? ' — keep every part and its marks.'
            : target < exemplarTotal ? ` — cut ${exemplarTotal - target} marks.` : ` — add ${target - exemplarTotal} marks.`}`,
          extraNotes ? `Teacher's notes: ${extraNotes}` : '',
        ].filter(Boolean).join('\n'),
      })

      const raw = await callClaude(apiKey, {
        max_tokens: 32000,
        output_config: { effort: 'high' },
        system: SYSTEM_GENERATE,
        messages: [{ role: 'user', content }],
      })
      const parsed = parseJSON(raw) as { id?: string; blocks?: unknown[] }
      if (!Array.isArray(parsed.blocks)) return res.status(502).json({ error: 'The AI did not return any questions. Try again.' })
      parsed.blocks = fixDataBlocks(parsed.blocks as Block[]) as unknown[]
      return res.status(200).json({ result: JSON.stringify({ id: parsed.id ?? 'exam', blocks: parsed.blocks }) })
    }

    return res.status(400).json({ error: `Unknown mode: ${mode}` })
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500
    return res.status(status).json({ error: err instanceof Error ? err.message : String(err) })
  }
}
