import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/layout/Topbar'
import { useProfileContext } from '../context/ProfileContext'
import { useSupabaseWorksheets } from '../hooks/useSupabaseWorksheets'
import { QUALIFICATION_OFFERINGS } from '../data/qualifications'
import { getSpecTopics } from '../data/qualifications'
import type { WorksheetEntry } from '../hooks/useSupabaseWorksheets'
import './PublicLibraryPage.css'

export function PublicLibraryPage() {
  const { profile } = useProfileContext()
  const { fetchPublic, copyToMyLibrary } = useSupabaseWorksheets(profile?.id ?? null)
  const navigate = useNavigate()

  const [results, setResults] = useState<WorksheetEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [copying, setCopying] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [selectedQual, setSelectedQual] = useState('')
  const [selectedBoard, setSelectedBoard] = useState('')
  const [selectedSpec, setSelectedSpec] = useState('')

  const selectedOffering = QUALIFICATION_OFFERINGS.find(q => q.id === selectedQual)
  const specTopics = selectedQual && selectedBoard ? getSpecTopics(selectedQual, selectedBoard) : []

  const search = useCallback(async () => {
    setLoading(true)
    const res = await fetchPublic({
      qualification_id: selectedQual || undefined,
      exam_board: selectedBoard || undefined,
      spec_point: selectedSpec || undefined,
      query: query.trim() || undefined,
    })
    setResults(res)
    setLoading(false)
  }, [fetchPublic, selectedQual, selectedBoard, selectedSpec, query])

  useEffect(() => { search() }, [search])

  async function handleCopy(entry: WorksheetEntry) {
    setCopying(entry.id)
    const copied = await copyToMyLibrary(entry.id)
    setCopying(null)
    if (copied) navigate('/editor', { state: { worksheet: copied.worksheet, aiGenerated: false } })
  }

  const boards = selectedOffering?.examBoards ?? []

  return (
    <div className="lib-layout">
      <Topbar />
      <main className="lib-main">
        <div className="lib-header">
          <h1 className="lib-title">Public Library</h1>
          <p className="lib-subtitle">
            Finished worksheets shared by teachers. Filter by spec point or search by topic.
          </p>
        </div>

        <div className="lib-filters">
          <input
            className="lib-search"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by topic or title…"
          />
          <select
            className="lib-select"
            value={selectedQual}
            onChange={e => { setSelectedQual(e.target.value); setSelectedBoard(''); setSelectedSpec('') }}
          >
            <option value="">All qualifications</option>
            {QUALIFICATION_OFFERINGS.map(q => (
              <option key={q.id} value={q.id}>{q.label}</option>
            ))}
          </select>
          {selectedQual && boards.length > 0 && (
            <select
              className="lib-select"
              value={selectedBoard}
              onChange={e => { setSelectedBoard(e.target.value); setSelectedSpec('') }}
            >
              <option value="">All exam boards</option>
              {boards.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
          {specTopics.length > 0 && (
            <select
              className="lib-select"
              value={selectedSpec}
              onChange={e => setSelectedSpec(e.target.value)}
            >
              <option value="">All spec points</option>
              {specTopics.flatMap(topic => [
                <option key={topic.ref} value={topic.ref} disabled className="lib-option-group">
                  {topic.title}
                </option>,
                ...topic.points.map(pt => (
                  <option key={pt.ref} value={pt.ref}>{pt.ref} — {pt.title}</option>
                )),
              ])}
            </select>
          )}
        </div>

        {loading ? (
          <div className="lib-empty">Searching…</div>
        ) : results.length === 0 ? (
          <div className="lib-empty">
            No public worksheets found.
            {!selectedQual && ' Generate and export worksheets to add them here.'}
          </div>
        ) : (
          <div className="lib-results">
            {results.map(entry => (
              <div key={entry.id} className="lib-card">
                <div className="lib-card-meta">
                  {entry.spec_point && <span className="lib-card-spec">{entry.spec_point}</span>}
                  <span className="lib-card-board">{entry.exam_board}</span>
                  {entry.tier && <span className="lib-card-tier">{entry.tier}</span>}
                </div>
                <h2 className="lib-card-title">{entry.title || 'Untitled'}</h2>
                {entry.topic && <p className="lib-card-topic">{entry.topic}</p>}
                <div className="lib-card-footer">
                  <span className="lib-card-author">
                    {entry.author_name ? `By ${entry.author_name}` : 'Anonymous teacher'}
                  </span>
                  <span className="lib-card-count">{entry.question_count} question{entry.question_count !== 1 ? 's' : ''}</span>
                  <button
                    className="lib-card-copy-btn"
                    onClick={() => handleCopy(entry)}
                    disabled={copying === entry.id}
                  >
                    {copying === entry.id ? 'Copying…' : 'Copy to my library →'}
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
