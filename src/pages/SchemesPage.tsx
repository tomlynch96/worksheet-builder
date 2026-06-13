import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/layout/Topbar'
import { useProfileContext } from '../context/ProfileContext'
import { useSchemes } from '../hooks/useSchemes'
import { QUALIFICATION_OFFERINGS, offeringLabel } from '../data/qualifications'
import type { BrowsableQual } from '../types/scheme'
import './SchemesPage.css'

const ACADEMIC_YEARS = ['2024-25', '2025-26', '2026-27']

export function SchemesPage() {
  const { profile } = useProfileContext()
  const { schemes, loading, create, rename, remove } = useSchemes(profile?.id ?? null)
  const navigate = useNavigate()

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newYear, setNewYear] = useState('2025-26')
  const [selectedQuals, setSelectedQuals] = useState<Set<string>>(new Set())
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')

  const courses = (profile?.user_courses ?? []).filter(c => {
    const o = QUALIFICATION_OFFERINGS.find(q => q.id === c.qualification_id)
    return o && o.examBoards.includes(c.exam_board)
  })

  function toggleQual(key: string) {
    setSelectedQuals(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleCreate() {
    if (selectedQuals.size === 0) return
    const browsable: BrowsableQual[] = [...selectedQuals].map(key => {
      const [qualification_id, exam_board] = key.split(':')
      return { qualification_id, exam_board }
    })
    const primary = browsable[0]
    const name = newName.trim() || browsable.map(q => offeringLabel(q.qualification_id, q.exam_board)).join(' + ')
    const s = await create({
      name,
      academic_year: newYear,
      qualification_id: primary.qualification_id,
      exam_board: primary.exam_board,
      browsable_qualifications: browsable,
    })
    if (s) {
      setCreating(false)
      setNewName(''); setSelectedQuals(new Set()); setNewYear('2025-26')
      navigate(`/schemes/${s.id}`)
    }
  }

  return (
    <div className="schemes-shell">
      <Topbar />
      <main className="schemes-main">
        <div className="schemes-header">
          <div>
            <h1 className="schemes-title">Schemes of Work</h1>
            <p className="schemes-sub">Build a week-by-week teaching plan, assign worksheets to topics, and generate spaced recall check-ins.</p>
          </div>
          <button className="schemes-new-btn" onClick={() => setCreating(true)}>+ New scheme</button>
        </div>

        {creating && (
          <div className="schemes-create-card">
            <h3 className="schemes-create-heading">New scheme of work</h3>

            <div className="schemes-create-row">
              <label className="schemes-create-label">Name <span className="schemes-optional">(optional)</span></label>
              <input
                className="schemes-create-input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Year 11 Physics + Year 7 Science"
              />
            </div>

            <div className="schemes-create-row">
              <label className="schemes-create-label">Academic year</label>
              <select className="schemes-create-select" value={newYear} onChange={e => setNewYear(e.target.value)}>
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="schemes-create-row">
              <label className="schemes-create-label">
                Browse topics from <span className="schemes-optional">(tick all that apply)</span>
              </label>
              {courses.length === 0 ? (
                <p className="schemes-no-courses">Add courses to your profile first.</p>
              ) : (
                <div className="schemes-qual-list">
                  {courses.map(c => {
                    const key = `${c.qualification_id}:${c.exam_board}`
                    const checked = selectedQuals.has(key)
                    return (
                      <label key={key} className={`schemes-qual-item${checked ? ' schemes-qual-item--checked' : ''}`}>
                        <input
                          type="checkbox"
                          className="schemes-qual-check"
                          checked={checked}
                          onChange={() => toggleQual(key)}
                        />
                        <span className="schemes-qual-label">{offeringLabel(c.qualification_id, c.exam_board)}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="schemes-create-actions">
              <button className="schemes-cancel-btn" onClick={() => { setCreating(false); setSelectedQuals(new Set()) }}>Cancel</button>
              <button className="schemes-confirm-btn" disabled={selectedQuals.size === 0} onClick={handleCreate}>
                Create scheme
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="schemes-empty">Loading…</div>
        ) : schemes.length === 0 && !creating ? (
          <div className="schemes-empty-state">
            <div className="schemes-empty-icon">📅</div>
            <p className="schemes-empty-text">No schemes yet — create one to start planning your teaching year.</p>
          </div>
        ) : (
          <div className="schemes-list">
            {schemes.map(s => (
              <div key={s.id} className="schemes-card" onClick={() => navigate(`/schemes/${s.id}`)}>
                <div className="schemes-card-body">
                  {renamingId === s.id ? (
                    <input
                      className="schemes-rename-input"
                      value={renameVal}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                      onChange={e => setRenameVal(e.target.value)}
                      onBlur={async () => {
                        if (renameVal.trim()) await rename(s.id, renameVal.trim())
                        setRenamingId(null)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                    />
                  ) : (
                    <h3 className="schemes-card-name">{s.name}</h3>
                  )}
                  <p className="schemes-card-meta">
                    {(s.browsable_qualifications?.length
                      ? s.browsable_qualifications.map(q => offeringLabel(q.qualification_id, q.exam_board)).join(' · ')
                      : offeringLabel(s.qualification_id, s.exam_board)
                    )} · {s.academic_year}
                  </p>
                </div>
                <div className="schemes-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="schemes-card-btn" title="Rename" onClick={() => { setRenamingId(s.id); setRenameVal(s.name) }}>✏️</button>
                  <button className="schemes-card-btn schemes-card-btn--danger" title="Delete"
                    onClick={async () => { if (confirm(`Delete "${s.name}"?`)) await remove(s.id) }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
