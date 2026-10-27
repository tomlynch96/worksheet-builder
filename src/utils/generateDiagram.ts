import type { DiagramVariable } from '../types/diagram'
import type { Block, FigureBlock, Worksheet } from '../types/worksheet'
import { figureUpdatesForDiagram, sanitizeSvg, syncVariables } from './diagramSvg'

export interface GeneratedQuestionPart {
  label: string
  stem: string
  marks: number
  lines: number
  markScheme?: string
  numericalAnswer?: string
}

// Question text may contain {{key}} placeholders that match the diagram's variables.
export interface GeneratedQuestion {
  stem: string
  marks: number
  lines: number
  markScheme?: string
  numericalAnswer?: string
  parts: GeneratedQuestionPart[]
}

export interface DiagramDraft {
  title: string
  description: string
  caption: string
  template: string
  variables: DiagramVariable[]
  topics: string[]
  specPoints: string[]
  question: GeneratedQuestion | null
}

const strList = (v: unknown) => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : []

export async function generateDiagram(params: {
  request: string
  context?: string
  includeQuestion?: boolean
  questionContext?: string
  current?: { template: string; variables: DiagramVariable[] }
  history?: string[]
}): Promise<DiagramDraft> {
  const res = await fetch('/api/generate-diagram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const json = await res.json().catch(() => ({})) as { result?: Record<string, unknown>; error?: string }
  if (!res.ok || json.error || !json.result) throw new Error(json.error ?? `HTTP ${res.status}`)
  const r = json.result

  const template = sanitizeSvg(String(r.svg))
  const rawVars = (Array.isArray(r.variables) ? r.variables : []) as Partial<DiagramVariable>[]
  const variables = syncVariables(template, rawVars
    .filter(v => typeof v.key === 'string')
    .map(v => ({ key: v.key!, label: String(v.label ?? v.key), value: String(v.value ?? ''), unit: v.unit ? String(v.unit) : '' })))

  const q = r.question as GeneratedQuestion | null | undefined
  const question = q && typeof q.stem === 'string'
    ? {
        stem: q.stem,
        marks: Number(q.marks) || 0,
        lines: Number(q.lines) || 0,
        markScheme: q.markScheme ?? '',
        numericalAnswer: q.numericalAnswer ?? '',
        parts: (Array.isArray(q.parts) ? q.parts : []).map((p, i) => ({
          label: p.label || 'abcdefgh'[i] || String(i + 1),
          stem: p.stem ?? '',
          marks: Number(p.marks) || 1,
          lines: Number(p.lines) || 2,
          markScheme: p.markScheme ?? '',
          numericalAnswer: p.numericalAnswer ?? '',
        })),
      }
    : null

  return {
    title: String(r.title ?? 'Diagram'),
    description: String(r.description ?? ''),
    caption: String(r.caption ?? ''),
    template,
    variables,
    topics: strList(r.topics),
    specPoints: strList(r.specPoints),
    question,
  }
}

const MAX_AUTO_DIAGRAMS = 4
const plain = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

// Text of whichever question (or part) a figure is attached to, so the drawing matches it
function attachedQuestionText(blocks: Block[], figureId: string): string | undefined {
  for (const b of blocks) {
    if (b.type !== 'question' && b.type !== 'multiple_choice') continue
    if (b.attachedFigureId === figureId) {
      const parts = b.type === 'question' ? b.parts.map(p => `(${p.label}) ${plain(p.stem)}`) : []
      return [plain(b.stem), ...parts].filter(Boolean).join('\n')
    }
    if (b.type === 'question') {
      const part = b.parts.find(p => p.attachedFigureId === figureId)
      if (part) return [plain(b.stem), `(${part.label}) ${plain(part.stem)}`].filter(Boolean).join('\n')
    }
  }
  return undefined
}

// A generated worksheet may contain figure blocks with only a diagramRequest.
// Draw them in parallel; any that fail keep their request so the teacher can
// open the diagram studio on them later.
export async function drawRequestedDiagrams(worksheet: Worksheet, context: string): Promise<Worksheet> {
  const pending = worksheet.blocks
    .filter((b): b is FigureBlock => b.type === 'figure' && !!b.diagramRequest && !b.diagram)
    .slice(0, MAX_AUTO_DIAGRAMS)
  if (!pending.length) return worksheet

  const drawn = await Promise.all(pending.map(async fig => {
    try {
      const questionText = attachedQuestionText(worksheet.blocks, fig.id)
      const draft = await generateDiagram({
        request: fig.diagramRequest!,
        context,
        questionContext: questionText
          ? `${questionText}\nDraw exactly what this question describes, with the values it gives as the default labels.`
          : undefined,
      })
      const updates = await figureUpdatesForDiagram({ template: draft.template, variables: draft.variables, prompts: [fig.diagramRequest!] })
      return [fig.id, { ...updates, diagramRequest: undefined }] as const
    } catch (err) {
      console.error('[diagrams] auto-draw failed:', err)
      return null
    }
  }))

  const updates = new Map(drawn.filter(d => d !== null))
  return {
    ...worksheet,
    blocks: worksheet.blocks.map(b => updates.has(b.id) ? { ...b, ...updates.get(b.id) } as Block : b),
  }
}
