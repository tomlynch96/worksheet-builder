import { useState, useEffect } from 'react'
import { useBlockAnnotations } from '../hooks/useBlockAnnotations'
import type { WorksheetEntry } from '../hooks/useSupabaseWorksheets'
import type { Block, QuestionBlock, WorkedExampleBlock, FigureBlock,
  InformationBlock, MatchThemUpBlock, ClozeBlock, OrderStepsBlock,
  MultipleChoiceBlock, DataBlock } from '../types/worksheet'
import './RateAnnotateModal.css'

const ANNOTATABLE_TYPES = new Set([
  'question', 'multiple_choice', 'worked_example', 'information',
  'cloze', 'match_them_up', 'order_steps', 'figure', 'data',
])

const BLOCK_LABELS: Record<string, { short: string; color: string }> = {
  question:        { short: 'Q',     color: '#16a34a' },
  multiple_choice: { short: 'MC',    color: '#0891b2' },
  worked_example:  { short: 'WE',    color: '#c2410c' },
  information:     { short: 'Info',  color: '#b45309' },
  cloze:           { short: 'Gap',   color: '#db2777' },
  match_them_up:   { short: 'Match', color: '#7c3aed' },
  order_steps:     { short: 'Order', color: '#4338ca' },
  figure:          { short: 'Fig',   color: '#475569' },
  data:            { short: 'Data',  color: '#0d9488' },
}

function blockSummary(block: Block): string {
  switch (block.type) {
    case 'question':        return (block as QuestionBlock).stem || 'Question'
    case 'multiple_choice': return (block as MultipleChoiceBlock).stem || 'Multiple choice'
    case 'worked_example':  return (block as WorkedExampleBlock).title || 'Worked example'
    case 'information':     return (block as InformationBlock).heading || 'Information'
    case 'cloze':           return (block as ClozeBlock).heading || 'Gap fill'
    case 'match_them_up':   return (block as MatchThemUpBlock).heading || 'Match-up'
    case 'order_steps':     return (block as OrderStepsBlock).heading || 'Order steps'
    case 'figure':          return (block as FigureBlock).caption || 'Figure'
    case 'data':            return (block as DataBlock).heading || 'Data table'
    default:                return block.type
  }
}

interface Props {
  entry: WorksheetEntry
  profileId: string
  onClose: () => void
  onAnnotate: (rating: number | null, annotation: string) => Promise<void>
}

