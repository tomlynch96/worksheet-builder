import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileContext } from '../context/ProfileContext'
import { Home } from './Home'
import { LandingPage } from './LandingPage'

export function RootPage() {
  const { profile, loading, authUserId } = useProfileContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return

    if (profile) {
      // Existing user returning from auth redirect — consume stored return URL
      const stored = localStorage.getItem('auth_return')
      if (stored) {
        localStorage.removeItem('auth_return')
        navigate(stored, { replace: true })
      }
    } else if (authUserId) {
      // Authed but no profile yet (new user after magic link / OAuth redirect)
      // Skip the landing page and go straight to the profile setup form
      navigate('/onboarding', { replace: true })
    }
  }, [profile, authUserId, loading, navigate])

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
      </div>
    )
  }

  if (profile) return <Home />
  return <LandingPage />
}
