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
