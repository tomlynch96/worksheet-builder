import { useState, useEffect } from 'react'
import { useBlockAnnotations } from '../../hooks/useBlockAnnotations'
import type { Block, QuestionBlock, WorkedExampleBlock, FigureBlock,
  InformationBlock, MatchThemUpBlock, ClozeBlock, OrderStepsBlock,
  MultipleChoiceBlock, DataBlock } from '../../types/worksheet'
import type { BlockAnnotation } from '../../types/annotations'
import '../RateAnnotateModal.css'

const BLOCK_LABELS: Record<string, { label: string; color: string }> = {
  question:        { label: 'Question',        color: '#16a34a' },
  multiple_choice: { label: 'Multiple Choice', color: '#0891b2' },
  worked_example:  { label: 'Worked Example',  color: '#c2410c' },
  information:     { label: 'Information',     color: '#b45309' },
  cloze:           { label: 'Gap Fill',        color: '#db2777' },
  match_them_up:   { label: 'Match-Up',        color: '#7c3aed' },
  order_steps:     { label: 'Order Steps',     color: '#4338ca' },
  figure:          { label: 'Figure',          color: '#475569' },
  data:            { label: 'Data / Graph',    color: '#0d9488' },
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
  block: Block
  worksheetId: string
  profileId: string
  onClose: () => void
}

export function BlockAnnotateModal({ block, worksheetId, profileId, onClose }: Props) {
  const blockAnn = useBlockAnnotations(worksheetId, profileId)
  const existing = blockAnn.annotations.find(a => a.block_id === block.id)

  const [draft, setDraft] = useState(existing?.annotation ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!existing?.annotation)
  const [generatingInsight, setGeneratingInsight] = useState(false)
  const [insightError, setInsightError] = useState('')
  const [insightComment, setInsightComment] = useState(existing?.insight?.teacher_comment ?? '')
  const [showComment, setShowComment] = useState(!!existing?.insight?.teacher_rating)

  // Sync draft once annotations load (covers the case where they weren't loaded yet)
  useEffect(() => {
    if (existing?.annotation && draft === '') setDraft(existing.annotation)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.annotation])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSave() {
    if (!draft.trim()) return
    setSaving(true)
    try {
      await blockAnn.save(block.id, block.type, block, draft.trim())
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerateInsight() {
    const ann = blockAnn.annotations.find(a => a.block_id === block.id)
    if (!ann) return
    setGeneratingInsight(true)
    setInsightError('')
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
      setInsightError(String(err))
    } finally {
      setGeneratingInsight(false)
    }
  }

  async function handleInsightRating(rating: -1 | 1) {
    const ann = blockAnn.annotations.find(a => a.block_id === block.id)
    if (!ann?.insight) return
    await blockAnn.saveInsightRating(ann.insight.id, rating, insightComment)
    setShowComment(true)
  }

  const meta = BLOCK_LABELS[block.type]
  const savedAnnotation = blockAnn.annotations.find(a => a.block_id === block.id)
  const insight = savedAnnotation?.insight

  return (
    <div className="ram-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ram-modal" style={{ maxWidth: 520 }} role="dialog" aria-modal="true">

        <div className="ram-header">
          <div className="ram-header-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {meta && (
                <span
                  className="ram-block-badge"
                  style={{ background: meta.color + '22', color: meta.color, borderColor: meta.color + '55' }}
                >
                  {meta.label}
                </span>
              )}
              <span className="ram-header-title">Annotate block</span>
            </div>
            <span className="ram-header-subtitle">{blockSummary(block)}</span>
          </div>
          <button className="ram-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ram-body">
          <section className="ram-section">
            <p className="ram-section-hint">
              What did you change here, or what should future AI versions know about this type of block?
            </p>
            <textarea
              className="ram-textarea"
              rows={4}
              value={draft}
              onChange={e => { setDraft(e.target.value); setSaved(false) }}
              placeholder="e.g. Simplified from 4 marks — class struggled with multi-step rearranging. Keep to 2-mark questions for this group."
              autoFocus
            />
            <div className="ram-section-actions">
              <button
                className="ram-btn ram-btn--save"
                onClick={handleSave}
                disabled={saving || !draft.trim() || saved}
              >
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save note'}
              </button>
            </div>
          </section>

          {/* Insight area — only shows after annotation is saved */}
          {(saved || savedAnnotation?.annotation) && (
            <section className="ram-section">
              <h3 className="ram-section-title">AI insight</h3>
              {!insight && !generatingInsight && (
                <>
                  <p className="ram-section-hint">
                    Ask Claude to interpret what this note suggests about your teaching preferences.
                  </p>
                  <button
                    className="ram-btn ram-btn--insight"
                    onClick={handleGenerateInsight}
                  >
                    ✦ Generate insight
                  </button>
                  {insightError && <p className="ram-insight-error">{insightError}</p>}
                </>
              )}
              {generatingInsight && (
                <span className="ram-insight-loading">
                  <span className="ram-spinner" /> Generating insight…
                </span>
              )}
              {insight && (
                <InsightDisplay
                  insight={insight}
                  comment={insightComment}
                  onCommentChange={setInsightComment}
                  onRate={handleInsightRating}
                  showComment={showComment}
                  onShowComment={() => setShowComment(true)}
                />
              )}
            </section>
          )}
        </div>

        <div className="ram-footer">
          <button className="ram-btn ram-btn--close" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}

interface InsightDisplayProps {
  insight: NonNullable<BlockAnnotation['insight']>
  comment: string
  onCommentChange: (c: string) => void
  onRate: (r: -1 | 1) => void
  showComment: boolean
  onShowComment: () => void
}

function InsightDisplay({ insight, comment, onCommentChange, onRate, showComment, onShowComment }: InsightDisplayProps) {
  return (
    <div className="ram-insight-card">
      <p className="ram-insight-text">{insight.insight_text}</p>
      <div className="ram-insight-actions">
        <span className="ram-insight-actions-label">Helpful?</span>
        <button
          className={`ram-thumb${insight.teacher_rating === 1 ? ' ram-thumb--active' : ''}`}
          onClick={() => onRate(1)}
          title="Helpful"
        >👍</button>
        <button
          className={`ram-thumb${insight.teacher_rating === -1 ? ' ram-thumb--active' : ''}`}
          onClick={() => onRate(-1)}
          title="Not helpful"
        >👎</button>
        {!showComment && (
          <button className="ram-btn ram-btn--ghost ram-btn--xs" onClick={onShowComment}>Add comment</button>
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
