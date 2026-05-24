import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileContext } from '../context/ProfileContext'
import { QUALIFICATION_OFFERINGS } from '../data/qualifications'
import { isConfigured, supabase } from '../lib/supabase'
import './Onboarding.css'

const EXAM_BOARDS = ['AQA', 'OCR', 'Edexcel', 'WJEC']
const boardQuals = QUALIFICATION_OFFERINGS.filter(q => q.examBoards.length > 1)
const singleQuals = QUALIFICATION_OFFERINGS.filter(q => q.examBoards.length === 1)

export function Onboarding() {
  const { authUserId, profile, loading, sendMagicLink, createProfile } = useProfileContext()
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
          <div className="onboarding-logo">WB</div>
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
            {singleQuals.length > 0 && (
              <div className="onboarding-single-section">
                <div className="onboarding-single-label">KS3</div>
                {singleQuals.map(qual => {
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
        <div className="onboarding-logo">WB</div>
        <h1 className="onboarding-title">Worksheet Builder</h1>
        <p className="onboarding-body">
          A free AI worksheet generation platform for secondary science teachers.
          Sign in with a magic link — no password needed.
        </p>

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
