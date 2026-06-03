import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ProfileProvider, useProfileContext } from './context/ProfileContext'
import { Onboarding } from './pages/Onboarding'
import { Home } from './pages/Home'
import { EditorPage } from './pages/EditorPage'
import { GalleryPage } from './pages/GalleryPage'
import { ProfilePage } from './pages/ProfilePage'
import { InsightsPage } from './pages/InsightsPage'
import { BookletPage } from './pages/BookletPage'
import { OakExplorerPage } from './pages/OakExplorerPage'
import { PublicLibraryPage } from './pages/PublicLibraryPage'
import { AdminPage } from './pages/AdminPage'
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
          <Route path="/profile" element={<AuthGate><ProfilePage /></AuthGate>} />
          <Route path="/insights" element={<AuthGate><InsightsPage /></AuthGate>} />
          <Route path="/booklet" element={<AuthGate><BookletPage /></AuthGate>} />
          <Route path="/oak" element={<AuthGate><OakExplorerPage /></AuthGate>} />
          <Route path="/library" element={<AuthGate><PublicLibraryPage /></AuthGate>} />
          <Route path="/admin" element={<AuthGate><AdminPage /></AuthGate>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ProfileProvider>
  )
}
