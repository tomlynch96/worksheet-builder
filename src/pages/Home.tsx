import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/layout/Topbar'
import { NewSheetWizard } from '../components/NewSheetWizard'
import { WelcomeModal } from '../components/WelcomeModal'
import { useProfileContext } from '../context/ProfileContext'
import { useSupabaseWorksheets, type WorksheetEntry } from '../hooks/useSupabaseWorksheets'
import { useMCQuiz } from '../hooks/useMCQuiz'
import { useWelcomeConfig } from '../hooks/useAppConfig'
import { offeringLabel } from '../data/qualifications'
import { TUTORIAL_WORKSHEET } from '../data/tutorialWorksheet'
import type { Worksheet } from '../types/worksheet'
import './Home.css'

const BOARD_COLORS: Record<string, string> = {
  AQA: '#1e3a5f', OCR: '#1d4ed8', Edexcel: '#7c2d12', WJEC: '#166534',
}

function RecentCard({
  entry,
  quizId,
  onClick,
}: {
  entry: WorksheetEntry
  quizId?: string
  onClick: (w: Worksheet) => void
}) {
  const navigate = useNavigate()
  const color = BOARD_COLORS[entry.exam_board] ?? '#374151'
  const tierLabel = entry.tier === 'higher' ? 'Higher' : entry.tier === 'foundation' ? 'Foundation' : ''
  const qualLabel = offeringLabel(entry.qualification_id, entry.exam_board)

  return (
    <div className="recent-card-wrap">
      <button className="recent-card" onClick={() => onClick(entry.worksheet)}>
        <div className="recent-card-strip" style={{ background: color }} />
        <div className="recent-card-body">
          <div className="recent-card-meta">
            <span className="recent-card-board" style={{ background: color }}>{entry.exam_board}</span>
            {tierLabel && <span className="recent-card-tier">{tierLabel}</span>}
          </div>
          <div className="recent-card-title">{entry.title || 'Untitled'}</div>
          {entry.topic && <div className="recent-card-topic">{entry.topic}</div>}
          {qualLabel && <div className="recent-card-qual">{qualLabel}</div>}
          <div className="recent-card-foot">
            {entry.question_count} question{entry.question_count !== 1 ? 's' : ''}
            {' · '}
            {new Date(entry.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
        </div>
      </button>
      {quizId && (
        <button
          className="recent-card-quiz-link"
          onClick={e => { e.stopPropagation(); navigate(`/quiz/${quizId}`) }}
        >
          ✦ 1 follow-up quiz
        </button>
      )}
    </div>
  )
}

export function Home() {
  const { profile, acceptWelcome } = useProfileContext()
  const navigate = useNavigate()
  const { entries, loading } = useSupabaseWorksheets(profile?.id ?? null)
  const { getByWorksheetId } = useMCQuiz(profile?.id ?? null)
  const { config: welcomeConfig, loading: welcomeLoading } = useWelcomeConfig()
  const [showWizard, setShowWizard] = useState(false)

  const showWelcome = profile && !profile.welcome_seen && !welcomeLoading

  function handleWizardGenerated(worksheet: Worksheet, worksheetType: string) {
    setShowWizard(false)
    navigate('/editor', { state: { worksheet, aiGenerated: worksheetType !== 'blank', worksheetType } })
  }

  function handleOpenSheet(worksheet: Worksheet) {
    navigate('/editor', { state: { worksheet } })
  }

  const recent = entries.slice(0, 8)

  return (
    <div className="home-layout">
      <Topbar actions={
        <button className="btn-topbar" onClick={() => setShowWizard(true)}>
          + New Worksheet
        </button>
      } />

      <main className="home-main">
        {/* Hero */}
        <section className="home-hero">
          <div className="home-hero-text">
            <h1 className="home-hero-title">
              Hello{profile?.name && profile.name !== 'Teacher' ? `, ${profile.name}` : ''}
            </h1>
            <p className="home-hero-sub">What are you making today?</p>
          </div>
          <button className="home-hero-cta" onClick={() => setShowWizard(true)}>
            + New Worksheet
          </button>
        </section>

        {/* Recent sheets */}
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Recent worksheets</h2>
            {entries.length > 8 && (
              <a className="home-section-link" href="/gallery">View all →</a>
            )}
          </div>

          {loading ? (
            <div className="home-loading">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="home-empty">
              <div className="home-empty-icon">📄</div>
              <p>No worksheets yet — create your first one above.</p>
            </div>
          ) : (
            <div className="home-recent-grid">
              {recent.map(entry => (
                <RecentCard
                  key={entry.id}
                  entry={entry}
                  quizId={getByWorksheetId(entry.id)?.id}
                  onClick={handleOpenSheet}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {showWizard && (
        <NewSheetWizard
          onGenerated={handleWizardGenerated}
          onCancel={() => setShowWizard(false)}
        />
      )}

      {showWelcome && (
        <WelcomeModal
          config={welcomeConfig}
          onAccept={async () => {
            await acceptWelcome()
            navigate('/editor', {
              state: {
                worksheet: { ...TUTORIAL_WORKSHEET, id: crypto.randomUUID() },
                tutorialMode: true,
              },
            })
          }}
        />
      )}
    </div>
  )
}
