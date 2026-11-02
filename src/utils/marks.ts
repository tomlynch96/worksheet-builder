import type { Block } from '../types/worksheet'
import { extractClozeWords } from './shuffle'

export function computeBlockMarks(block: Block): number {
  switch (block.type) {
    case 'question':
      if (block.parts.length > 0) return block.parts.reduce((s, p) => s + (p.marks ?? 0), 0)
      return block.marks ?? 0
    case 'multiple_choice': return block.marks ?? 0
    case 'match_them_up': return block.items.length
    case 'cloze': return extractClozeWords(block.text).length
    case 'order_steps': return block.steps.length
    default: return 0
  }
}

export function computeTotalMarks(blocks: Block[]): number {
  return blocks.reduce((sum, b) => sum + computeBlockMarks(b), 0)
}

const NUMBERED_TYPES = new Set(['question', 'multiple_choice', 'match_them_up', 'cloze', 'order_steps'])

export interface QuestionMarks { id: string; num: number; marks: number; type: Block['type'] }

// Question numbers exactly as the preview numbers them, with each question's marks.
export function questionMarksList(blocks: Block[]): QuestionMarks[] {
  const out: QuestionMarks[] = []
  for (const b of blocks) {
    if (!NUMBERED_TYPES.has(b.type)) continue
    out.push({ id: b.id, num: out.length + 1, marks: computeBlockMarks(b), type: b.type })
  }
  return out
}

export const DEFAULT_EXAM_INSTRUCTIONS = [
  'Use black ink or black ball-point pen.',
  'Answer all questions in the spaces provided.',
  'Do all rough work in this book.',
  'Show all your working in calculation questions.',
]

export const DEFAULT_EXAM_INFORMATION = [
  'The marks for each question are shown in brackets.',
  'You are expected to use a calculator where appropriate.',
  'You are reminded of the need for good English and clear presentation in your answers.',
]
