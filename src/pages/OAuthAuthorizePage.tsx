import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProfileContext } from '../context/ProfileContext'
import { supabase } from '../lib/supabase'
import './OAuthAuthorizePage.css'

// The consent page for the Claude connector's OAuth sign-in (api/_lib/oauth.ts). An app such
// as claude.ai sends the teacher here; they log in if needed, then Allow or Cancel, and are
// sent back to the app.

interface ClientInfo { client_name: string; redirect_host: string }

export function OAuthAuthorizePage() {
  const { profile, loading } = useProfileContext()
  const location = useLocation()
  const navigate = useNavigate()
  const params = useMemo(() => Object.fromEntries(new URLSearchParams(location.search)), [location.search])

  const [info, setInfo] = useState<ClientInfo | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'allow' | 'deny' | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/oauth/authorize-info${location.search}`)
      .then(async r => {
        const data = await r.json().catch(() => ({}))
        if (cancelled) return
        if (r.ok) setInfo(data as ClientInfo)
        else setError((data as { error_description?: string }).error_description || 'This sign-in request is not valid.')
      })
      .catch(() => { if (!cancelled) setError('Could not check this sign-in request. Please try again.') })
    return () => { cancelled = true }
  }, [location.search])

  async function decide(allow: boolean) {
    setBusy(allow ? 'allow' : 'deny')
    setError('')
    try {
      const { data } = await supabase.auth.getSession()
      const r = await fetch('/api/oauth/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
        },
        body: JSON.stringify({ params, allow }),
      })
      const out = await r.json().catch(() => ({})) as { redirect?: string; error_description?: string }
      if (out.redirect) { window.location.assign(out.redirect); return }
      setError(out.error_description || 'Something went wrong. Please try again.')
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setBusy(null)
  }

  const returnTo = `${location.pathname}${location.search}`
  const appName = info?.client_name || 'Claude'

  let content: React.ReactNode
  if (error && !info) {
    content = (
      <>
        <h1 className="oa-title">Can’t connect</h1>
        <p className="oa-text">{error}</p>
        <p className="oa-text oa-muted">Go back to Claude and try connecting again.</p>
      </>
    )
  } else if (!info || loading) {
    content = <div className="oa-spinner" aria-label="Loading" />
  } else if (!profile) {
    content = (
      <>
        <h1 className="oa-title">Connect {appName} to The Worksheet Project</h1>
        <p className="oa-text">Log in to your Worksheet Project account to continue. You’ll come straight back here.</p>
        <button type="button" className="oa-btn oa-btn--primary" onClick={() => navigate(`/onboarding?return=${encodeURIComponent(returnTo)}`)}>
          Log in
        </button>
      </>
    )
  } else {
    content = (
      <>
        <h1 className="oa-title">Allow {appName} to use your library?</h1>
        <p className="oa-text">Signed in as <strong>{profile.name}</strong>.</p>
        <p className="oa-text">{appName} will be able to:</p>
        <ul className="oa-list">
          <li>see your courses, schemes of work and worksheets, and search the public library</li>
          <li>save new worksheets to your library as <strong>private drafts</strong>, flagged for you to review</li>
          <li>add topics and worksheets to your schemes of work</li>
        </ul>
        <p className="oa-text oa-muted">It can’t publish or share anything, or change sheets you’ve already reviewed. You can disconnect it at any time on your Profile page.</p>
        {!profile.is_admin && <p className="oa-error">The Claude connector is only available to admin accounts at the moment.</p>}
        {error && <p className="oa-error">{error}</p>}
        <div className="oa-actions">
          <button type="button" className="oa-btn" onClick={() => decide(false)} disabled={!!busy}>
            {busy === 'deny' ? 'Cancelling…' : 'Cancel'}
          </button>
          <button type="button" className="oa-btn oa-btn--primary" onClick={() => decide(true)} disabled={!!busy || !profile.is_admin}>
            {busy === 'allow' ? 'Connecting…' : 'Allow'}
          </button>
        </div>
        <p className="oa-foot">You’ll be returned to {info.redirect_host}.</p>
      </>
    )
  }

  return (
    <div className="oa-layout">
      <main className="oa-card">
        <p className="oa-brand">The Worksheet Project</p>
        {content}
      </main>
    </div>
  )
}
