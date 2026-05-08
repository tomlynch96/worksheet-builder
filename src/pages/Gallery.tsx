import type { GalleryEntry } from '../hooks/useSavedWorksheets'
import type { Worksheet } from '../types/worksheet'
import './Gallery.css'

const BLOCK_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  question:        { label: 'Q',       color: '#16a34a' },
  multiple_choice: { label: 'MC',      color: '#0891b2' },
  worked_example:  { label: 'WE',      color: '#c2410c' },
  information:     { label: 'Info',    color: '#b45309' },
  match_them_up:   { label: 'Match',   color: '#7c3aed' },
  cloze:           { label: 'Cloze',   color: '#db2777' },
  order_steps:     { label: 'Order',   color: '#4338ca' },
  figure:          { label: 'Fig',     color: '#475569' },
  data:            { label: 'Data',    color: '#0d9488' },
  spacer:          { label: 'Spacer',  color: '#9ca3af' },
}

const BOARD_COLORS: Record<string, string> = {
  AQA:     '#1e3a5f',
  OCR:     '#1d4ed8',
  Edexcel: '#7c2d12',
  WJEC:    '#166534',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function BlockChip({ type }: { type: string }) {
  const meta = BLOCK_TYPE_LABELS[type]
  if (!meta) return null
  return (
    <span
      className="gallery-chip"
      style={{ background: meta.color + '22', color: meta.color, borderColor: meta.color + '55' }}
    >
      {meta.label}
    </span>
  )
}

function WorksheetThumbnail({
  entry,
  onOpen,
  onDelete,
}: {
  entry: GalleryEntry
  onOpen: (w: Worksheet) => void
  onDelete: (id: string) => void
}) {
  const boardColor = BOARD_COLORS[entry.examBoard] ?? '#374151'
  const tierLabel = entry.tier === 'higher' ? 'Higher' : entry.tier === 'foundation' ? 'Foundation' : entry.tier === 'both' ? '' : entry.tier

  const blockTypes = entry.worksheet.blocks.map(b => b.type).filter(t => t !== 'header' && t !== 'instructions')

  return (
    <div className="gallery-card">
      <div className="gallery-card-header" style={{ background: boardColor }}>
        <div className="gallery-card-badges">
          {entry.examBoard && <span className="gallery-badge gallery-badge--board">{entry.examBoard}</span>}
          {tierLabel && <span className="gallery-badge gallery-badge--tier">{tierLabel}</span>}
        </div>
        <div className="gallery-card-title">{entry.title || 'Untitled'}</div>
        {entry.topic && <div className="gallery-card-topic">{entry.topic}</div>}
      </div>

      <div className="gallery-card-preview">
        {/* Mini A4 sheet mock */}
        <div className="gallery-minipage">
          {entry.worksheet.blocks.slice(0, 18).map((block, i) => (
            <div
              key={i}
              className="gallery-miniblock"
              style={{
                background: block.type === 'header' ? boardColor : (BLOCK_TYPE_LABELS[block.type]?.color ?? '#9ca3af') + '33',
                height: block.type === 'header' ? 10 : block.type === 'spacer' ? 4 : 6,
                width: block.type === 'header' ? '100%' : block.type === 'spacer' ? '40%' : undefined,
              }}
            />
          ))}
        </div>
      </div>

      <div className="gallery-card-chips">
        {Array.from(new Set(blockTypes)).map(type => (
          <BlockChip key={type} type={type} />
        ))}
      </div>

      <div className="gallery-card-meta">
        <span>{entry.questionCount} question{entry.questionCount !== 1 ? 's' : ''} · {entry.blockCount} blocks</span>
        <span className="gallery-card-date">{formatDate(entry.savedAt)}</span>
      </div>

      <div className="gallery-card-actions">
        <button className="gallery-btn gallery-btn--open" onClick={() => onOpen(entry.worksheet)}>
          Open in Editor
        </button>
        <button className="gallery-btn gallery-btn--delete" onClick={() => onDelete(entry.id)}>
          Delete
        </button>
      </div>
    </div>
  )
}

interface GalleryProps {
  entries: GalleryEntry[]
  onOpen: (w: Worksheet) => void
  onDelete: (id: string) => void
}

export function Gallery({ entries, onOpen, onDelete }: GalleryProps) {
  return (
    <div className="gallery">
      <div className="gallery-header">
        <h2 className="gallery-heading">Saved Worksheets</h2>
        <p className="gallery-subheading">
          {entries.length === 0
            ? 'No saved worksheets yet — click Save in the editor to add one.'
            : `${entries.length} saved worksheet${entries.length !== 1 ? 's' : ''}`}
        </p>
      </div>
      {entries.length === 0 ? (
        <div className="gallery-empty">
          <div className="gallery-empty-icon">📄</div>
          <p>Save a worksheet from the editor to see it here.</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {entries.map(entry => (
            <WorksheetThumbnail
              key={entry.id}
              entry={entry}
              onOpen={onOpen}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
