import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/layout/Topbar'
import { useProfileContext } from '../context/ProfileContext'
import { useSchemes } from '../hooks/useSchemes'
import { QUALIFICATION_OFFERINGS, offeringLabel } from '../data/qualifications'
import './SchemesPage.css'

const ACADEMIC_YEARS = ['2024-25', '2025-26', '2026-27']

export function SchemesPage() {
  const { profile } = useProfileContext()
  const { schemes, loading, create, rename, remove } = useSchemes(profile?.id ?? null)
  const navigate = useNavigate()

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newQual, setNewQual] = useState('')
  const [newBoard, setNewBoard] = useState('')
  const [newYear, setNewYear] = useState('2025-26')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')

  const courses = (profile?.user_courses ?? []).filter(c => {
    const o = QUALIFICATION_OFFERINGS.find(q => q.id === c.qualification_id)
    return o && o.examBoards.includes(c.exam_board)
  })

  const selectedOffering = QUALIFICATION_OFFERINGS.find(o => o.id === newQual)

  async function handleCreate() {
    if (!newQual || !newBoard) return
    const name = newName.trim() || offeringLabel(newQual, newBoard)
    const s = await create({ qualification_id: newQual, exam_board: newBoard, name, academic_year: newYear })
    if (s) {
      setCreating(false)
      setNewName(''); setNewQual(''); setNewBoard(''); setNewYear('2025-26')
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
            <p className="schemes-sub">Build a term-by-term teaching plan, assign worksheets to topics, and generate spaced recall check-ins.</p>
          </div>
          <button className="schemes-new-btn" onClick={() => setCreating(true)}>+ New scheme</button>
        </div>

        {creating && (
          <div className="schemes-create-card">
            <h3 className="schemes-create-heading">New scheme of work</h3>
            <div className="schemes-create-row">
              <label className="schemes-create-label">Course</label>
              <select
                className="schemes-create-select"
                value={newQual ? `${newQual}:${newBoard}` : ''}
                onChange={e => {
                  const [q, b] = e.target.value.split(':')
                  setNewQual(q); setNewBoard(b)
                }}
              >
                <option value="">Select a course…</option>
                {courses.map(c => (
                  <option key={`${c.qualification_id}:${c.exam_board}`} value={`${c.qualification_id}:${c.exam_board}`}>
                    {offeringLabel(c.qualification_id, c.exam_board)}
                  </option>
                ))}
              </select>
            </div>
            <div className="schemes-create-row">
              <label className="schemes-create-label">Academic year</label>
              <select className="schemes-create-select" value={newYear} onChange={e => setNewYear(e.target.value)}>
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="schemes-create-row">
              <label className="schemes-create-label">Name <span className="schemes-optional">(optional)</span></label>
              <input
                className="schemes-create-input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={selectedOffering ? offeringLabel(newQual, newBoard) : 'e.g. Year 11 Physics'}
              />
            </div>
            <div className="schemes-create-actions">
              <button className="schemes-cancel-btn" onClick={() => setCreating(false)}>Cancel</button>
              <button className="schemes-confirm-btn" disabled={!newQual || !newBoard} onClick={handleCreate}>
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
                        if (e.key === 'Escape') { setRenamingId(null) }
                      }}
                    />
                  ) : (
                    <h3 className="schemes-card-name">{s.name}</h3>
                  )}
                  <p className="schemes-card-meta">{offeringLabel(s.qualification_id, s.exam_board)} · {s.academic_year}</p>
                </div>
                <div className="schemes-card-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className="schemes-card-btn"
                    title="Rename"
                    onClick={() => { setRenamingId(s.id); setRenameVal(s.name) }}
                  >
                    ✏️
                  </button>
                  <button
                    className="schemes-card-btn schemes-card-btn--danger"
                    title="Delete"
                    onClick={async () => {
                      if (confirm(`Delete "${s.name}"?`)) await remove(s.id)
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
