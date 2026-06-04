import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/layout/Topbar'
import { useProfileContext } from '../context/ProfileContext'
import { useSupabaseWorksheets } from '../hooks/useSupabaseWorksheets'
import { useWelcomeConfig } from '../hooks/useAppConfig'
import { QUALIFICATION_OFFERINGS } from '../data/qualifications'
import { supabase } from '../lib/supabase'
import type { WorksheetEntry } from '../hooks/useSupabaseWorksheets'
import './AdminPage.css'

interface AdminStats {
  totalUsers: number
  newUsersWeek: number
  totalWorksheets: number
  newWorksheetsWeek: number
  totalEdits: number
  newEditsWeek: number
  publicWorksheets: number
  newPublicWeek: number
  totalSessions: number
  sessionsWeek: number
  uniqueVisitors: number
}

interface BreakdownRow { label: string; count: number }

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

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [boardBreakdown, setBoardBreakdown] = useState<BreakdownRow[]>([])
  const [qualBreakdown, setQualBreakdown] = useState<BreakdownRow[]>([])

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

  useEffect(() => {
    if (!profile?.is_admin) return
    fetchStats()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.is_admin])

  async function fetchStats() {
    setStatsLoading(true)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { count: totalUsers },
      { count: newUsersWeek },
      { count: totalWorksheets },
      { count: newWorksheetsWeek },
      { count: totalEdits },
      { count: newEditsWeek },
      { count: publicWorksheets },
      { count: newPublicWeek },
      { count: totalSessions },
      { count: sessionsWeek },
      { data: pvData },
      { data: wsData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('worksheets').select('*', { count: 'exact', head: true }),
      supabase.from('worksheets').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('worksheet_edits').select('*', { count: 'exact', head: true }),
      supabase.from('worksheet_edits').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('worksheets').select('*', { count: 'exact', head: true }).eq('is_public', true),
      supabase.from('worksheets').select('*', { count: 'exact', head: true }).eq('is_public', true).gte('published_at', weekAgo),
      supabase.from('page_views').select('*', { count: 'exact', head: true }),
      supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('visited_at', weekAgo),
      supabase.from('page_views').select('profile_id'),
      supabase.from('worksheets').select('exam_board, qualification_id'),
    ])

    const uniqueVisitors = new Set(pvData?.map(r => r.profile_id).filter(Boolean)).size

    setStats({
      totalUsers: totalUsers ?? 0,
      newUsersWeek: newUsersWeek ?? 0,
      totalWorksheets: totalWorksheets ?? 0,
      newWorksheetsWeek: newWorksheetsWeek ?? 0,
      totalEdits: totalEdits ?? 0,
      newEditsWeek: newEditsWeek ?? 0,
      publicWorksheets: publicWorksheets ?? 0,
      newPublicWeek: newPublicWeek ?? 0,
      totalSessions: totalSessions ?? 0,
      sessionsWeek: sessionsWeek ?? 0,
      uniqueVisitors,
    })

    if (wsData) {
      const boardMap: Record<string, number> = {}
      const qualMap: Record<string, number> = {}
      for (const ws of wsData) {
        if (ws.exam_board) boardMap[ws.exam_board] = (boardMap[ws.exam_board] ?? 0) + 1
        if (ws.qualification_id) qualMap[ws.qualification_id] = (qualMap[ws.qualification_id] ?? 0) + 1
      }
      setBoardBreakdown(
        Object.entries(boardMap).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
      )
      setQualBreakdown(
        Object.entries(qualMap).map(([id, count]) => ({
          label: QUALIFICATION_OFFERINGS.find(q => q.id === id)?.label ?? id,
          count,
        })).sort((a, b) => b.count - a.count)
      )
    }

    setStatsLoading(false)
  }

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

  function StatCard({ label, value, week, weekLabel = 'new this week' }: { label: string; value: number; week?: number; weekLabel?: string }) {
    return (
      <div className="admin-stat-card">
        <div className="admin-stat-value">{value.toLocaleString()}</div>
        <div className="admin-stat-label">{label}</div>
        {week !== undefined && week > 0 && (
          <div className="admin-stat-week">+{week} {weekLabel}</div>
        )}
      </div>
    )
  }

  function BreakdownBars({ rows }: { rows: BreakdownRow[] }) {
    const max = rows[0]?.count ?? 1
    return (
      <div className="admin-bar-list">
        {rows.map(row => (
          <div key={row.label} className="admin-bar-row">
            <div className="admin-bar-label">{row.label}</div>
            <div className="admin-bar-track">
              <div className="admin-bar-fill" style={{ width: `${(row.count / max) * 100}%` }} />
            </div>
            <div className="admin-bar-count">{row.count}</div>
          </div>
        ))}
      </div>
    )
  }

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

        {/* Stat cards */}
        {statsLoading ? (
          <div className="admin-stat-loading">Loading stats…</div>
        ) : stats && (
          <>
            <div className="admin-stat-grid">
              <StatCard label="Total users" value={stats.totalUsers} week={stats.newUsersWeek} />
              <StatCard label="Worksheets created" value={stats.totalWorksheets} week={stats.newWorksheetsWeek} />
              <StatCard label="Human edits" value={stats.totalEdits} week={stats.newEditsWeek} />
              <StatCard label="Public worksheets" value={stats.publicWorksheets} week={stats.newPublicWeek} />
              <StatCard label="Sessions (all time)" value={stats.totalSessions} week={stats.sessionsWeek} weekLabel="this week" />
              <StatCard label="Unique visitors" value={stats.uniqueVisitors} />
            </div>

            {(boardBreakdown.length > 0 || qualBreakdown.length > 0) && (
              <div className="admin-breakdown-row">
                {boardBreakdown.length > 0 && (
                  <div className="admin-breakdown">
                    <h3 className="admin-breakdown-title">By exam board</h3>
                    <BreakdownBars rows={boardBreakdown} />
                  </div>
                )}
                {qualBreakdown.length > 0 && (
                  <div className="admin-breakdown">
                    <h3 className="admin-breakdown-title">By qualification</h3>
                    <BreakdownBars rows={qualBreakdown} />
                  </div>
                )}
              </div>
            )}
          </>
        )}

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