export function RateAnnotateModal({ entry, profileId, onClose, onAnnotate }: Props) {
  const [localRating, setLocalRating] = useState<number | null>(entry.rating)
  const [localAnnotation, setLocalAnnotation] = useState(entry.annotation ?? '')
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [overallSaving, setOverallSaving] = useState(false)
  const [overallSaved, setOverallSaved] = useState(false)
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null)
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({})
  const [savingBlock, setSavingBlock] = useState<string | null>(null)

  const blockAnn = useBlockAnnotations(entry.id, profileId)

  useEffect(() => {
    const fills: Record<string, string> = {}
    for (const ann of blockAnn.annotations) {
      if (ann.annotation) fills[ann.block_id] = ann.annotation
    }
    setDraftNotes(prev => ({ ...fills, ...prev }))
  }, [blockAnn.annotations])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSaveOverall() {
    setOverallSaving(true)
    try {
      await onAnnotate(localRating, localAnnotation)
      setOverallSaved(true)
      setTimeout(() => setOverallSaved(false), 2000)
    } finally {
      setOverallSaving(false)
    }
  }

  async function handleSaveBlock(block: Block) {
    const note = draftNotes[block.id] ?? ''
    if (!note.trim()) return
    setSavingBlock(block.id)
    try {
      await blockAnn.save(block.id, block.type, block, note.trim())
      setExpandedBlockId(null)
    } finally {
      setSavingBlock(null)
    }
  }

  const annotatableBlocks = entry.worksheet.blocks.filter(b => ANNOTATABLE_TYPES.has(b.type))
  const annotatedCount = blockAnn.annotations.filter(a => a.annotation).length
  const overallChanged = localRating !== entry.rating || localAnnotation !== (entry.annotation ?? '')

  return (
    <div className="ram-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ram-modal" role="dialog" aria-modal="true">

        <div className="ram-header">
          <div className="ram-header-text">
            <span className="ram-header-title">Rate &amp; annotate</span>
            <span className="ram-header-subtitle">{entry.title || 'Untitled'}</span>
          </div>
          <button className="ram-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ram-body">

          {/* Overall rating */}
          <section className="ram-section">
            <h3 className="ram-section-title">Overall rating</h3>
            <div className="ram-stars">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  className={`ram-star${(hoverRating ?? localRating ?? 0) >= n ? ' ram-star--filled' : ''}`}
                  onClick={() => setLocalRating(localRating === n ? null : n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(null)}
                  aria-label={`Rate ${n} star${n !== 1 ? 's' : ''}`}
                >★</button>
              ))}
              {localRating && <span className="ram-rating-label">{localRating}/5</span>}
            </div>
            <textarea
              className="ram-textarea"
              rows={3}
              value={localAnnotation}
              onChange={e => setLocalAnnotation(e.target.value)}
              placeholder="Overall notes — what worked well, what you'd change next time…"
            />
            <div className="ram-section-actions">
              <button
                className="ram-btn ram-btn--save"
                onClick={handleSaveOverall}
                disabled={overallSaving || !overallChanged}
              >
                {overallSaving ? 'Saving…' : overallSaved ? '✓ Saved' : 'Save overall'}
              </button>
            </div>
          </section>

          {/* Block notes */}
          {annotatableBlocks.length > 0 && (
            <section className="ram-section">
              <h3 className="ram-section-title">
                Block notes
                {annotatedCount > 0 && (
                  <span className="ram-section-count">{annotatedCount} note{annotatedCount !== 1 ? 's' : ''}</span>
                )}
              </h3>
              <p className="ram-section-hint">
                Annotate individual blocks — these accumulate across all your worksheets and inform the AI insights on the Insights page.
              </p>

              <div className="ram-block-list">
                {annotatableBlocks.map((block, idx) => {
                  const meta = BLOCK_LABELS[block.type]
                  const summary = blockSummary(block)
                  const existing = blockAnn.annotations.find(a => a.block_id === block.id)
                  const isExpanded = expandedBlockId === block.id
                  const draft = draftNotes[block.id] ?? existing?.annotation ?? ''

                  return (
                    <div key={block.id} className={`ram-block-row${isExpanded ? ' ram-block-row--expanded' : ''}`}>
                      <div className="ram-block-header">
                        <div className="ram-block-meta">
                          <span
                            className="ram-block-badge"
                            style={{ background: meta?.color + '22', color: meta?.color, borderColor: meta?.color + '55' }}
                          >
                            {meta?.short ?? block.type}
                          </span>
                          <span className="ram-block-index">#{idx + 1}</span>
                          <span className="ram-block-summary">{summary}</span>
                        </div>
                        <div className="ram-block-header-actions">
                          {existing?.annotation && !isExpanded && (
                            <span className="ram-block-note-preview">
                              {existing.annotation.slice(0, 60)}{existing.annotation.length > 60 ? '…' : ''}
                            </span>
                          )}
                          <button
                            className="ram-btn ram-btn--ghost"
                            onClick={() => setExpandedBlockId(isExpanded ? null : block.id)}
                          >
                            {isExpanded ? 'Collapse ▲' : existing?.annotation ? 'Edit note' : 'Add note'}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="ram-block-form">
                          <textarea
                            className="ram-textarea"
                            rows={3}
                            value={draft}
                            onChange={e => setDraftNotes(prev => ({ ...prev, [block.id]: e.target.value }))}
                            placeholder="Why did you make changes to this block? What worked for your class?"
                            autoFocus
                          />
                          <div className="ram-block-form-actions">
                            <button
                              className="ram-btn ram-btn--ghost"
                              onClick={() => {
                                setDraftNotes(prev => ({ ...prev, [block.id]: existing?.annotation ?? '' }))
                                setExpandedBlockId(null)
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              className="ram-btn ram-btn--save"
                              onClick={() => handleSaveBlock(block)}
                              disabled={savingBlock === block.id || !draft.trim()}
                            >
                              {savingBlock === block.id ? 'Saving…' : 'Save note'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        <div className="ram-footer">
          <button className="ram-btn ram-btn--close" onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  )
}
