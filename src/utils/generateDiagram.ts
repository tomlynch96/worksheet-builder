import type { DiagramVariable } from '../types/diagram'
import { sanitizeSvg, syncVariables } from './diagramSvg'

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
