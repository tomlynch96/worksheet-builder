import { useEffect, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { useProfileContext } from '../context/ProfileContext'

interface FlagRow {
  id: string
  kind: string
  message: string
  qualification_id: string | null
  exam_board: string | null
  spec_ref: string | null
  worksheet_id: string | null
  status: 'open' | 'resolved' | 'dismissed'
  resolution_note: string | null
  created_at: string
  profiles: { name: string } | null
}

const KIND: Record<string, string> = {
  wrong_tag: 'Wrong tag after update', wrong_point: 'Wrong point', missing_point: 'Missing point', other: 'Other',
}

/** Admin list of "report a spec problem" flags, with resolve / dismiss. */
export function SpecFlagsAdmin() {
  const { profile } = useProfileContext()
  const [flags, setFlags] = useState<FlagRow[]>([])
  const [showAll, setShowAll] = useState(false)
  const [available, setAvailable] = useState(true)

  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!isConfigured) return
    let cancelled = false
    supabase
      .from('spec_ref_flags')
      .select('id, kind, message, qualification_id, exam_board, spec_ref, worksheet_id, status, resolution_note, created_at, profiles!profile_id(name)')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setAvailable(false) // table not created yet (migration 027 not applied)
        else setFlags((data ?? []) as unknown as FlagRow[])
      })
    return () => { cancelled = true }
  }, [reloadKey])
  const load = () => setReloadKey(k => k + 1)

  async function setStatus(id: string, status: 'open' | 'resolved' | 'dismissed') {
    const note = status === 'open' ? null : window.prompt('Optional note for your records (not shown to the teacher):') ?? null
    await supabase.from('spec_ref_flags').update({
      status, resolution_note: note,
      resolved_at: status === 'open' ? null : new Date().toISOString(),
      resolved_by: status === 'open' ? null : profile?.id ?? null,
    }).eq('id', id)
    load()
  }

  if (!available) return null
  const open = flags.filter(f => f.status === 'open')
  const shown = showAll ? flags : open

  return (
    <section className="admin-section">
      <h2 className="admin-section-title">Spec problem reports {open.length > 0 && `(${open.length} open)`}</h2>
      <p className="admin-section-hint">
        Reported by teachers from the spec update notice or the spec pickers. Fix the spec data or a worksheet tag, then resolve the report.
      </p>
      <label className="admin-hint-check">
        <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} /> Show resolved and dismissed
      </label>
      {shown.length === 0 ? (
        <p className="admin-section-hint">{showAll ? 'No reports yet.' : 'No open reports.'}</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>When</th><th>From</th><th>About</th><th>Report</th><th>Status</th><th /></tr></thead>
          <tbody>
            {shown.map(f => (
              <tr key={f.id}>
                <td className="admin-cell-date">{new Date(f.created_at).toLocaleDateString('en-GB')}</td>
                <td className="admin-cell-author">{f.profiles?.name ?? '—'}</td>
                <td className="admin-cell-spec">{[f.exam_board, f.spec_ref].filter(Boolean).join(' · ') || '—'}</td>
                <td><strong>{KIND[f.kind] ?? f.kind}:</strong> {f.message}{f.resolution_note ? <><br /><em>Note: {f.resolution_note}</em></> : null}</td>
                <td>{f.status}</td>
                <td>
                  {f.status === 'open'
                    ? <><button className="admin-save-btn" onClick={() => setStatus(f.id, 'resolved')}>Resolve</button>{' '}<button className="admin-save-btn" onClick={() => setStatus(f.id, 'dismissed')}>Dismiss</button></>
                    : <button className="admin-save-btn" onClick={() => setStatus(f.id, 'open')}>Reopen</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
