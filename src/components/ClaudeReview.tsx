import './ClaudeReview.css'

// Sheets saved from Claude (the MCP connector) arrive flagged for review. The dialog
// appears the first time the teacher opens one; the bar stays until they approve it
// or make their first edit.

interface Props {
  createdAt: string
  specLabel?: string
  hasFigures: boolean
  onApprove: () => void
  onStart: () => void
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })

export function ClaudeReviewDialog({ createdAt, specLabel, hasFigures, onApprove, onStart }: Props) {
  return (
    <div className="crv-backdrop" onClick={e => e.target === e.currentTarget && onStart()}>
      <div className="crv-modal" role="dialog" aria-modal="true" aria-labelledby="crv-title">
        <p className="crv-kicker">From Claude · {fmt(createdAt)}</p>
        <h2 id="crv-title" className="crv-title">Check this worksheet before you use it</h2>
        <p className="crv-body">Claude wrote this sheet and saved it to your library. It's private until you choose to share it. Please check:</p>
        <ul className="crv-list">
          <li>the questions, wording and difficulty suit your class</li>
          <li>the mark scheme is right (switch to <strong>Mark Scheme</strong> at the top)</li>
          <li>it's filed under the right spec point{specLabel ? <>: <strong>{specLabel}</strong></> : null}</li>
          {hasFigures && <li>every diagram is clear and matches its question</li>}
        </ul>
        <p className="crv-note">Any edit you make counts as reviewing it, and helps the library learn what good looks like.</p>
        <div className="crv-actions">
          <button type="button" className="crv-btn crv-btn--secondary" onClick={onApprove}>Looks good — mark as reviewed</button>
          <button type="button" className="crv-btn crv-btn--primary" onClick={onStart}>Start reviewing</button>
        </div>
      </div>
    </div>
  )
}

export function ClaudeReviewBar({ onApprove }: { onApprove: () => void }) {
  return (
    <div className="crv-bar" role="status">
      <span><strong>From Claude</strong> · not reviewed yet. Editing anything counts as reviewing it.</span>
      <button type="button" className="crv-bar-btn" onClick={onApprove}>Mark as reviewed</button>
    </div>
  )
}
