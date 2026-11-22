import { useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { useProfileContext } from '../context/ProfileContext'
import './SpecRefNotice.css'

export type SpecFlagKind = 'wrong_tag' | 'missing_point' | 'wrong_point' | 'other'

const KIND_LABELS: Record<SpecFlagKind, string> = {
  wrong_tag: 'A worksheet or topic was moved to the wrong spec point',
  wrong_point: 'A spec point is wrong or has the wrong wording',
  missing_point: 'A learning point from the official spec is missing',
  other: 'Something else',
}

export interface SpecFlagContext {
  qualificationId?: string
  examBoard?: string
  specRef?: string | null
  worksheetId?: string
  batch?: string | null
  defaultKind?: SpecFlagKind
}

/** The report form itself, so the notice can open it for a specific worksheet. */
export function SpecIssueDialog({ context, onClose }: { context: SpecFlagContext; onClose: () => void }) {
  const { profile } = useProfileContext()
  const [kind, setKind] = useState<SpecFlagKind>(context.defaultKind ?? 'other')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function send() {
    if (!profile || !isConfigured || !message.trim()) return
    setState('sending')
    const { error } = await supabase.from('spec_ref_flags').insert({
      profile_id: profile.id,
      batch: context.batch ?? null,
      kind,
      message: message.trim().slice(0, 2000),
      qualification_id: context.qualificationId ?? null,
      exam_board: context.examBoard ?? null,
      spec_ref: context.specRef ?? null,
      worksheet_id: context.worksheetId ?? null,
    })
    setState(error ? 'error' : 'sent')
  }

  return (
    <div className="sr-backdrop sr-backdrop--top" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sr-dialog" role="dialog" aria-label="Report a spec problem">
        <h3 className="sr-dialog-title">Report a spec problem</h3>
        {state === 'sent' ? (
          <>
            <p className="sr-text">Thanks — your report has been sent and we'll look at it.</p>
            <div className="sr-actions"><button type="button" className="sr-btn sr-btn--primary" onClick={onClose}>Close</button></div>
          </>
        ) : (
          <>
            {(context.examBoard || context.specRef) && (
              <p className="sr-context">{[context.examBoard, context.specRef].filter(Boolean).join(' · ')}</p>
            )}
            <label className="sr-label">What's wrong?
              <select className="sr-input" value={kind} onChange={e => setKind(e.target.value as SpecFlagKind)}>
                {(Object.keys(KIND_LABELS) as SpecFlagKind[]).map(k => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
              </select>
            </label>
            <label className="sr-label">Details
              <textarea
                className="sr-input" rows={4} maxLength={2000} autoFocus value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="e.g. 'Edexcel 7.11 (AC/RMS) should be spec point 129, not 128'"
              />
            </label>
            {state === 'error' && <p className="sr-error">Couldn't send that. Please try again.</p>}
            <div className="sr-actions">
              <button type="button" className="sr-btn" onClick={onClose} disabled={state === 'sending'}>Cancel</button>
              <button type="button" className="sr-btn sr-btn--primary" onClick={send} disabled={!message.trim() || state === 'sending'}>
                {state === 'sending' ? 'Sending…' : 'Send report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** A small "spot a problem?" link that opens the report form. Safe to drop in next to any spec picker. */
export function SpecIssueButton({ context, label = 'Spot a problem with the spec?' }: { context: SpecFlagContext; label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="sr-link" onClick={() => setOpen(true)}>{label}</button>
      {open && <SpecIssueDialog context={context} onClose={() => setOpen(false)} />}
    </>
  )
}
