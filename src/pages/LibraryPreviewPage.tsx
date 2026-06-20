import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Topbar } from '../components/layout/Topbar'
import { WorksheetPreview } from '../components/preview/WorksheetPreview'
import { useProfileContext } from '../context/ProfileContext'
import { useSupabaseWorksheets } from '../hooks/useSupabaseWorksheets'
import { QUALIFICATION_OFFERINGS, getSpecTopics } from '../data/qualifications'
import type { WorksheetEntry } from '../hooks/useSupabaseWorksheets'
import './LibraryPreviewPage.css'

// Extract the level-family prefix from a qualification id, e.g. "alevel" from "alevel-physics"
function qualFamily(qualId: string): string {
  if (qualId.startsWith('alevel-')) return 'alevel'
  if (qualId.startsWith('gcse-')) return 'gcse'
  if (qualId.startsWith('ib-')) return 'ib'
  if (qualId.startsWith('exploring-science-')) return 'exploring-science'
  return qualId
}

// Extract subject from a qualification id, e.g. "physics" from "alevel-physics"
function qualSubject(qualId: string): string {
  return qualId.replace(/^(alevel|gcse|ib|exploring-science-y\d+)-?/, '')
}

// Find the best matching course from the teacher's courses given a worksheet's qualification
function findSuggestedCourse(
  myCourses: { qualification_id: string; exam_board: string }[],
  worksheetQualId: string,
  worksheetBoard: string,
): { qualification_id: string; exam_board: string } | null {
  if (!worksheetQualId) return myCourses[0] ?? null

  const wFamily = qualFamily(worksheetQualId)
  const wSubject = qualSubject(worksheetQualId)

  // 1. Same qual, same board (shouldn't reach here normally)
  let match = myCourses.find(c => c.qualification_id === worksheetQualId && c.exam_board === worksheetBoard)
  if (match) return match

  // 2. Same qual, different board (e.g. same A Level Physics, different board)
  match = myCourses.find(c => c.qualification_id === worksheetQualId)
  if (match) return match

  // 3. Same level-family and subject (e.g. alevel-physics → alevel-physics AQA)
  match = myCourses.find(c => qualFamily(c.qualification_id) === wFamily && qualSubject(c.qualification_id) === wSubject)
  if (match) return match

  // 4. Same subject, any level
  match = myCourses.find(c => qualSubject(c.qualification_id) === wSubject)
  if (match) return match

  return null
}

export function LibraryPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useProfileContext()
  const { fetchPublicById, copyToMyLibrary } = useSupabaseWorksheets(profile?.id ?? null)

  const [entry, setEntry] = useState<WorksheetEntry | null>(
    (location.state as { entry?: WorksheetEntry } | null)?.entry ?? null,
  )
  const [loadError, setLoadError] = useState(false)
  const [copying, setCopying] = useState(false)

  // Reallocation state
  const [showReallocate, setShowReallocate] = useState(false)
  const [reallocQual, setReallocQual] = useState('')
  const [reallocBoard, setReallocBoard] = useState('')
  const [reallocSpec, setReallocSpec] = useState('')

  useEffect(() => {
    if (entry || !id) return
    fetchPublicById(id).then(res => {
      if (res) setEntry(res)
      else setLoadError(true)
    })
  }, [id, entry, fetchPublicById])

  if (loadError) {
    return (
      <div className="lp-layout">
        <Topbar />
        <main className="lp-main lp-main--center">
          <p className="lp-error">Worksheet not found or no longer public.</p>
          <button className="lp-back-btn" onClick={() => navigate('/library')}>Back to library</button>
        </main>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="lp-layout">
        <Topbar />
        <main className="lp-main lp-main--center">
          <div className="lp-spinner" />
        </main>
      </div>
    )
  }

  const myCourses = profile?.user_courses ?? []
  const teachesThisCourse = myCourses.some(
    c => c.qualification_id === entry.qualification_id && c.exam_board === entry.exam_board,
  )

  function initiateReallocate() {
    // Auto-suggest the best matching course from the teacher's profile
    const suggested = findSuggestedCourse(myCourses, entry!.qualification_id ?? '', entry!.exam_board)
    if (suggested) {
      setReallocQual(suggested.qualification_id)
      setReallocBoard(suggested.exam_board)
    }
    setShowReallocate(true)
  }

  async function handleCopy() {
    if (!entry) return
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

  const copyLabel = copying ? 'Copying…' : teachesThisCourse ? 'Copy to my library →' : 'Copy and reassign →'

  return (
    <div className="lp-layout">
      <Topbar />
      <div className="lp-body">
        {/* Sidebar */}
        <aside className="lp-sidebar">
          <button className="lp-back-link" onClick={() => navigate('/library')}>
            ← Public Library
          </button>

          {/* Copy button — always at the top */}
          {teachesThisCourse ? (
            <button className="lp-copy-btn" onClick={handleCopy} disabled={copying}>
              {copyLabel}
            </button>
          ) : !showReallocate ? (
            <button className="lp-copy-btn" onClick={initiateReallocate}>
              Copy to my library →
            </button>
          ) : (
            <button className="lp-copy-btn" onClick={handleCopy} disabled={copying || !copyReady}>
              {copyLabel}
            </button>
          )}

          {/* Mismatch notice / reallocation UI */}
          {!teachesThisCourse && !showReallocate && (
            <div className="lp-mismatch-notice">
              <p className="lp-mismatch-text">
                This worksheet is tagged to a course you don't teach. Pressing copy will let you reassign it to one of your courses.
              </p>
            </div>
          )}

          {!teachesThisCourse && showReallocate && (
            <div className="lp-realloc">
              <p className="lp-realloc-label">Reassign to your course</p>

              <select
                className="lp-select"
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
                  className="lp-select"
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
                  className="lp-select"
                  value={reallocSpec}
                  onChange={e => setReallocSpec(e.target.value)}
                >
                  <option value="">No spec point (optional)</option>
                  {reallocTopics.flatMap(topic => [
                    <option key={topic.ref} value={topic.ref} disabled className="lp-option-group">
                      {topic.title}
                    </option>,
                    ...topic.points.map(pt => (
                      <option key={pt.ref} value={pt.ref}>{pt.ref} — {pt.title}</option>
                    )),
                  ])}
                </select>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="lp-sidebar-meta">
            <div className="lp-meta-badges">
              {entry.spec_point && <span className="lp-badge lp-badge--spec">{entry.spec_point}</span>}
              <span className="lp-badge lp-badge--board">{entry.exam_board}</span>
              {entry.tier && <span className="lp-badge lp-badge--tier">{entry.tier}</span>}
            </div>
            <h1 className="lp-sidebar-title">{entry.title || 'Untitled'}</h1>
            {entry.topic && <p className="lp-sidebar-topic">{entry.topic}</p>}
            <p className="lp-sidebar-author">
              {entry.author_name ? `By ${entry.author_name}` : 'Anonymous teacher'}
            </p>
            <p className="lp-sidebar-count">
              {entry.question_count} question{entry.question_count !== 1 ? 's' : ''}
            </p>
          </div>
        </aside>

        {/* Preview */}
        <div className="lp-preview-area">
          <WorksheetPreview worksheet={entry.worksheet} mode="worksheet" />
        </div>
      </div>
    </div>
  )
}
