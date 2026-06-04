import { useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Topbar } from '../components/layout/Topbar'
import { useProfileContext } from '../context/ProfileContext'
import { useSupabaseWorksheets, type WorksheetEntry } from '../hooks/useSupabaseWorksheets'
import { offeringLabel } from '../data/qualifications'
import { type BookletEntry } from '../components/pdf/BookletPDF'
import { BookletPrintView } from '../components/BookletPrintView'
import type { Worksheet } from '../types/worksheet'
import './BookletPage.css'

const bookletPrintStyle = `
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; background: white; }
  .booklet-print-root { display: block !important; gap: 0 !important; }
  .a4-page {
    width: 794px !important;
    height: 1123px !important;
    box-shadow: none !important;
    page-break-after: always;
    break-after: page;
  }
  [aria-hidden="true"] { display: none !important; }
  .preview-block-wrap { outline: none !important; cursor: default !important; }
  .preview-block-wrap::after { display: none !important; }
  .ws-pages { display: block !important; }
`

const BOARD_COLORS: Record<string, string> = {
  AQA: '#1e3a5f', OCR: '#1d4ed8', Edexcel: '#7c2d12', WJEC: '#166534', Hodder: '#065f46',
}
const BLOCK_TYPE_COLORS: Record<string, string> = {
  question: '#16a34a', multiple_choice: '#0891b2', worked_example: '#c2410c',
  information: '#b45309', match_them_up: '#7c3aed', cloze: '#db2777',
  order_steps: '#4338ca', data: '#0d9488',
}

function MiniPage({ worksheet, boardColor }: { worksheet: Worksheet; boardColor: string }) {
  return (
    <div className="booklet-minipage">
      {worksheet.blocks.slice(0, 20).map((block, i) => (
        <div key={i} className="booklet-miniblock" style={{
          background: block.type === 'header'
            ? boardColor
            : (BLOCK_TYPE_COLORS[block.type] ?? '#9ca3af') + '33',
          height: block.type === 'header' ? 10 : block.type === 'spacer' ? 3 : 5,
          width: block.type === 'header' ? '100%' : block.type === 'spacer' ? '40%' : undefined,
        }} />
      ))}
    </div>
  )
}

function WorksheetBrowserCard({ entry, inBooklet, onAdd, onRemove }: {
  entry: WorksheetEntry
  inBooklet: boolean
  onAdd: () => void
  onRemove: () => void
}) {
  const color = BOARD_COLORS[entry.exam_board] ?? '#374151'
  const qualLabel = offeringLabel(entry.qualification_id, entry.exam_board)

  return (
    <div className={`booklet-browser-card${inBooklet ? ' booklet-browser-card--added' : ''}`}>
      <div className="booklet-browser-card-color" style={{ background: color }} />
      <div className="booklet-browser-card-body">
        <div className="booklet-browser-card-title">{entry.title || 'Untitled'}</div>
        {entry.topic && <div className="booklet-browser-card-topic">{entry.topic}</div>}
        {qualLabel && <div className="booklet-browser-card-qual">{qualLabel}</div>}
        <MiniPage worksheet={entry.worksheet} boardColor={color} />
      </div>
      <button
        type="button"
        className={`booklet-browser-card-btn${inBooklet ? ' booklet-browser-card-btn--remove' : ''}`}
        onClick={inBooklet ? onRemove : onAdd}
        title={inBooklet ? 'Remove from booklet' : 'Add to booklet'}
      >
        {inBooklet ? '−' : '+'}
      </button>
    </div>
  )
}

