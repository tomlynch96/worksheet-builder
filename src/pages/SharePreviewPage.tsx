import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { WorksheetPreview } from '../components/preview/WorksheetPreview'
import { useProfileContext } from '../context/ProfileContext'
import { useSupabaseWorksheets } from '../hooks/useSupabaseWorksheets'
import { QUALIFICATION_OFFERINGS, getSpecTopics } from '../data/qualifications'
import type { WorksheetEntry } from '../hooks/useSupabaseWorksheets'
import './SharePreviewPage.css'

function qualFamily(qualId: string): string {
  if (qualId.startsWith('alevel-')) return 'alevel'
  if (qualId.startsWith('gcse-')) return 'gcse'
  if (qualId.startsWith('ib-')) return 'ib'
  if (qualId.startsWith('exploring-science-')) return 'exploring-science'
  return qualId
}

function qualSubject(qualId: string): string {
  return qualId.replace(/^(alevel|gcse|ib|exploring-science-y\d+)-?/, '')
}

function findSuggestedCourse(
  myCourses: { qualification_id: string; exam_board: string }[],
  worksheetQualId: string,
  worksheetBoard: string,
): { qualification_id: string; exam_board: string } | null {
  if (!worksheetQualId) return myCourses[0] ?? null
  const wFamily = qualFamily(worksheetQualId)
  const wSubject = qualSubject(worksheetQualId)
  return (
    myCourses.find(c => c.qualification_id === worksheetQualId && c.exam_board === worksheetBoard) ??
    myCourses.find(c => c.qualification_id === worksheetQualId) ??
    myCourses.find(c => qualFamily(c.qualification_id) === wFamily && qualSubject(c.qualification_id) === wSubject) ??
    myCourses.find(c => qualSubject(c.qualification_id) === wSubject) ??
    null
  )
}

