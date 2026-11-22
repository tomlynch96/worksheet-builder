import { useEffect, useMemo, useState } from 'react'
import { useProfileContext } from '../context/ProfileContext'
import { describeSpecPoint, getSpecTopics } from '../data/qualifications'
import { useSpecRefNotice, ALEVEL, type SpecRefChange, type NeedsReview } from '../hooks/useSpecRefNotice'
import { SpecIssueDialog, type SpecFlagContext } from './SpecIssueButton'
import './SpecRefNotice.css'

/** Event other parts of the app can fire to reopen the notice (e.g. a link on the profile page). */
export const OPEN_SPEC_NOTICE_EVENT = 'open-spec-ref-notice'

const BOARD_LABEL = (b: string) => b || 'A Level'

function TagPicker({ board, onPick, onCancel }: { board: string; onPick: (ref: string) => Promise<void>; onCancel: () => void }) {
  const topics = useMemo(() => getSpecTopics(ALEVEL, board) ?? [], [board])
  const [ref, setRef] = useState('')
  const [saving, setSaving] = useState(false)
  return (
    <div className="sr-picker">
      <select className="sr-input" value={ref} onChange={e => setRef(e.target.value)} autoFocus>
        <option value="">— Choose a spec point —</option>
        {topics.map(t => (
          <optgroup key={t.ref} label={`${t.ref} — ${t.title}`}>
            {t.points.map(p => <option key={p.ref} value={p.ref}>{p.ref} — {p.title}</option>)}
          </optgroup>
        ))}
      </select>
      <div className="sr-row-actions">
        <button type="button" className="sr-btn sr-btn--primary sr-btn--sm" disabled={!ref || saving} onClick={async () => { setSaving(true); await onPick(ref); setSaving(false) }}>Save</button>
        <button type="button" className="sr-btn sr-btn--sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

export function SpecRefNotice() {
  const { profile } = useProfileContext()
  const n = useSpecRefNotice(profile)
  const [view, setView] = useState<'summary' | 'review'>('summary')
  const [flag, setFlag] = useState<SpecFlagContext | null>(null)
  const [picking, setPicking] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ key: string; text: string } | null>(null)

  const { setOpen } = n
  useEffect(() => {
    const open = () => { setView('review'); setOpen(true) }
    window.addEventListener(OPEN_SPEC_NOTICE_EVENT, open)
    return () => window.removeEventListener(OPEN_SPEC_NOTICE_EVENT, open)
  }, [setOpen])

  if (!profile || n.loading || !n.batch) return null
  if (!n.visible && !n.open) return null

  const moved = n.changes.filter(c => c.tbl === 'worksheets').length
  const topicsChanged = n.changes.filter(c => c.tbl === 'scheme_topics').length
  const diagrams = n.changes.filter(c => c.tbl === 'diagrams').length

  async function toggle(c: SpecRefChange) {
    setBusy(c.key); setMessage(null)
    const err = await n.setApplied(c, c.state === 'undone')
    setBusy(null)
    if (err === 'changed_since') setMessage({ key: c.key, text: 'This has been changed since the update, so it can\'t be undone automatically. Use "Choose another" instead.' })
    else if (err) setMessage({ key: c.key, text: 'Couldn\'t do that. Please try again.' })
  }

  async function pick(id: string, ref: string) {
    const ok = await n.retag(id, ref)
    setPicking(null)
    if (!ok) setMessage({ key: id, text: 'Couldn\'t save that tag. Please try again.' })
  }

  const reportFor = (c: SpecRefChange): SpecFlagContext => ({
    qualificationId: ALEVEL, examBoard: c.board, specRef: c.newRef ?? c.oldRef, worksheetId: c.tbl === 'worksheets' ? c.rowId : undefined,
    batch: n.batch, defaultKind: 'wrong_tag',
  })

  // Plain render functions (not components) so a row keeps its state when the list re-renders
  const renderChange = (c: SpecRefChange) => {
    const oldText = c.oldRef ? `${c.oldRef}${c.oldTitle ? ` — ${c.oldTitle}` : ''}` : '(none)'
    const newText = c.tbl === 'worksheets'
      ? (describeSpecPoint(ALEVEL, c.board, c.newRef) ?? '(none)')
      : c.tbl === 'scheme_topics' ? (c.newRef ? (describeSpecPoint(ALEVEL, c.board, c.newRef) ?? c.newRef) : 'No single topic now — the topic name is kept')
      : c.newRef ?? '(none)'
    return (
      <li className="sr-item" key={c.key}>
        <div className="sr-item-head">
          <span className="sr-item-title">{c.title}</span>
          <span className="sr-item-board">{BOARD_LABEL(c.board)}</span>
        </div>
        <div className="sr-tags">
          <span className={`sr-tag${c.state === 'applied' ? ' sr-tag--old-strike' : ''}`}><em>Was</em> {oldText}</span>
          <span className="sr-arrow" aria-hidden>→</span>
          <span className={`sr-tag${c.state === 'undone' ? ' sr-tag--old-strike' : ' sr-tag--new'}`}><em>Now</em> {newText}</span>
        </div>
        {c.state === 'undone' && <p className="sr-note">You put this back to its old tag. The old tag no longer exists in the updated spec, so this worksheet won't group by spec point.</p>}
        {c.state === 'edited' && <p className="sr-note">You've changed this tag since the update.</p>}
        {picking === c.rowId ? (
          <TagPicker board={c.board} onPick={ref => pick(c.rowId, ref)} onCancel={() => setPicking(null)} />
        ) : (
          <div className="sr-row-actions">
            {c.state !== 'edited' && (
              <button type="button" className="sr-btn sr-btn--sm" disabled={busy === c.key} onClick={() => toggle(c)}>
                {c.state === 'applied' ? 'Undo' : 'Re-apply'}
              </button>
            )}
            {c.tbl === 'worksheets' && <button type="button" className="sr-btn sr-btn--sm" onClick={() => setPicking(c.rowId)}>Choose another…</button>}
            <button type="button" className="sr-btn sr-btn--sm sr-btn--ghost" onClick={() => setFlag(reportFor(c))}>Report a problem</button>
          </div>
        )}
        {message?.key === c.key && <p className="sr-error">{message.text}</p>}
      </li>
    )
  }

  const renderReview = (r: NeedsReview) => {
    return (
      <li className="sr-item" key={r.id}>
        <div className="sr-item-head"><span className="sr-item-title">{r.title}</span><span className="sr-item-board">{BOARD_LABEL(r.board)}</span></div>
        <div className="sr-tags"><span className="sr-tag"><em>Tagged</em> {r.specPoint} <span className="sr-muted">(not in the updated spec)</span></span></div>
        {picking === r.id ? (
          <TagPicker board={r.board} onPick={ref => pick(r.id, ref)} onCancel={() => setPicking(null)} />
        ) : (
          <div className="sr-row-actions">
            <button type="button" className="sr-btn sr-btn--sm sr-btn--primary" onClick={() => setPicking(r.id)}>Choose a spec point…</button>
            <button type="button" className="sr-btn sr-btn--sm sr-btn--ghost" onClick={() => setFlag({ qualificationId: ALEVEL, examBoard: r.board, specRef: r.specPoint, worksheetId: r.id, batch: n.batch, defaultKind: 'missing_point' })}>Report a problem</button>
          </div>
        )}
        {message?.key === r.id && <p className="sr-error">{message.text}</p>}
      </li>
    )
  }

  return (
    <>
      <div className="sr-backdrop" role="presentation">
        <div className="sr-modal" role="dialog" aria-label="A Level specifications updated">
          {view === 'summary' ? (
            <>
              <h2 className="sr-title">Your A Level specs have been updated</h2>
              <p className="sr-text">
                We rebuilt the AQA, Edexcel, OCR and WJEC A Level Physics specifications from the official documents, so every
                learning point on the spec now has its own entry. Spec points have new reference numbers
                (for example, Edexcel 7.11 is now 128).
              </p>
              {(moved + topicsChanged + diagrams > 0 || n.needsReview.length > 0) ? (
                <ul className="sr-summary">
                  {moved > 0 && <li><strong>{moved}</strong> of your worksheet{moved === 1 ? ' was' : 's were'} moved to the matching new spec point.</li>}
                  {topicsChanged > 0 && <li><strong>{topicsChanged}</strong> scheme topic{topicsChanged === 1 ? ' was' : 's were'} updated.</li>}
                  {diagrams > 0 && <li><strong>{diagrams}</strong> of your diagram{diagrams === 1 ? '' : 's'} had tags tidied.</li>}
                  {n.needsReview.length > 0 && <li><strong>{n.needsReview.length}</strong> worksheet{n.needsReview.length === 1 ? '' : 's'} need{n.needsReview.length === 1 ? 's' : ''} a new spec point choosing, because the old point isn't in the official spec.</li>}
                </ul>
              ) : (
                <p className="sr-text">None of your existing worksheets were affected.</p>
              )}
              <p className="sr-text sr-text--small">
                We matched old points to new ones as closely as we could, so please check them. You can undo any change, choose a
                different spec point, or tell us about a mistake.
              </p>
              <div className="sr-actions">
                <button type="button" className="sr-btn sr-btn--ghost" onClick={() => setFlag({ qualificationId: ALEVEL, batch: n.batch })}>Report a problem</button>
                {(n.changes.length > 0 || n.needsReview.length > 0) && <button type="button" className="sr-btn" onClick={() => setView('review')}>Review changes</button>}
                <button type="button" className="sr-btn sr-btn--primary" onClick={n.acknowledge}>Got it</button>
              </div>
            </>
          ) : (
            <>
              <div className="sr-review-head">
                <h2 className="sr-title">Review the changes</h2>
                <button type="button" className="sr-btn sr-btn--sm" onClick={() => setView('summary')}>← Back</button>
              </div>
              <div className="sr-scroll">
                {n.needsReview.length > 0 && (
                  <section>
                    <h3 className="sr-section">Need a new spec point ({n.needsReview.length})</h3>
                    <ul className="sr-list">{n.needsReview.map(renderReview)}</ul>
                  </section>
                )}
                {n.changes.length > 0 && (
                  <section>
                    <h3 className="sr-section">Moved to the new spec ({n.changes.length})</h3>
                    <ul className="sr-list">{n.changes.map(renderChange)}</ul>
                  </section>
                )}
              </div>
              <div className="sr-actions">
                <button type="button" className="sr-btn sr-btn--ghost" onClick={() => setFlag({ qualificationId: ALEVEL, batch: n.batch })}>Report a different problem</button>
                <button type="button" className="sr-btn sr-btn--primary" onClick={n.acknowledge}>Done</button>
              </div>
            </>
          )}
        </div>
      </div>
      {flag && <SpecIssueDialog context={flag} onClose={() => setFlag(null)} />}
    </>
  )
}