function BookletItem({ item, index, onRemove, onDragStart, onDragOver, onDrop }: {
  item: BookletEntry
  index: number
  onRemove: () => void
  onDragStart: (i: number) => void
  onDragOver: (e: React.DragEvent, i: number) => void
  onDrop: (i: number) => void
}) {
  const color = BOARD_COLORS[item.worksheet.blocks.find(b => b.type === 'header') ?
    (item.worksheet.blocks.find(b => b.type === 'header') as { examBoard?: string })?.examBoard ?? 'AQA'
    : 'AQA'] ?? '#374151'

  return (
    <div
      className="booklet-item"
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={e => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
    >
      <div className="booklet-item-handle" title="Drag to reorder">⠿</div>
      <div className="booklet-item-num" style={{ background: color }}>{index + 1}</div>
      <div className="booklet-item-info">
        <div className="booklet-item-title">{item.title || 'Untitled'}</div>
        {item.topic && <div className="booklet-item-topic">{item.topic}</div>}
        {item.qualLabel && <div className="booklet-item-qual">{item.qualLabel}</div>}
      </div>
      <button type="button" className="booklet-item-remove" onClick={onRemove} title="Remove">×</button>
    </div>
  )
}

export function BookletPage() {
  const { profile } = useProfileContext()
  const { entries, loading } = useSupabaseWorksheets(profile?.id ?? null)

  // Booklet state
  const [bookletTitle, setBookletTitle] = useState('Revision Booklet')
  const [bookletSubtitle, setBookletSubtitle] = useState('')
  const [bookletEntries, setBookletEntries] = useState<BookletEntry[]>([])

  // Browser filter state
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')

  // Drag state
  const dragIndex = useRef<number | null>(null)

  // Print
  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: bookletTitle || 'booklet',
    pageStyle: bookletPrintStyle,
  })

  const courseTabs = (profile?.user_courses ?? []).map(uc => ({
    key: `${uc.exam_board}:${uc.qualification_id}`,
    label: offeringLabel(uc.qualification_id, uc.exam_board),
  }))

  const q = search.trim().toLowerCase()
  const filtered = entries.filter(e => {
    if (courseFilter !== 'all') {
      if (`${e.exam_board}:${e.qualification_id}` !== courseFilter) return false
    }
    if (q) {
      const match = (e.title ?? '').toLowerCase().includes(q) || (e.topic ?? '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })

  const bookletIds = new Set(bookletEntries.map(e => e.id))

  function addToBooklet(entry: WorksheetEntry) {
    if (bookletIds.has(entry.id)) return
    const qualLabel = offeringLabel(entry.qualification_id, entry.exam_board)
    setBookletEntries(prev => [...prev, {
      id: entry.id,
      title: entry.title,
      topic: entry.topic,
      qualLabel: qualLabel || '',
      worksheet: entry.worksheet,
    }])
  }

  function removeFromBooklet(id: string) {
    setBookletEntries(prev => prev.filter(e => e.id !== id))
  }

  function handleDragStart(i: number) { dragIndex.current = i }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === i) return
  }

  function handleDrop(targetIndex: number) {
    const from = dragIndex.current
    if (from === null || from === targetIndex) return
    setBookletEntries(prev => {
      const updated = [...prev]
      const [moved] = updated.splice(from, 1)
      updated.splice(targetIndex, 0, moved)
      return updated
    })
    dragIndex.current = null
  }

  const canDownload = bookletEntries.length > 0 && bookletTitle.trim()

  return (
    <div className="booklet-layout">
      <Topbar />

      <div className="booklet-page">
        {/* ── Left: worksheet browser ─────────────────────────── */}
        <aside className="booklet-browser">
          <div className="booklet-browser-header">
            <h2 className="booklet-browser-title">Worksheets</h2>
            <p className="booklet-browser-hint">Click + to add to your booklet</p>
          </div>

          <div className="booklet-browser-filters">
            <input
              className="booklet-search"
              type="search"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {courseTabs.length > 0 && (
              <div className="booklet-tabs">
                <button
                  className={`booklet-tab${courseFilter === 'all' ? ' booklet-tab--active' : ''}`}
                  onClick={() => setCourseFilter('all')}
                >All</button>
                {courseTabs.map(ct => (
                  <button
                    key={ct.key}
                    className={`booklet-tab${courseFilter === ct.key ? ' booklet-tab--active' : ''}`}
                    onClick={() => setCourseFilter(ct.key)}
                  >{ct.label}</button>
                ))}
              </div>
            )}
          </div>

          <div className="booklet-browser-list">
            {loading ? (
              <div className="booklet-browser-empty">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="booklet-browser-empty">
                {entries.length === 0
                  ? 'No saved worksheets yet. Create some in the editor first.'
                  : 'No worksheets match your filter.'}
              </div>
            ) : (
              filtered.map(e => (
                <WorksheetBrowserCard
                  key={e.id}
                  entry={e}
                  inBooklet={bookletIds.has(e.id)}
                  onAdd={() => addToBooklet(e)}
                  onRemove={() => removeFromBooklet(e.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Right: booklet composer ──────────────────────────── */}
        <main className="booklet-composer">
          <div className="booklet-composer-inner">
            {/* Title page editor */}
            <section className="booklet-section">
              <h3 className="booklet-section-heading">Title page</h3>
              <div className="booklet-title-fields">
                <div className="booklet-field">
                  <label className="booklet-label">Booklet title</label>
                  <input
                    className="booklet-input"
                    value={bookletTitle}
                    onChange={e => setBookletTitle(e.target.value)}
                    placeholder="e.g. GCSE Physics Revision Booklet"
                  />
                </div>
                <div className="booklet-field">
                  <label className="booklet-label">Subtitle <span className="booklet-optional">(optional)</span></label>
                  <input
                    className="booklet-input"
                    value={bookletSubtitle}
                    onChange={e => setBookletSubtitle(e.target.value)}
                    placeholder="e.g. Year 11 — AQA Higher Tier"
                  />
                </div>
              </div>
            </section>

            {/* Contents info */}
            <section className="booklet-section">
              <h3 className="booklet-section-heading">
                Contents
                <span className="booklet-section-badge">auto-generated</span>
              </h3>
              <p className="booklet-section-hint">
                A contents page with page numbers is generated automatically from the worksheets below.
              </p>
            </section>

            {/* Worksheet order */}
            <section className="booklet-section booklet-section--worksheets">
              <h3 className="booklet-section-heading">
                Worksheets
                {bookletEntries.length > 0 && (
                  <span className="booklet-section-badge">{bookletEntries.length}</span>
                )}
              </h3>

              {bookletEntries.length === 0 ? (
                <div className="booklet-empty">
                  <div className="booklet-empty-icon">📋</div>
                  <p>Add worksheets from the browser on the left.</p>
                  <p className="booklet-empty-hint">Drag to reorder once added.</p>
                </div>
              ) : (
                <div className="booklet-items">
                  {bookletEntries.map((item, i) => (
                    <BookletItem
                      key={item.id}
                      item={item}
                      index={i}
                      onRemove={() => removeFromBooklet(item.id)}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Print */}
            <div className="booklet-download-bar">
              <button
                className={`booklet-download-btn${!canDownload ? ' booklet-download-btn--disabled' : ''}`}
                disabled={!canDownload}
                onClick={() => canDownload && handlePrint()}
              >
                Print / Save PDF
              </button>
              {bookletEntries.length > 0 && (
                <p className="booklet-download-hint">
                  {bookletEntries.length} worksheet{bookletEntries.length !== 1 ? 's' : ''} · title page · contents page · mark schemes
                </p>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Off-screen booklet for printing */}
      <div className="booklet-print-hidden">
        <BookletPrintView
          ref={printRef}
          bookletTitle={bookletTitle}
          bookletSubtitle={bookletSubtitle || undefined}
          entries={bookletEntries}
        />
      </div>
    </div>
  )
}
