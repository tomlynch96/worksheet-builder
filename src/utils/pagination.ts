import type { Block, FigureBlock, QuestionBlock, SpacerBlock } from '../types/worksheet'

// A4 at 96dpi = 1123px. Margins 68px top/bottom = 987px content area.
// 44px is reserved at the bottom of every page for the footer zone.
export const PAGE_CONTENT_HEIGHT = 943

// Approximate height taken by the question stem row (number + text line).
const QUESTION_STEM_OVERHEAD = 48

// Heights are derived from PDF pt values × 1.333 (96dpi px-per-pt) to keep
// pagination estimates in sync with what react-pdf actually renders.
export function estimateBlockHeight(block: Block): number {
  switch (block.type) {
    case 'header': return 150
    case 'instructions': return 44 + block.items.length * 22
    case 'question':
      if (block.parts.length === 0) return 60 + block.lines * 28
      return QUESTION_STEM_OVERHEAD + block.parts.reduce((acc: number, p: { lines: number }) => acc + 40 + p.lines * 28, 0)
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

function estimatePartHeight(part: { lines: number }): number {
  return 40 + part.lines * 28
}

// A block that may represent a continuation of a question across a page break.
export type PageBlock = Block & { _isContinuation?: boolean }

export function splitIntoPages(blocks: Block[], heightOf?: (block: Block) => number): PageBlock[][] {
  const h = heightOf ?? estimateBlockHeight
  const pages: PageBlock[][] = [[]]
  let used = 0

  const currentPage = () => pages[pages.length - 1]
  const newPage = () => { pages.push([]); used = 0 }

  for (const block of blocks) {
    if (block.type === 'question' && (block as QuestionBlock).parts.length > 0) {
      const q = block as QuestionBlock

      // Derive the stem+attachments overhead from the measured/estimated total height.
      // h(block) covers stem + attached data/figures + all parts, so subtracting the
      // estimated parts height gives us the true cost before any parts begin.
      const partsEstimate = q.parts.reduce((acc, p) => acc + estimatePartHeight(p), 0)
      const stemOverhead = Math.max(QUESTION_STEM_OVERHEAD, h(block) - partsEstimate)

      let partIdx = 0
      let isContinuation = false

      while (partIdx < q.parts.length) {
        // Continuation pages only need a small label (~20px); no stem/figure re-render.
        const overhead = isContinuation ? 20 : stemOverhead

        // Start a new page if this batch won't fit and current page isn't empty
        if (used + overhead > PAGE_CONTENT_HEIGHT && currentPage().length > 0) {
          newPage()
        }

        // Greedily fit as many parts as possible on this page
        let pageUsed = used + overhead
        let batchEnd = partIdx

        while (batchEnd < q.parts.length) {
          const ph = estimatePartHeight(q.parts[batchEnd])
          if (pageUsed + ph > PAGE_CONTENT_HEIGHT && batchEnd > partIdx) break
          pageUsed += ph
          batchEnd++
        }

        // Guarantee progress to prevent infinite loops
        if (batchEnd === partIdx) batchEnd = partIdx + 1

        const pageBlock: PageBlock = {
          ...q,
          parts: q.parts.slice(partIdx, batchEnd),
          _isContinuation: isContinuation,
        }

        currentPage().push(pageBlock)
        used = pageUsed

        partIdx = batchEnd
        isContinuation = true

        if (partIdx < q.parts.length) newPage()
      }
    } else {
      const blockH = h(block)
      if (used + blockH > PAGE_CONTENT_HEIGHT && currentPage().length > 0) {
        newPage()
      }
      currentPage().push(block as PageBlock)
      used += blockH
    }
  }

  return pages
}
