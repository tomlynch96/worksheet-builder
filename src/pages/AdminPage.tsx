import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/layout/Topbar'
import { useProfileContext } from '../context/ProfileContext'
import { useSupabaseWorksheets } from '../hooks/useSupabaseWorksheets'
import { useWelcomeConfig } from '../hooks/useAppConfig'
import { QUALIFICATION_OFFERINGS } from '../data/qualifications'
import type { WorksheetEntry } from '../hooks/useSupabaseWorksheets'
import './AdminPage.css'

export function AdminPage() {
  const { profile } = useProfileContext()
  const navigate = useNavigate()
  const { fetchPublic, unpublish } = useSupabaseWorksheets(profile?.id ?? null)
  const { config: welcomeConfig, saving: savingWelcome, save: saveWelcome } = useWelcomeConfig()

  const [results, setResults] = useState<WorksheetEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedQual, setSelectedQual] = useState('')

  // Welcome message editor state (seeded from config once loaded)
  const [welcomeTitle, setWelcomeTitle] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [welcomeSaved, setWelcomeSaved] = useState(false)
  useEffect(() => {
    setWelcomeTitle(welcomeConfig.title)
    setWelcomeMessage(welcomeConfig.message)
  }, [welcomeConfig.title, welcomeConfig.message])

  async function handleSaveWelcome() {
    const ok = await saveWelcome({ title: welcomeTitle, message: welcomeMessage })
    if (ok) { setWelcomeSaved(true); setTimeout(() => setWelcomeSaved(false), 2500) }
  }

  useEffect(() => {
    if (!profile?.is_admin) navigate('/', { replace: true })
  }, [profile, navigate])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetchPublic({
      qualification_id: selectedQual || undefined,
      query: query.trim() || undefined,
    })
    setResults(res)
    setLoading(false)
  }, [fetchPublic, selectedQual, query])

  useEffect(() => { load() }, [load])

  async function handleRemove(entry: WorksheetEntry) {
    if (!confirm(`Remove "${entry.title || 'Untitled'}" from the public library?`)) return
    setRemoving(entry.id)
    await unpublish(entry.id)
    setResults(prev => prev.filter(r => r.id !== entry.id))
    setRemoving(null)
  }

  if (!profile?.is_admin) return null

  return (
    <div className="admin-layout">
      <Topbar />
      <main className="admin-main">
        <div className="admin-header">
          <h1 className="admin-title">Admin — Public Library</h1>
          <p className="admin-subtitle">
            {results.length} public worksheet{results.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Welcome message editor */}
        <section className="admin-section">
          <h2 className="admin-section-title">Welcome message</h2>
          <p className="admin-section-hint">
            Shown to every new user the first time they land on the home page. They must tick a consent checkbox before proceeding.
          </p>
          <div className="admin-field">
            <label className="admin-label">Title</label>
            <input
              className="admin-input"
              value={welcomeTitle}
              onChange={e => setWelcomeTitle(e.target.value)}
            />
          </div>
          <div className="admin-field">
            <label className="admin-label">Message body</label>
            <textarea
              className="admin-textarea"
              value={welcomeMessage}
              onChange={e => setWelcomeMessage(e.target.value)}
              rows={8}
              placeholder="Separate paragraphs with a blank line…"
            />
          </div>
          <div className="admin-field-actions">
            <button
              className="admin-save-btn"
              onClick={handleSaveWelcome}
              disabled={savingWelcome}
            >
              {savingWelcome ? 'Saving…' : welcomeSaved ? '✓ Saved' : 'Save message'}
            </button>
          </div>
        </section>

        <h2 className="admin-section-title">Public library</h2>

        <div className="admin-filters">
          <input
            className="admin-search"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title or topic…"
          />
          <select
            className="admin-select"
            value={selectedQual}
            onChange={e => setSelectedQual(e.target.value)}
          >
            <option value="">All qualifications</option>
            {QUALIFICATION_OFFERINGS.map(q => (
              <option key={q.id} value={q.id}>{q.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="admin-empty">Loading…</div>
        ) : results.length === 0 ? (
          <div className="admin-empty">No public worksheets found.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Board</th>
                <th>Spec</th>
                <th>Author</th>
                <th>Qs</th>
                <th>Published</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map(entry => (
                <tr key={entry.id}>
                  <td className="admin-cell-title">{entry.title || 'Untitled'}</td>
                  <td>
                    <span className="admin-badge admin-badge--board">{entry.exam_board}</span>
                  </td>
                  <td className="admin-cell-spec">{entry.spec_point || '—'}</td>
                  <td className="admin-cell-author">
                    {entry.author_name ?? 'Anonymous'}
                  </td>
                  <td>{entry.question_count}</td>
                  <td className="admin-cell-date">
                    {entry.published_at
                      ? new Date(entry.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
                      : '—'}
                  </td>
                  <td>
                    <button
                      className="admin-remove-btn"
                      onClick={() => handleRemove(entry)}
                      disabled={removing === entry.id}
                    >
                      {removing === entry.id ? 'Removing…' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  )
}
