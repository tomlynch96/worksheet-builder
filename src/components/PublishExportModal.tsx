import './PublishExportModal.css'

interface Props {
  authorName: string
  onDecide: (choice: 'named' | 'anonymous' | 'opt_out') => void
}

export function PublishExportModal({ authorName, onDecide }: Props) {
  return (
    <div className="pub-backdrop" onClick={e => e.target === e.currentTarget && onDecide('opt_out')}>
      <div className="pub-modal" role="dialog" aria-modal="true">
        <div className="pub-icon">📚</div>
        <h2 className="pub-title">Add to the public library?</h2>
        <p className="pub-body">
          This finished worksheet can join a searchable public library so other teachers can find it by spec point.
          It stays in your personal gallery regardless.
        </p>
        <div className="pub-actions">
          <button className="pub-btn pub-btn--named" onClick={() => onDecide('named')}>
            Share as {authorName}
          </button>
          <button className="pub-btn pub-btn--anon" onClick={() => onDecide('anonymous')}>
            Share anonymously
          </button>
          <button className="pub-btn pub-btn--skip" onClick={() => onDecide('opt_out')}>
            Don't share this one
          </button>
        </div>
      </div>
    </div>
  )
}
