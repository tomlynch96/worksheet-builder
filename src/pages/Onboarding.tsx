import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileContext } from '../context/ProfileContext'
import { QUALIFICATION_OFFERINGS } from '../data/qualifications'
import { isConfigured, supabase } from '../lib/supabase'
import './Onboarding.css'

const EXAM_BOARDS = ['AQA', 'OCR', 'Edexcel', 'WJEC']
const boardQuals = QUALIFICATION_OFFERINGS.filter(q => q.examBoards.length > 1)
const ks3Quals = QUALIFICATION_OFFERINGS.filter(q => q.examBoards[0] === 'Pearson')
const ibQuals  = QUALIFICATION_OFFERINGS.filter(q => q.examBoards[0] === 'IB')

export function Onboarding() {
  const { authUserId, profile, loading, sendMagicLink, signInWithProvider, createProfile } = useProfileContext()
  const navigate = useNavigate()

  // If the user already has a profile, skip the setup form and go home
  useEffect(() => {
    if (profile) navigate('/', { replace: true })
  }, [profile, navigate])

  // Magic-link form
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [emailError, setEmailError] = useState('')

  // Password sign-in
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setSigningIn(true)
    setEmailError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setSigningIn(false)
    if (error) setEmailError(error.message)
  }

  // Profile setup form
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Custom board
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

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setEmailError('Please enter your email address.'); return }
    setSending(true)
    setEmailError('')
    const { error } = await sendMagicLink(email.trim())
    setSending(false)
    if (error) {
      setEmailError(error)
    } else {
      setSent(true)
    }
  }

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (selected.size === 0) { setProfileError('Please select at least one course.'); return }
    setSaving(true)
    setProfileError('')

    const courses = Array.from(selected).map(key => {
      const [qualification_id, exam_board] = key.split(':')
      return { qualification_id, exam_board }
    })

    const ok = await createProfile(name.trim() || 'Teacher', courses)
    if (ok) {
      navigate('/', { replace: true })
    } else {
      setProfileError('Could not save profile — please try again.')
      setSaving(false)
    }
  }

  if (!isConfigured) {
    return (
      <div className="onboarding-layout">
        <div className="onboarding-card onboarding-card--error">
          <h1 className="onboarding-title">Supabase not configured</h1>
          <p className="onboarding-body">
            Copy <code>.env.example</code> to <code>.env.local</code> and add your Supabase project URL and anon key, then restart the dev server.
          </p>
          <pre className="onboarding-code">{`VITE_SUPABASE_URL=https://xxx.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJ...`}</pre>
        </div>
      </div>
    )
  }

  // Signed in — wait for profile fetch before deciding what to show
  if (authUserId && loading) {
    return (
      <div className="onboarding-layout">
        <div className="onboarding-card" style={{ alignItems: 'center' }}>
          <div className="app-loading-spinner" />
        </div>
      </div>
    )
  }

  // Signed in but no profile yet — show course selection
  if (authUserId && !profile) {
    return (
      <div className="onboarding-layout">
        <form className="onboarding-card" onSubmit={handleCreateProfile}>
          <div className="onboarding-logo-clip">
            <img src="/logo.svg" className="onboarding-logo-img" alt="The Worksheet Project" />
          </div>
          <h1 className="onboarding-title">One more step</h1>
          <p className="onboarding-body">
            Tell us which courses you teach so we can organise your worksheets and pre-fill new ones.
          </p>

          <div className="onboarding-name-row">
            <label className="onboarding-label">Your name (optional)</label>
            <input
              className="onboarding-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Mr Smith"
            />
          </div>

          <div className="onboarding-courses">
            <div className="onboarding-label">Which courses do you teach?</div>
            <div className="onboarding-board-key">
              <span />
              {EXAM_BOARDS.map(b => (
                <span key={b} className="onboarding-board-label">{b}</span>
              ))}
            </div>
            {boardQuals.map(qual => (
              <div key={qual.id} className="onboarding-qual-row">
                <span className="onboarding-qual-name">{qual.label}</span>
                <div className="onboarding-boards">
                  {EXAM_BOARDS.map(board => {
                    const key = `${qual.id}:${board}`
                    const checked = selected.has(key)
                    return (
                      <button
                        key={board}
                        type="button"
                        className={`onboarding-board-btn${checked ? ' onboarding-board-btn--on' : ''}`}
                        onClick={() => toggle(qual.id, board)}
                        aria-pressed={checked}
                      >
                        {checked ? '✓' : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {ks3Quals.length > 0 && (
              <div className="onboarding-single-section">
                <div className="onboarding-single-label">KS3 — Pearson Exploring Science</div>
                {ks3Quals.map(qual => {
                  const board = qual.examBoards[0]
                  const key = `${qual.id}:${board}`
                  const checked = selected.has(key)
                  return (
                    <div key={qual.id} className="onboarding-single-row">
                      <span className="onboarding-qual-name">{qual.label}</span>
                      <button
                        type="button"
                        className={`onboarding-board-btn${checked ? ' onboarding-board-btn--on' : ''}`}
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
            {ibQuals.length > 0 && (
              <div className="onboarding-single-section">
                <div className="onboarding-single-label">IB Diploma</div>
                {ibQuals.map(qual => {
                  const board = qual.examBoards[0]
                  const key = `${qual.id}:${board}`
                  const checked = selected.has(key)
                  return (
                    <div key={qual.id} className="onboarding-single-row">
                      <span className="onboarding-qual-name">{qual.label}</span>
                      <button
                        type="button"
                        className={`onboarding-board-btn${checked ? ' onboarding-board-btn--on' : ''}`}
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
          <div className="onboarding-custom-board">
            {!showCustomBoard ? (
              <button type="button" className="onboarding-custom-board-trigger" onClick={() => setShowCustomBoard(true)}>
                My exam board isn't listed yet
              </button>
            ) : (
              <div className="onboarding-custom-board-form">
                <p className="onboarding-label">Which exam board do you teach?</p>
                <input
                  className="onboarding-input"
                  value={customBoardName}
                  onChange={e => setCustomBoardName(e.target.value)}
                  placeholder="e.g. CCEA, Cambridge, IGCSE…"
                />
                <p className="onboarding-label" style={{ marginTop: 10 }}>Which subjects?</p>
                <div className="onboarding-custom-subjects">
                  {CUSTOM_SUBJECTS.map(s => (
                    <label key={s.id} className="onboarding-custom-subject">
                      <input
                        type="checkbox"
                        checked={customSubjects.has(s.id)}
                        onChange={() => toggleCustomSubject(s.id)}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
                <div className="onboarding-custom-board-actions">
                  <button type="button" className="onboarding-retry" onClick={() => setShowCustomBoard(false)}>Cancel</button>
                  <button
                    type="button"
                    className="onboarding-board-btn onboarding-board-btn--on"
                    disabled={!customBoardName.trim() || customSubjects.size === 0}
                    onClick={addCustomBoard}
                  >
                    Add courses
                  </button>
                </div>
              </div>
            )}
          </div>

          {profileError && <p className="onboarding-error">{profileError}</p>}

          <div className="onboarding-hint">
            {selected.size === 0
              ? 'Select at least one course to continue.'
              : `${selected.size} course${selected.size !== 1 ? 's' : ''} selected`}
          </div>

          <button className="onboarding-submit" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Get started →'}
          </button>
        </form>
      </div>
    )
  }

  // Not signed in — show magic link form
  return (
    <div className="onboarding-layout">
      <div className="onboarding-card">
        <div className="onboarding-logo-clip">
          <img src="/logo.svg" className="onboarding-logo-img" alt="The Worksheet Project" />
        </div>
        <h1 className="onboarding-title">The Worksheet Project</h1>
        <p className="onboarding-body">
          A free preview trial for secondary science teachers.
        </p>

        {!sent && (
          <div className="onboarding-sso-group">
            <div className="onboarding-sso-recommended-wrap">
              <span className="onboarding-sso-badge">Recommended</span>
              <button type="button" className="onboarding-sso-btn" onClick={() => signInWithProvider('google')}>
                <svg className="onboarding-sso-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
            <button type="button" className="onboarding-sso-btn onboarding-sso-btn--disabled" disabled>
              <svg className="onboarding-sso-icon" viewBox="0 0 23 23" aria-hidden="true">
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
              Continue with Microsoft
              <span className="onboarding-sso-coming-soon">Coming soon</span>
            </button>
            <div className="onboarding-divider"><span>or sign in with email</span></div>
          </div>
        )}

        {sent ? (
          <div className="onboarding-sent">
            <div className="onboarding-sent-icon">✉</div>
            <p className="onboarding-sent-heading">Check your inbox</p>
            <p className="onboarding-sent-body">
              We sent a sign-in link to <strong>{email}</strong>.
              Click it to continue — you can close this tab.
            </p>
            <button
              className="onboarding-retry"
              type="button"
              onClick={() => { setSent(false); setEmail('') }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={showPassword ? handlePasswordSignIn : handleSendLink} className="onboarding-magic-form">
            <label className="onboarding-label">Email address</label>
            <input
              className="onboarding-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@school.ac.uk"
              autoFocus
            />
            {showPassword && (
              <>
                <label className="onboarding-label">Password</label>
                <input
                  className="onboarding-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoFocus
                />
              </>
            )}
            {emailError && <p className="onboarding-error">{emailError}</p>}
            <button className="onboarding-submit" type="submit" disabled={sending || signingIn}>
              {showPassword
                ? (signingIn ? 'Signing in…' : 'Sign in →')
                : (sending ? 'Sending…' : 'Send magic link →')}
            </button>
            <button
              type="button"
              className="onboarding-retry"
              onClick={() => { setShowPassword(p => !p); setEmailError('') }}
            >
              {showPassword ? 'Use magic link instead' : 'Sign in with password instead'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
