import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/layout/Topbar'
import { useProfileContext } from '../context/ProfileContext'
import { supabase } from '../lib/supabase'
import { QUALIFICATION_OFFERINGS } from '../data/qualifications'
import type { UserCourse } from '../types/profile'
import './ProfilePage.css'

const EXAM_BOARDS = ['AQA', 'OCR', 'Edexcel', 'WJEC']
const boardQuals = QUALIFICATION_OFFERINGS.filter(q => q.examBoards.length > 1)
const singleQuals = QUALIFICATION_OFFERINGS.filter(q => q.examBoards.length === 1)

export function ProfilePage() {
  const { profile, signOut, updateProfile, linkProvider, getLinkedIdentities } = useProfileContext()
  const navigate = useNavigate()

  const [name, setName] = useState(profile?.name ?? '')
  const [philosophy, setPhilosophy] = useState(profile?.teaching_philosophy ?? '')
  const [selected, setSelected] = useState<Set<string>>(new Set(
    profile?.user_courses.map(c => `${c.qualification_id}:${c.exam_board}`) ?? []
  ))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  const [linkedProviders, setLinkedProviders] = useState<string[]>([])
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null)
  const [linkError, setLinkError] = useState('')

  const refreshLinkedProviders = useCallback(async () => {
    const providers = await getLinkedIdentities()
    setLinkedProviders(providers)
  }, [getLinkedIdentities])

  useEffect(() => { refreshLinkedProviders() }, [refreshLinkedProviders])

  async function handleLinkProvider(provider: 'google' | 'azure') {
    setLinkingProvider(provider)
    setLinkError('')
    const result = await linkProvider(provider)
    setLinkingProvider(null)
    if (result.error) setLinkError(result.error)
    else refreshLinkedProviders()
  }

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/onboarding', { replace: true })
  }

  const [email, setEmail] = useState('')
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email)
    })
  }, [])

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setPhilosophy(profile.teaching_philosophy ?? '')
      setSelected(new Set(profile.user_courses.map(c => `${c.qualification_id}:${c.exam_board}`)))
    }
  }, [profile])

  const [showCustomBoard, setShowCustomBoard] = useState(false)
  const [customBoardName, setCustomBoardName] = useState('')
  const [customSubjects, setCustomSubjects] = useState<Set<string>>(new Set())

  const CUSTOM_SUBJECTS = [
    { id: 'gcse-physics',   label: 'GCSE Physics' },
    { id: 'gcse-biology',   label: 'GCSE Biology' },
    { id: 'gcse-chemistry', label: 'GCSE Chemistry' },
    { id: 'alevel-physics', label: 'A Level Physics' },
  ]

  function toggleCustomSubject(id: string) {
    setCustomSubjects(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function addCustomBoard() {
    const board = customBoardName.trim()
    if (!board || customSubjects.size === 0) return
    setSelected(prev => {
      const next = new Set(prev)
      customSubjects.forEach(qualId => next.add(`${qualId}:${board}`))
      return next
    })
    setCustomBoardName('')
    setCustomSubjects(new Set())
    setShowCustomBoard(false)
  }

  function toggle(qualId: string, board: string) {
    const key = `${qualId}:${board}`
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (selected.size === 0) { setError('Please keep at least one course selected.'); return }
    setSaving(true)
    setError('')

    const courses: Omit<UserCourse, 'id' | 'profile_id'>[] = Array.from(selected).map(key => {
      const [qualification_id, exam_board] = key.split(':')
      return { qualification_id, exam_board }
    })

    const ok = await updateProfile(name.trim() || 'Teacher', courses, philosophy)
    setSaving(false)
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      setError('Failed to save — please try again.')
    }
  }

  return (
    <div className="profile-layout">
      <Topbar />

      <main className="profile-main">
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-avatar">
              {(name || 'T').charAt(0).toUpperCase()}
            </div>
            <div className="profile-header-info">
              <h1 className="profile-title">Your Profile</h1>
              {email && <p className="profile-email">{email}</p>}
              <p className="profile-subtitle">Update your name and the courses you teach.</p>
            </div>
            <button
              type="button"
              className="profile-signout"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>

          <form onSubmit={handleSave} className="profile-form">
            <div className="profile-field">
              <label className="profile-label">Your name</label>
              <input
                className="profile-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Mr Smith"
              />
            </div>

            <div className="profile-field">
              <label className="profile-label">Your teaching approach</label>
              <textarea
                className="profile-textarea"
                rows={5}
                value={philosophy}
                onChange={e => setPhilosophy(e.target.value)}
                placeholder="Describe your approach so the AI generates worksheets that fit your style. For example: I teach mixed-ability Year 10 and 11. My students struggle with rearranging equations. I like questions that build confidence before increasing demand. Mark schemes should always note common misconceptions. Worked examples should show algebra before substituting numbers."
              />
              <p className="profile-field-hint">
                This is included in every AI generation — the more specific, the better the output.
              </p>
            </div>

            <div className="profile-field">
              <label className="profile-label">Courses you teach</label>
              <p className="profile-field-hint">
                Select every combination you teach — this organises your worksheets and pre-fills new ones.
              </p>

              <div className="profile-course-grid">
                <div className="profile-board-key">
                  <span />
                  {EXAM_BOARDS.map(b => (
                    <span key={b} className="profile-board-label">{b}</span>
                  ))}
                </div>

                {boardQuals.map(qual => (
                  <div key={qual.id} className="profile-qual-row">
                    <span className="profile-qual-name">{qual.label}</span>
                    {EXAM_BOARDS.map(board => {
                      const key = `${qual.id}:${board}`
                      const checked = selected.has(key)
                      return (
                        <button
                          key={board}
                          type="button"
                          className={`profile-board-btn${checked ? ' profile-board-btn--on' : ''}`}
                          onClick={() => toggle(qual.id, board)}
                          aria-pressed={checked}
                        >
                          {checked ? '✓' : ''}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>

              {singleQuals.length > 0 && (
                <div className="profile-ks3-section">
                  <p className="profile-ks3-label">KS3</p>
                  {singleQuals.map(qual => {
                    const board = qual.examBoards[0]
                    const key = `${qual.id}:${board}`
                    const checked = selected.has(key)
                    return (
                      <div key={qual.id} className="profile-ks3-row">
                        <span className="profile-qual-name">{qual.label}</span>
                        <button
                          type="button"
                          className={`profile-board-btn${checked ? ' profile-board-btn--on' : ''}`}
                          onClick={() => toggle(qual.id, board)}
                          aria-pressed={checked}
                        >
                          {checked ? '✓' : ''}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Custom board */}
            <div className="onboarding-custom-board" style={{ marginTop: 12 }}>
              {!showCustomBoard ? (
                <button type="button" className="onboarding-custom-board-trigger" onClick={() => setShowCustomBoard(true)}>
                  My exam board isn't listed yet
                </button>
              ) : (
                <div className="onboarding-custom-board-form">
                  <p className="profile-field-label">Which exam board do you teach?</p>
                  <input
                    className="profile-input"
                    value={customBoardName}
                    onChange={e => setCustomBoardName(e.target.value)}
                    placeholder="e.g. CCEA, Cambridge, IGCSE…"
                  />
                  <p className="profile-field-label" style={{ marginTop: 10 }}>Which subjects?</p>
                  <div className="onboarding-custom-subjects">
                    {CUSTOM_SUBJECTS.map(s => (
                      <label key={s.id} className="onboarding-custom-subject">
                        <input type="checkbox" checked={customSubjects.has(s.id)} onChange={() => toggleCustomSubject(s.id)} />
                        {s.label}
                      </label>
                    ))}
                  </div>
                  <div className="onboarding-custom-board-actions">
                    <button type="button" className="profile-btn profile-btn--cancel" onClick={() => setShowCustomBoard(false)}>Cancel</button>
                    <button
                      type="button"
                      className="profile-btn profile-btn--save"
                      disabled={!customBoardName.trim() || customSubjects.size === 0}
                      onClick={addCustomBoard}
                    >
                      Add courses
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="profile-error">{error}</p>}

            <div className="profile-actions">
              <button type="button" className="profile-btn profile-btn--cancel" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button type="submit" className="profile-btn profile-btn--save" disabled={saving}>
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
              </button>
            </div>
          </form>

          {/* Connected sign-in methods */}
        <div className="profile-linked-section">
          <p className="profile-linked-title">Connected sign-in methods</p>
          <div className="profile-linked-list">
            {(['google', 'azure'] as const).map(provider => {
              const label = provider === 'azure' ? 'Microsoft' : 'Google'
              const isLinked = linkedProviders.includes(provider)
              return (
                <div key={provider} className="profile-linked-row">
                  <span className="profile-linked-connected">
                    {label}
                    {isLinked && <span className="profile-linked-badge">Connected</span>}
                  </span>
                  {!isLinked && (
                    <button
                      type="button"
                      className="profile-linked-btn"
                      onClick={() => handleLinkProvider(provider)}
                      disabled={linkingProvider === provider}
                    >
                      {linkingProvider === provider ? 'Connecting…' : `Link ${label}`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {linkError && <p className="profile-linked-error">{linkError}</p>}
          <p className="profile-field-hint" style={{ marginTop: 8 }}>
            Link your Google or Microsoft account so you can sign in either way without losing your worksheets.
          </p>
        </div>
        </div>{/* end profile-card */}
      </main>
    </div>
  )
}
