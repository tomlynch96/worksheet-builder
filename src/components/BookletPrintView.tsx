import { forwardRef, useState, useCallback } from 'react'
import { WorksheetPreview } from './preview/WorksheetPreview'
import { splitIntoPages } from '../utils/pagination'
import { getPDFRenderableBlocks } from './pdf/WorksheetPDF'
import type { BookletEntry } from './pdf/BookletPDF'
import './BookletPrintView.css'

interface Props {
  bookletTitle: string
  bookletSubtitle?: string
  entries: BookletEntry[]
}

function estimatePageCount(entry: BookletEntry): number {
  const blocks = getPDFRenderableBlocks(entry.worksheet)
  const pages = splitIntoPages(blocks)
  return Math.max(1, pages.length)
}

export const BookletPrintView = forwardRef<HTMLDivElement, Props>(function BookletPrintView(
  { bookletTitle, bookletSubtitle, entries },
  ref,
) {
  // Track actual page counts as WorksheetPreview reports them after measurement.
  // Falls back to estimates until measured values arrive.
  const [actualPageCounts, setActualPageCounts] = useState<(number | null)[]>(
    () => entries.map(() => null),
  )

  const handlePageCount = useCallback((index: number, count: number) => {
    setActualPageCounts(prev => {
      if (prev[index] === count) return prev
      const next = [...prev]
      next[index] = count
      return next
    })
  }, [])

  const pageCounts = entries.map((e, i) => actualPageCounts[i] ?? estimatePageCount(e))

  // Page 1 = title, page 2 = contents, worksheets start at 3
  const contentsRows = entries.map((entry, i) => ({
    entry,
    startPage: 3 + pageCounts.slice(0, i).reduce((a, b) => a + b, 0),
  }))
  const totalWorksheetPages = pageCounts.reduce((a, b) => a + b, 0)
  const markSchemesStartPage = 3 + totalWorksheetPages

  return (
    <div ref={ref} className="booklet-print-root">

      {/* ── Page 1: Title page ─────────────────────────── */}
      <div className="a4-page booklet-title-page">
        <div className="booklet-title-inner">
          <div className="booklet-title-eyebrow">Worksheet Booklet</div>
          <div className="booklet-title-divider" />
          <h1 className="booklet-title-text">{bookletTitle}</h1>
          {bookletSubtitle && (
            <p className="booklet-subtitle-text">{bookletSubtitle}</p>
          )}
        </div>
        <div className="booklet-title-footer">Worksheet Booklet</div>
      </div>

      {/* ── Page 2: Contents page ──────────────────────── */}
      <div className="a4-page booklet-contents-page">
        <div className="booklet-contents-inner">
          <h2 className="booklet-contents-heading">Contents</h2>
          <div className="booklet-contents-rule" />

          {contentsRows.map(({ entry, startPage }, i) => (
            <div key={entry.id} className="booklet-contents-row">
              <span className="booklet-contents-index">{i + 1}.</span>
              <div className="booklet-contents-text">
                <div className="booklet-contents-entry-title">{entry.title || 'Untitled'}</div>
                {entry.qualLabel && (
                  <div className="booklet-contents-qual">{entry.qualLabel}</div>
                )}
              </div>
              <div className="booklet-contents-dots" />
              <span className="booklet-contents-pagenum">{startPage}</span>
            </div>
          ))}

          {entries.length > 0 && (
            <div className="booklet-contents-row booklet-contents-row--ms">
              <span className="booklet-contents-index" />
              <div className="booklet-contents-text">
                <div className="booklet-contents-entry-title booklet-contents-entry-title--ms">
                  Mark Schemes
                </div>
              </div>
              <div className="booklet-contents-dots" />
              <span className="booklet-contents-pagenum">{markSchemesStartPage}</span>
            </div>
          )}
        </div>
        <div className="a4-page-number" />
      </div>

      {/* ── Worksheet pages ────────────────────────────── */}
      {entries.map((entry, i) => (
        <WorksheetPreview
          key={entry.id}
          worksheet={entry.worksheet}
          mode="worksheet"
          startPage={contentsRows[i].startPage}
          onPageCountChange={count => handlePageCount(i, count)}
        />
      ))}

      {/* ── Mark scheme pages ──────────────────────────── */}
      {entries.map((entry, i) => (
        <WorksheetPreview
          key={`ms-${entry.id}`}
          worksheet={entry.worksheet}
          mode="markscheme"
          startPage={markSchemesStartPage + i}
        />
      ))}
    </div>
  )
})
