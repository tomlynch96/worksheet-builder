import { createContext, useContext } from 'react'
import type { QuestionBlock, QuestionPart } from '../../types/worksheet'
import type { DiagramVariable } from '../../types/diagram'
import type { GeneratedQuestion } from '../../utils/generateDiagram'
import { fillText } from '../../utils/diagramSvg'

// Worksheet-level details the diagram studio needs wherever a figure is edited:
// prompt context, default library tags, and who to save the diagram as.
export interface DiagramCtx {
  context: string
  topic?: string
  specPoint?: string
  examBoard?: string
  qualification?: string
  profileId?: string
}

const Ctx = createContext<DiagramCtx>({ context: '' })

export const DiagramContextProvider = Ctx.Provider

export function useDiagramContext() {
  return useContext(Ctx)
}

const plain = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

export function describeQuestion(block: QuestionBlock, partIdx?: number): string {
  if (partIdx != null) {
    const part = block.parts[partIdx]
    return [
      block.stem && `Question stem: ${plain(block.stem)}`,
      `This is part (${part.label}). Write a SINGLE-PART question (parts: []) for this part only.`,
      part.stem && `Current part text: ${plain(part.stem)}`,
    ].filter(Boolean).join('\n')
  }
  return [
    block.stem && `Current stem: ${plain(block.stem)}`,
    ...block.parts.map(p => p.stem && `(${p.label}) ${plain(p.stem)}`),
  ].filter(Boolean).join('\n')
}

// Turn an AI-written question (with {{key}} placeholders) into block updates.
export function questionUpdates(q: GeneratedQuestion, vars: DiagramVariable[]): Partial<QuestionBlock> {
  const f = (s?: string) => fillText(s ?? '', vars)
  return {
    stem: f(q.stem),
    marks: q.parts.length ? 0 : q.marks,
    lines: q.parts.length ? 0 : q.lines,
    markScheme: q.parts.length ? '' : f(q.markScheme),
    numericalAnswer: q.parts.length ? '' : f(q.numericalAnswer),
    parts: q.parts.map(p => ({
      id: crypto.randomUUID(),
      label: p.label,
      stem: f(p.stem),
      marks: p.marks,
      lines: p.lines,
      markScheme: f(p.markScheme),
      numericalAnswer: f(p.numericalAnswer),
    })),
  }
}

export function partUpdates(q: GeneratedQuestion, vars: DiagramVariable[]): Partial<QuestionPart> {
  const f = (s?: string) => fillText(s ?? '', vars)
  const p = q.parts[0]
  if (!p) return { stem: f(q.stem), marks: q.marks || 1, lines: q.lines || 2, markScheme: f(q.markScheme), numericalAnswer: f(q.numericalAnswer) }
  return {
    stem: [q.stem, p.stem].filter(Boolean).map(f).join(' '),
    marks: p.marks, lines: p.lines, markScheme: f(p.markScheme), numericalAnswer: f(p.numericalAnswer),
  }
}
