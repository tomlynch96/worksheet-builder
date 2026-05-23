import type { Block, FigureBlock, SpacerBlock } from '../types/worksheet'

// A4 at 96dpi = 1123px. Margins 68px top + bottom = 987px content area.
export const PAGE_CONTENT_HEIGHT = 987

// Heights are derived from PDF pt values × 1.333 (96dpi px-per-pt) to keep
// pagination estimates in sync with what react-pdf actually renders.
export function estimateBlockHeight(block: Block): number {
  switch (block.type) {
    case 'header': return 150
    case 'instructions': return 44 + block.items.length * 22
    case 'question':
      if (block.parts.length === 0) return 60 + block.lines * 28
      return 60 + block.parts.reduce((acc: number, p: { lines: number }) => acc + 40 + p.lines * 28, 0)
    case 'multiple_choice': return 48 + block.options.length * 26
    case 'worked_example': return 72 + block.steps.length * 25
    case 'information': return 72
    case 'match_them_up': return 44 + block.items.length * 46
    case 'cloze': return 120
    case 'order_steps': return 44 + block.steps.length * 30
    case 'figure': return ({ small: 114, medium: 174, large: 234 } as Record<FigureBlock['size'], number>)[block.size]
    case 'spacer': return ({ small: 16, medium: 32, large: 56 } as Record<SpacerBlock['size'], number>)[block.size]
    case 'data': {
      if (block.display === 'table') return 62 + block.rows.length * 22
      if (block.display === 'bar') return 320
      return 340  // graph: SVG 300px + heading 22px + margin 12px + buffer 6px
    }
    case 'numerical_answers': return 80
  }
}

export function splitIntoPages(blocks: Block[], heightOf?: (block: Block) => number): Block[][] {
  const h = heightOf ?? estimateBlockHeight
  const pages: Block[][] = [[]]
  let used = 0
  for (const block of blocks) {
    const blockH = h(block)
    if (used + blockH > PAGE_CONTENT_HEIGHT && pages[pages.length - 1].length > 0) {
      pages.push([])
      used = 0
    }
    pages[pages.length - 1].push(block)
    used += blockH
  }
  return pages
}
