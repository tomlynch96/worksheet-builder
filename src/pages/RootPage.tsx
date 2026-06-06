import { useProfileContext } from '../context/ProfileContext'
import { Home } from './Home'
import { LandingPage } from './LandingPage'

export function RootPage() {
  const { profile, loading } = useProfileContext()

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