export function SharePreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile, loading: authLoading } = useProfileContext()
  const { fetchByShareId, copyToMyLibrary } = useSupabaseWorksheets(profile?.id ?? null)

  const [entry, setEntry] = useState<WorksheetEntry | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [copying, setCopying] = useState(false)

  // Reallocation state (only relevant when logged in + course mismatch)
  const [showReallocate, setShowReallocate] = useState(false)
  const [reallocQual, setReallocQual] = useState('')
  const [reallocBoard, setReallocBoard] = useState('')
  const [reallocSpec, setReallocSpec] = useState('')

  useEffect(() => {
    if (!id) return
    fetchByShareId(id).then(res => {
      if (res) setEntry(res)
      else setLoadError(true)
    })
  }, [id, fetchByShareId])

  if (loadError) {
    return (
      <div className="sp-layout">
        <header className="sp-topbar">
          <a href="/" className="sp-brand">
            <img src="/logo.svg" className="sp-logo" alt="The Worksheet Project" />
          </a>
        </header>
        <main className="sp-main sp-main--center">
          <p className="sp-error">This share link is no longer active.</p>
          <a className="sp-cta-btn" href="/">Go to home</a>
        </main>
      </div>
    )
  }

  if (!entry || authLoading) {
    return (
      <div className="sp-layout">
        <header className="sp-topbar">
          <a href="/" className="sp-brand">
            <img src="/logo.svg" className="sp-logo" alt="The Worksheet Project" />
          </a>
        </header>
        <main className="sp-main sp-main--center">
          <div className="sp-spinner" />
        </main>
      </div>
    )
  }

  const myCourses = profile?.user_courses ?? []
  const teachesThisCourse = profile
    ? myCourses.some(c => c.qualification_id === entry.qualification_id && c.exam_board === entry.exam_board)
    : false

  function initiateReallocate() {
    const suggested = findSuggestedCourse(myCourses, entry!.qualification_id ?? '', entry!.exam_board)
    if (suggested) {
      setReallocQual(suggested.qualification_id)
      setReallocBoard(suggested.exam_board)
    }
    setShowReallocate(true)
  }

  async function handleCopy() {
    if (!entry || !profile) return
    setCopying(true)
    let overrides: { qualification_id?: string; exam_board?: string; spec_point?: string | null } | undefined
    if (!teachesThisCourse) {
      overrides = {
        qualification_id: reallocQual || undefined,
        exam_board: reallocBoard || entry.exam_board,
        spec_point: reallocSpec || null,
      }
    }
    const copied = await copyToMyLibrary(entry.id, overrides)
    setCopying(false)
    if (copied) navigate('/editor', { state: { worksheet: copied.worksheet, aiGenerated: false } })
  }

  const qualOffering = QUALIFICATION_OFFERINGS.find(q => q.id === reallocQual)
  const reallocBoards = qualOffering?.examBoards ?? []
  const reallocTopics = reallocQual && reallocBoard ? (getSpecTopics(reallocQual, reallocBoard) ?? []) : []
  const copyReady = teachesThisCourse || (reallocQual && reallocBoard)

  return (
    <div className="sp-layout">
      <header className="sp-topbar">
        <a href="/" className="sp-brand">
          <img src="/logo.svg" className="sp-logo" alt="The Worksheet Project" />
        </a>
        <div className="sp-topbar-right">
          {!profile && (
            <a
              className="sp-auth-btn"
              href={`/onboarding?return=/share/${id}`}
            >
              Sign up / Log in to save, edit and print →
            </a>
          )}
        </div>
      </header>

      <div className="sp-body">
        {/* Sidebar */}
        <aside className="sp-sidebar">
          <div className="sp-meta-badges">
            {entry.spec_point && <span className="sp-badge sp-badge--spec">{entry.spec_point}</span>}
            <span className="sp-badge sp-badge--board">{entry.exam_board}</span>
            {entry.tier && <span className="sp-badge sp-badge--tier">{entry.tier}</span>}
          </div>
          <h1 className="sp-sidebar-title">{entry.title || 'Untitled'}</h1>
          {entry.topic && <p className="sp-sidebar-topic">{entry.topic}</p>}
          <p className="sp-sidebar-author">
            {entry.author_name ? `By ${entry.author_name}` : 'Shared by a teacher'}
          </p>
          <p className="sp-sidebar-count">
            {entry.question_count} question{entry.question_count !== 1 ? 's' : ''}
          </p>

          {/* Action area */}
          {!profile ? (
            <a
              className="sp-copy-btn"
              href={`/onboarding?return=/share/${id}`}
            >
              Sign up to save &amp; edit this worksheet →
            </a>
          ) : teachesThisCourse ? (
            <button className="sp-copy-btn" onClick={handleCopy} disabled={copying}>
              {copying ? 'Copying…' : 'Copy to my library →'}
            </button>
          ) : !showReallocate ? (
            <button className="sp-copy-btn" onClick={initiateReallocate}>
              Copy to my library →
            </button>
          ) : (
            <>
              <div className="sp-realloc">
                <p className="sp-realloc-label">Reassign to your course</p>
                <select
                  className="sp-select"
                  value={reallocQual}
                  onChange={e => { setReallocQual(e.target.value); setReallocBoard(''); setReallocSpec('') }}
                >
                  <option value="">Select qualification</option>
                  {QUALIFICATION_OFFERINGS
                    .filter(q => myCourses.some(c => c.qualification_id === q.id))
                    .map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
                </select>
                {reallocQual && reallocBoards.length > 0 && (
                  <select
                    className="sp-select"
                    value={reallocBoard}
                    onChange={e => { setReallocBoard(e.target.value); setReallocSpec('') }}
                  >
                    <option value="">Select exam board</option>
                    {reallocBoards
                      .filter(b => myCourses.some(c => c.qualification_id === reallocQual && c.exam_board === b))
                      .map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                )}
                {reallocTopics.length > 0 && (
                  <select
                    className="sp-select"
                    value={reallocSpec}
                    onChange={e => setReallocSpec(e.target.value)}
                  >
                    <option value="">No spec point (optional)</option>
                    {reallocTopics.flatMap(topic => [
                      <option key={topic.ref} value={topic.ref} disabled className="sp-option-group">
                        {topic.title}
                      </option>,
                      ...topic.points.map(pt => (
                        <option key={pt.ref} value={pt.ref}>{pt.ref} — {pt.title}</option>
                      )),
                    ])}
                  </select>
                )}
              </div>
              <button className="sp-copy-btn" onClick={handleCopy} disabled={copying || !copyReady}>
                {copying ? 'Copying…' : 'Copy and reassign →'}
              </button>
            </>
          )}
        </aside>

        {/* Preview */}
        <div className="sp-preview-area">
          <WorksheetPreview worksheet={entry.worksheet} mode="worksheet" />
        </div>
      </div>
    </div>
  )
}
