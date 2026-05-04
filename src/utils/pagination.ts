import type { Block, FigureBlock, SpacerBlock } from '../types/worksheet'

// A4 at 96dpi = 1123px. Margins 68px top + bottom = 987px content area.
export const PAGE_CONTENT_HEIGHT = 987

export function estimateBlockHeight(block: Block): number {
  switch (block.type) {
    case 'header': return 150
    case 'instructions': return 48 + block.items.length * 22
    case 'question':
      if (block.parts.length === 0) return 48 + block.lines * 28
      return 48 + block.parts.reduce((acc: number, p: { lines: number }) => acc + 32 + p.lines * 28, 0)
    case 'multiple_choice': return 48 + block.options.length * 26
    case 'worked_example': return 52 + block.steps.length * 22
    case 'information': return 70
    case 'match_them_up': return 56 + block.items.length * 38
    case 'cloze': return 110
    case 'order_steps': return 56 + block.steps.length * 34
    case 'figure': return ({ small: 96, medium: 158, large: 218 } as Record<FigureBlock['size'], number>)[block.size]
    case 'spacer': return ({ small: 16, medium: 32, large: 56 } as Record<SpacerBlock['size'], number>)[block.size]
    case 'data': return block.display === 'graph' ? 320 : 60 + block.rows.length * 26
  }
}

export function splitIntoPages(blocks: Block[]): Block[][] {
  const pages: Block[][] = [[]]
  let used = 0

  for (const block of blocks) {
    const h = estimateBlockHeight(block)
    if (used + h > PAGE_CONTENT_HEIGHT && pages[pages.length - 1].length > 0) {
      pages.push([])
      used = 0
    }
    pages[pages.length - 1].push(block)
    used += h
  }

  return pages
}
