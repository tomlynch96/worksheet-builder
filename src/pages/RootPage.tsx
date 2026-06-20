import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileContext } from '../context/ProfileContext'
import { Home } from './Home'
import { LandingPage } from './LandingPage'

export function RootPage() {
  const { profile, loading } = useProfileContext()
  const navigate = useNavigate()

  // After an auth redirect (magic link / OAuth), the app lands at root.
  // If a return URL was saved before auth, consume it now.
  useEffect(() => {
    if (!profile) return
    const stored = localStorage.getItem('auth_return')
    if (stored) {
      localStorage.removeItem('auth_return')
      navigate(stored, { replace: true })
    }
  }, [profile, navigate])

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
