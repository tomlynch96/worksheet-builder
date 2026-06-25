import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ProfileProvider, useProfileContext } from './context/ProfileContext'
import { Onboarding } from './pages/Onboarding'
import { RootPage } from './pages/RootPage'
import { EditorPage } from './pages/EditorPage'
import { GalleryPage } from './pages/GalleryPage'
import { ProfilePage } from './pages/ProfilePage'
import { InsightsPage } from './pages/InsightsPage'
import { BookletPage } from './pages/BookletPage'
import { OakExplorerPage } from './pages/OakExplorerPage'
import { PublicLibraryPage } from './pages/PublicLibraryPage'
import { LibraryPreviewPage } from './pages/LibraryPreviewPage'
import { SharePreviewPage } from './pages/SharePreviewPage'
import { AdminPage } from './pages/AdminPage'
import { SchemesPage } from './pages/SchemesPage'
import { SchemeEditorPage } from './pages/SchemeEditorPage'
import { MCQuizPage } from './pages/MCQuizPage'
import { MarkingPage } from './pages/MarkingPage'
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
          <Route path="/" element={<RootPage />} />
          <Route path="/editor" element={<AuthGate><EditorPage /></AuthGate>} />
          <Route path="/gallery" element={<AuthGate><GalleryPage /></AuthGate>} />
          <Route path="/profile" element={<AuthGate><ProfilePage /></AuthGate>} />
          <Route path="/insights" element={<AuthGate><InsightsPage /></AuthGate>} />
          <Route path="/booklet" element={<AuthGate><BookletPage /></AuthGate>} />
          <Route path="/oak" element={<AuthGate><OakExplorerPage /></AuthGate>} />
          <Route path="/library" element={<AuthGate><PublicLibraryPage /></AuthGate>} />
          <Route path="/library/:id" element={<AuthGate><LibraryPreviewPage /></AuthGate>} />
          <Route path="/share/:id" element={<SharePreviewPage />} />
          <Route path="/admin" element={<AuthGate><AdminPage /></AuthGate>} />
          <Route path="/schemes" element={<AuthGate><SchemesPage /></AuthGate>} />
          <Route path="/schemes/:id" element={<AuthGate><SchemeEditorPage /></AuthGate>} />
          <Route path="/quiz/:id" element={<AuthGate><MCQuizPage /></AuthGate>} />
          <Route path="/mark/:quizId/:versionNumber" element={<MarkingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
    </ProfileProvider>
  )
}
