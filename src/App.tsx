import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ProfileProvider, useProfileContext } from './context/ProfileContext'
import { Onboarding } from './pages/Onboarding'
import { Home } from './pages/Home'
import { EditorPage } from './pages/EditorPage'
import { GalleryPage } from './pages/GalleryPage'
import './App.css'

function AuthGate({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useProfileContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !profile) navigate('/onboarding', { replace: true })
  }, [loading, profile, navigate])

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
      </div>
    )
  }

  if (!profile) return null
  return <>{children}</>
}

export default function App() {
  return (
    <ProfileProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<AuthGate><Home /></AuthGate>} />
          <Route path="/editor" element={<AuthGate><EditorPage /></AuthGate>} />
          <Route path="/gallery" element={<AuthGate><GalleryPage /></AuthGate>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ProfileProvider>
  )
}
