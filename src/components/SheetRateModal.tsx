import { useState, useEffect } from 'react'
import './RateAnnotateModal.css'

interface Props {
  worksheetTitle: string
  initialRating: number | null
  initialAnnotation: string
  onSave: (rating: number | null, annotation: string) => Promise<void>
  onClose: () => void
}

export function SheetRateModal({ worksheetTitle, initialRating, initialAnnotation, onSave, onClose }: Props) {
  const [rating, setRating] = useState<number | null>(initialRating)
  const [annotation, setAnnotation] = useState(initialAnnotation)
  const [hover, setHover] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const changed = rating !== initialRating || annotation !== initialAnnotation

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(rating, annotation)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ram-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ram-modal" style={{ maxWidth: 480 }} role="dialog" aria-modal="true">

        <div className="ram-header">
          <div className="ram-header-text">
            <span className="ram-header-title">Rate this worksheet</span>
            <span className="ram-header-subtitle">{worksheetTitle || 'Untitled'}</span>
          </div>
          <button className="ram-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ram-body">
          <section className="ram-section">
            <div className="ram-stars">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  className={`ram-star${(hover ?? rating ?? 0) >= n ? ' ram-star--filled' : ''}`}
                  onClick={() => { setRating(rating === n ? null : n); setSaved(false) }}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(null)}
                  aria-label={`Rate ${n} star${n !== 1 ? 's' : ''}`}
                >★</button>
              ))}
              {rating && <span className="ram-rating-label">{rating}/5</span>}
            </div>

            <textarea
              className="ram-textarea"
              rows={4}
              value={annotation}
              onChange={e => { setAnnotation(e.target.value); setSaved(false) }}
              placeholder="Overall notes — what worked well, what you'd change, how your class responded…"
              autoFocus
            />

            <div className="ram-section-actions">
              <button
                className="ram-btn ram-btn--save"
                onClick={handleSave}
                disabled={saving || !changed}
              >
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
              </button>
            </div>
          </section>
        </div>

        <div className="ram-footer">
          <button className="ram-btn ram-btn--close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
