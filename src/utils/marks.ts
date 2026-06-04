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
