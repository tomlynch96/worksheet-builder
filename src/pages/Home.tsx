import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/layout/Topbar'
import { NewSheetWizard } from '../components/NewSheetWizard'
import { useProfileContext } from '../context/ProfileContext'
import { useSupabaseWorksheets, type WorksheetEntry } from '../hooks/useSupabaseWorksheets'
import { offeringLabel } from '../data/qualifications'
import type { Worksheet } from '../types/worksheet'
import './Home.css'

const BOARD_COLORS: Record<string, string> = {
  AQA: '#1e3a5f', OCR: '#1d4ed8', Edexcel: '#7c2d12', WJEC: '#166534',
}

function RecentCard({
  entry,
  onClick,
}: {
  entry: WorksheetEntry
  onClick: (w: Worksheet) => void
}) {
  const color = BOARD_COLORS[entry.exam_board] ?? '#374151'
  const tierLabel = entry.tier === 'higher' ? 'Higher' : entry.tier === 'foundation' ? 'Foundation' : ''
  const qualLabel = offeringLabel(entry.qualification_id, entry.exam_board)

  return (
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
  )
}

export function Home() {
  const { profile } = useProfileContext()
  const navigate = useNavigate()
  const { entries, loading } = useSupabaseWorksheets(profile?.id ?? null)
  const [showWizard, setShowWizard] = useState(false)

  function handleWizardConfirm(result: {
    qualification_id: string
    exam_board: string
    spec_point: string
    topic_title: string
  }) {
    setShowWizard(false)
    const params = new URLSearchParams({
      qual: result.qualification_id,
      board: result.exam_board,
      spec: result.spec_point,
      topic: result.topic_title,
    })
    navigate(`/editor?${params.toString()}`)
  }

  function handleWizardGenerated(worksheet: Worksheet, worksheetType: string) {
    setShowWizard(false)
    navigate('/editor', { state: { worksheet, aiGenerated: true, worksheetType } })
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
                <RecentCard key={entry.id} entry={entry} onClick={handleOpenSheet} />
              ))}
            </div>
          )}
        </section>
      </main>

      {showWizard && (
        <NewSheetWizard
          onConfirm={handleWizardConfirm}
          onGenerated={handleWizardGenerated}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  )
}
