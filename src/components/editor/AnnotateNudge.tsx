import './AnnotateNudge.css'

interface Props {
  onAddNote: () => void
  onDismiss: () => void
}

export function AnnotateNudge({ onAddNote, onDismiss }: Props) {
  return (
    <div className="annotate-nudge" role="status">
      <div className="annotate-nudge-body">
        <span className="annotate-nudge-icon">✏️</span>
        <span className="annotate-nudge-text">
          You've made a few changes — a quick note on why helps the AI learn your preferences.
        </span>
      </div>
      <div className="annotate-nudge-actions">
        <button className="annotate-nudge-btn annotate-nudge-btn--primary" onClick={onAddNote}>
          Add a note
        </button>
        <button className="annotate-nudge-btn annotate-nudge-btn--ghost" onClick={onDismiss}>
          Not now
        </button>
      </div>
    </div>
  )
}
