import { useState, useEffect } from 'react'
import { useBlockAnnotations } from '../hooks/useBlockAnnotations'
import type { WorksheetEntry } from '../hooks/useSupabaseWorksheets'
import type { Block, QuestionBlock, WorkedExampleBlock, FigureBlock,
  InformationBlock, MatchThemUpBlock, ClozeBlock, OrderStepsBlock,
  MultipleChoiceBlock, DataBlock } from '../types/worksheet'
import type { BlockAnnotation } from '../types/annotations'
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
  const [generatingInsight, setGeneratingInsight] = useState<string | null>(null)
  const [insightErrors, setInsightErrors] = useState<Record<string, string>>({})
  const [insightComments, setInsightComments] = useState<Record<string, string>>({})

  const blockAnn = useBlockAnnotations(entry.id, profileId)

  // Pre-fill draft notes from loaded annotations
  useEffect(() => {
    const fills: Record<string, string> = {}
    for (const ann of blockAnn.annotations) {
      if (ann.annotation) fills[ann.block_id] = ann.annotation
    }
    setDraftNotes(prev => ({ ...fills, ...prev }))
  }, [blockAnn.annotations])

  // Close on Escape
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

  async function handleGenerateInsight(ann: BlockAnnotation) {
    setGeneratingInsight(ann.id)
    setInsightErrors(prev => ({ ...prev, [ann.id]: '' }))
    try {
      const res = await fetch('/api/generate-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_block: ann.original_block,
          final_block: ann.final_block,
          annotation: ann.annotation,
        }),
      })
      const json = await res.json() as { insight?: string; error?: string }
      if (!res.ok || !json.insight) throw new Error(json.error ?? 'Failed to generate insight')
      await blockAnn.saveInsight(ann.id, json.insight)
    } catch (err) {
      setInsightErrors(prev => ({ ...prev, [ann.id]: String(err) }))
    } finally {
      setGeneratingInsight(null)
    }
  }

  async function handleInsightRating(insightId: string, annId: string, rating: -1 | 1) {
    const comment = insightComments[annId] ?? ''
    await blockAnn.saveInsightRating(insightId, rating, comment)
  }

  const annotatableBlocks = entry.worksheet.blocks.filter(b => ANNOTATABLE_TYPES.has(b.type))
  const annotatedCount = blockAnn.annotations.filter(a => a.annotation).length
  const insightCount = blockAnn.annotations.filter(a => a.insight).length

  const overallChanged = localRating !== entry.rating || localAnnotation !== (entry.annotation ?? '')

  return (
    <div className="ram-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ram-modal" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="ram-header">
          <div className="ram-header-text">
            <span className="ram-header-title">Rate &amp; annotate</span>
            <span className="ram-header-subtitle">{entry.title || 'Untitled'}</span>
          </div>
          <button className="ram-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ram-body">

          {/* ── Section 1: Overall rating ── */}
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
              {localRating && (
                <span className="ram-rating-label">{localRating}/5</span>
              )}
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

          {/* ── Section 2: Block notes ── */}
          {annotatableBlocks.length > 0 && (
            <section className="ram-section">
              <h3 className="ram-section-title">
                Block notes
                {annotatedCount > 0 && (
                  <span className="ram-section-count">{annotatedCount} note{annotatedCount !== 1 ? 's' : ''}</span>
                )}
              </h3>
              <p className="ram-section-hint">
                Annotate individual blocks — what you changed and why. These notes feed into future AI generation.
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
                      {/* Row header */}
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

                      {/* Expanded form */}
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

                      {/* Insight area — shows after a note is saved */}
                      {existing && (
                        <div className="ram-insight-area">
                          {!existing.insight && !generatingInsight && (
                            <button
                              className="ram-btn ram-btn--insight"
                              onClick={() => handleGenerateInsight(existing)}
                              disabled={generatingInsight === existing.id}
                            >
                              ✦ Generate AI insight
                            </button>
                          )}
                          {generatingInsight === existing.id && (
                            <span className="ram-insight-loading">
                              <span className="ram-spinner" /> Generating insight…
                            </span>
                          )}
                          {insightErrors[existing.id] && (
                            <p className="ram-insight-error">{insightErrors[existing.id]}</p>
                          )}
                          {existing.insight && (
                            <InsightCard
                              insight={existing.insight}
                              annId={existing.id}
                              comment={insightComments[existing.id] ?? existing.insight.teacher_comment ?? ''}
                              onCommentChange={c => setInsightComments(prev => ({ ...prev, [existing.id]: c }))}
                              onRate={rating => handleInsightRating(existing.insight!.id, existing.id, rating)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Section 3: Insights summary (if any exist) ── */}
          {insightCount > 0 && (
            <section className="ram-section ram-section--insights">
              <h3 className="ram-section-title">
                AI insights
                <span className="ram-section-count">{insightCount}</span>
              </h3>
              <p className="ram-section-hint">
                Claude's interpretation of your edits. Rate each insight to help improve future suggestions.
              </p>
              <div className="ram-insights-list">
                {blockAnn.annotations.filter(a => a.insight).map(ann => {
                  const block = entry.worksheet.blocks.find(b => b.id === ann.block_id)
                  const meta = BLOCK_LABELS[ann.block_type]
                  return (
                    <div key={ann.id} className="ram-insight-summary-row">
                      <div className="ram-insight-summary-label">
                        <span
                          className="ram-block-badge"
                          style={{ background: meta?.color + '22', color: meta?.color, borderColor: meta?.color + '55' }}
                        >
                          {meta?.short ?? ann.block_type}
                        </span>
                        <span className="ram-block-summary">
                          {block ? blockSummary(block).slice(0, 50) : ann.block_type}
                        </span>
                      </div>
                      <InsightCard
                        insight={ann.insight!}
                        annId={ann.id}
                        comment={insightComments[ann.id] ?? ann.insight!.teacher_comment ?? ''}
                        onCommentChange={c => setInsightComments(prev => ({ ...prev, [ann.id]: c }))}
                        onRate={rating => handleInsightRating(ann.insight!.id, ann.id, rating)}
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          )}

        </div>

        {/* Footer */}
        <div className="ram-footer">
          <button className="ram-btn ram-btn--close" onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  )
}

interface InsightCardProps {
  insight: NonNullable<BlockAnnotation['insight']>
  annId: string
  comment: string
  onCommentChange: (c: string) => void
  onRate: (rating: -1 | 1) => void
}

function InsightCard({ insight, comment, onCommentChange, onRate }: InsightCardProps) {
  const [showComment, setShowComment] = useState(!!insight.teacher_rating)

  return (
    <div className="ram-insight-card">
      <p className="ram-insight-text">{insight.insight_text}</p>
      <div className="ram-insight-actions">
        <span className="ram-insight-actions-label">Was this interpretation helpful?</span>
        <button
          className={`ram-thumb${insight.teacher_rating === 1 ? ' ram-thumb--active' : ''}`}
          onClick={() => { onRate(1); setShowComment(true) }}
          title="Helpful"
        >👍</button>
        <button
          className={`ram-thumb${insight.teacher_rating === -1 ? ' ram-thumb--active' : ''}`}
          onClick={() => { onRate(-1); setShowComment(true) }}
          title="Not helpful"
        >👎</button>
        {!showComment && (
          <button className="ram-btn ram-btn--ghost ram-btn--xs" onClick={() => setShowComment(true)}>
            Add comment
          </button>
        )}
      </div>
      {showComment && (
        <textarea
          className="ram-textarea ram-textarea--sm"
          rows={2}
          value={comment}
          onChange={e => onCommentChange(e.target.value)}
          placeholder="Any comment on this interpretation?"
          onBlur={() => comment.trim() && onRate(insight.teacher_rating ?? 1)}
        />
      )}
    </div>
  )
}
