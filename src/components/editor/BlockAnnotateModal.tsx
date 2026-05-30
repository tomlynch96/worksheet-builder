import { useState, useEffect } from 'react'
import { useBlockAnnotations } from '../../hooks/useBlockAnnotations'
import type { Block, QuestionBlock, WorkedExampleBlock, FigureBlock,
  InformationBlock, MatchThemUpBlock, ClozeBlock, OrderStepsBlock,
  MultipleChoiceBlock, DataBlock } from '../../types/worksheet'
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
  const [saved, setSaved] = useState(false)

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

  const meta = BLOCK_LABELS[block.type]

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
              Note what you changed here and why. These annotations are analysed collectively on the Insights page.
            </p>
            <textarea
              className="ram-textarea"
              rows={4}
              value={draft}
              onChange={e => { setDraft(e.target.value); setSaved(false) }}
              placeholder="e.g. Simplified from 4 marks — class struggled with multi-step rearranging. Keeping to 2-mark questions for this group."
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
        </div>

        <div className="ram-footer">
          <button className="ram-btn ram-btn--close" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
