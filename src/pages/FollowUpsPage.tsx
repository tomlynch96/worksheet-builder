import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/layout/Topbar'
import { FollowUpModal } from '../components/FollowUpModal'
import { useProfileContext } from '../context/ProfileContext'
import { useMCQuiz } from '../hooks/useMCQuiz'
import { useSupabaseWorksheets } from '../hooks/useSupabaseWorksheets'
import { supabase, isConfigured } from '../lib/supabase'
import type { MCQuestion, MCQuiz } from '../types/mcQuiz'
import '../pages/AdminPage.css'
import './FollowUpsPage.css'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function FollowUpsPage() {
  const { profile } = useProfileContext()
  const navigate = useNavigate()
  const { saveFollowUp, fetchFollowUps, remove } = useMCQuiz(profile?.id ?? null)
  const { fetchById: fetchWorksheetById } = useSupabaseWorksheets(profile?.id ?? null)

  const [followUps, setFollowUps] = useState<MCQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [openingWorksheet, setOpeningWorksheet] = useState<string | null>(null)
  const [view, setView] = useState<'uploads' | 'all'>('uploads')

  useEffect(() => {
    if (!profile?.is_admin) navigate('/', { replace: true })
  }, [profile, navigate])

  const load = useCallback(async () => {
    setLoading(true)
    const rows = await fetchFollowUps(view === 'all')
    setFollowUps(rows)
    setLoading(false)
  }, [fetchFollowUps, view])

  useEffect(() => { load() }, [load])

  async function handleConfirm(
    title: string,
    questions: MCQuestion[],
    questionCount: number,
    versionCount: number,
    sourceFile: { file: File; base64: string; mimeType: string },
  ) {
    if (!profile?.id || !isConfigured) return
    setSaving(true)
    try {
      const path = `${profile.id}/${crypto.randomUUID()}-${sourceFile.file.name}`
      const { error: uploadError } = await supabase.storage
        .from('follow-up-sources')
        .upload(path, sourceFile.file, { contentType: sourceFile.mimeType })
      if (uploadError) throw uploadError

      const quiz = await saveFollowUp(title, questions, questionCount, versionCount, {
        path,
        name: sourceFile.file.name,
        type: sourceFile.mimeType,
      })
      setShowModal(false)
      if (quiz) navigate(`/quiz/${quiz.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save follow up')
    } finally {
      setSaving(false)
    }
  }

  async function handleDownloadSource(entry: MCQuiz) {
    if (!entry.source_file_path) return
    setDownloading(entry.id)
    try {
      const { data, error } = await supabase.storage
        .from('follow-up-sources')
        .createSignedUrl(entry.source_file_path, 60)
      if (error || !data?.signedUrl) throw error || new Error('Could not create download link')
      window.open(data.signedUrl, '_blank')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download original document')
    } finally {
      setDownloading(null)
    }
  }

  async function handleOpenWorksheet(entry: MCQuiz) {
    if (!entry.worksheet_id) return
    setOpeningWorksheet(entry.id)
    try {
      const worksheetEntry = await fetchWorksheetById(entry.worksheet_id)
      if (!worksheetEntry) throw new Error('Worksheet not found — it may have been deleted.')
      navigate('/editor', { state: { worksheet: worksheetEntry.worksheet } })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to open worksheet')
    } finally {
      setOpeningWorksheet(null)
    }
  }

  async function handleDelete(entry: MCQuiz) {
    if (!confirm(`Delete "${entry.title || 'Untitled'}"? This cannot be undone.`)) return
    setRemoving(entry.id)
    await remove(entry.id)
    setFollowUps(prev => prev.filter(f => f.id !== entry.id))
    setRemoving(null)
  }

  if (!profile?.is_admin) return null

  return (
    <div className="admin-layout">
      <Topbar />
      <main className="admin-main">
        <div className="admin-header">
          <h1 className="admin-title">Follow ups</h1>
          <p className="admin-subtitle">
            {followUps.length} follow up{followUps.length !== 1 ? 's' : ''} · upload a PDF, Word doc, or image to generate a multiple choice follow-up quiz
          </p>
          <button className="admin-save-btn fu-new-btn" onClick={() => setShowModal(true)}>
            + New follow up
          </button>
        </div>

        <div className="fu-tabs">
          <button
            className={`fu-tab${view === 'uploads' ? ' fu-tab--active' : ''}`}
            onClick={() => setView('uploads')}
          >
            Uploaded documents
          </button>
          <button
            className={`fu-tab${view === 'all' ? ' fu-tab--active' : ''}`}
            onClick={() => setView('all')}
          >
            Include worksheet quizzes
          </button>
        </div>

        {loading ? (
          <div className="admin-empty">Loading…</div>
        ) : followUps.length === 0 ? (
          <div className="admin-empty">No follow ups yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Source</th>
                <th>Qs</th>
                <th>Versions</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {followUps.map(entry => (
                <tr key={entry.id}>
                  <td className="admin-cell-title">
                    <button className="fu-title-link" onClick={() => navigate(`/quiz/${entry.id}`)}>
                      {entry.title || 'Untitled'}
                    </button>
                  </td>
                  <td>
                    <span className={`fu-type-badge fu-type-badge--${entry.source_type}`}>
                      {entry.source_type === 'document' ? 'Uploaded' : 'Worksheet'}
                    </span>
                  </td>
                  <td className="admin-cell-spec">
                    {entry.source_type === 'worksheet' && entry.worksheet_id ? (
                      <button
                        className="fu-source-link"
                        onClick={() => handleOpenWorksheet(entry)}
                        disabled={openingWorksheet === entry.id}
                        title="Open the source worksheet in the editor"
                      >
                        {openingWorksheet === entry.id ? 'Opening…' : 'Open worksheet'}
                      </button>
                    ) : entry.source_file_path ? (
                      <button
                        className="fu-source-link"
                        onClick={() => handleDownloadSource(entry)}
                        disabled={downloading === entry.id}
                        title="Download the original uploaded document"
                      >
                        {downloading === entry.id ? 'Preparing…' : (entry.source_file_name || 'Download')}
                      </button>
                    ) : (
                      entry.source_file_name || '—'
                    )}
                  </td>
                  <td>{entry.question_count}</td>
                  <td>{entry.version_count}</td>
                  <td className="admin-cell-date">{formatDate(entry.created_at)}</td>
                  <td>
                    <button
                      className="admin-remove-btn"
                      onClick={() => handleDelete(entry)}
                      disabled={removing === entry.id}
                    >
                      {removing === entry.id ? 'Removing…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {showModal && (
        <FollowUpModal
          onConfirm={handleConfirm}
          onClose={() => setShowModal(false)}
          saving={saving}
        />
      )}
    </div>
  )
}
