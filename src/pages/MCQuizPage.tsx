import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import QRCode from 'react-qr-code'
import { Topbar } from '../components/layout/Topbar'
import { useProfileContext } from '../context/ProfileContext'
import { useMCQuiz } from '../hooks/useMCQuiz'
import { computeVersions } from '../utils/mcQuizVersions'
import type { MCQuiz, MCQuestion, MCQuizVersion, QuizScan } from '../types/mcQuiz'
import './MCQuizPage.css'

const LETTERS = ['A', 'B', 'C', 'D']

const printPageStyle = `
  @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
  html, body { margin: 0; padding: 0; background: white; }
  .mcq-page-break { page-break-before: always; break-before: page; }
  .mcq-no-print { display: none !important; }
`

// ── Bubble sheet ─────────────────────────────────────────────────────────────

function BubbleSheet({
  version,
  quizTitle,
  quizId,
}: {
  version: MCQuizVersion
  quizTitle: string
  quizId: string
}) {
  const qCount = version.questionOrder.length
  const markUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/mark/${quizId}/${version.versionNumber}`

  return (
    <div className="mcq-bubble-sheet">
      <div className="mcq-bubble-header">
        <div className="mcq-bubble-info">
          <div className="mcq-bubble-title">{quizTitle}</div>
          <div className="mcq-bubble-version">Version: <strong>{version.code}</strong></div>
        </div>
        <div className="mcq-bubble-student">
          <div className="mcq-bubble-field"><span>Class:</span><div className="mcq-bubble-line" /></div>
          <div className="mcq-bubble-field"><span>Date:</span><div className="mcq-bubble-line" /></div>
        </div>
        <div className="mcq-bubble-qr">
          <QRCode value={markUrl} size={64} />
          <div className="mcq-bubble-qr-label">Scan to mark</div>
        </div>
      </div>

      <div className="mcq-bubble-instructions">
        Fill in ONE bubble per question. Use a pen or dark pencil. Cross out and refill if you change your answer.
      </div>

      <div className="mcq-bubble-grid">
        <div className="mcq-bubble-col-header">
          <span />
          {LETTERS.map(l => <span key={l} className="mcq-bubble-letter">{l}</span>)}
        </div>
        {Array.from({ length: qCount }, (_, i) => (
          <div key={i} className="mcq-bubble-row">
            <span className="mcq-bubble-qnum">{i + 1}</span>
            {LETTERS.map(l => (
              <span key={l} className="mcq-bubble-circle" />
            ))}
          </div>
        ))}
      </div>

      <div className="mcq-bubble-footer">
        Score: _____ / {qCount} &nbsp;&nbsp; Version code: {version.code}
      </div>
    </div>
  )
}

// ── Version print ─────────────────────────────────────────────────────────────

function VersionPrint({
  version,
  questions,
  quizTitle,
  quizId,
}: {
  version: MCQuizVersion
  questions: MCQuestion[]
  quizTitle: string
  quizId: string
}) {
  return (
    <>
      <div className="mcq-version-header">
        <div className="mcq-version-title">{quizTitle}</div>
        <div className="mcq-version-code">Version {version.code}</div>
      </div>
      <div className="mcq-version-instructions">
        Circle or bubble in the letter of the best answer for each question.
      </div>

      <div className="mcq-questions">
        {version.questionOrder.map((qi, displayIdx) => {
          const q = questions[qi]
          const optOrder = version.optionOrders[qi]
          return (
            <div key={q.id} className="mcq-q">
              <div className="mcq-q-stem">
                <span className="mcq-q-num">{displayIdx + 1}.</span>
                <span className="mcq-q-text">{q.text}</span>
              </div>
              <div className="mcq-q-options">
                {optOrder.map((origIdx, letterIdx) => (
                  <div key={origIdx} className="mcq-q-option">
                    <span className="mcq-q-letter">{LETTERS[letterIdx]}</span>
                    <span>{q.options[origIdx]}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mcq-page-break">
        <BubbleSheet version={version} quizTitle={quizTitle} quizId={quizId} />
      </div>
    </>
  )
}

// ── Mark scheme ───────────────────────────────────────────────────────────────

function MarkScheme({ versions, questions, quizTitle }: {
  versions: MCQuizVersion[]
  questions: MCQuestion[]
  quizTitle: string
}) {
  return (
    <div className="mcq-markscheme">
      <div className="mcq-ms-header">
        <div className="mcq-ms-title">TEACHER MARK SCHEME — Do not distribute</div>
        <div className="mcq-ms-subtitle">{quizTitle}</div>
      </div>
      <div className="mcq-ms-versions">
        {versions.map(v => (
          <div key={v.code} className="mcq-ms-version">
            <div className="mcq-ms-version-code">Version {v.code}</div>
            <div className="mcq-ms-key">
              {v.questionOrder.map((qi, displayIdx) => (
                <div key={qi} className="mcq-ms-row">
                  <span className="mcq-ms-qnum">Q{displayIdx + 1}</span>
                  <span className="mcq-ms-answer">{v.answerKey[displayIdx]}</span>
                  <span className="mcq-ms-correct">{questions[qi].options[0]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Results / analytics tab ───────────────────────────────────────────────────

function ResultsTab({ quiz, scans }: { quiz: MCQuiz; scans: QuizScan[] }) {
  if (scans.length === 0) {
    return (
      <div className="mcq-results-empty">
        <p>No scans yet.</p>
        <p className="mcq-results-hint">Print the quiz, hand it out, then use the QR code on each bubble sheet to scan and mark completed sheets. Results will appear here.</p>
      </div>
    )
  }

  const totalScans = scans.length
  const avgScore = scans.reduce((s, sc) => s + sc.score, 0) / totalScans
  const avgPct = Math.round((avgScore / quiz.question_count) * 100)

  // Per-question stats (by canonical question ID)
  const questionStats = quiz.questions.map(q => {
    const results = scans
      .map(sc => sc.question_results[q.id])
      .filter(r => r !== undefined)
    const correct = results.filter(Boolean).length
    const total = results.length
    const pct = total > 0 ? Math.round((correct / total) * 100) : null
    return { q, correct, total, pct }
  }).filter(s => s.total > 0)
    .sort((a, b) => (a.pct ?? 100) - (b.pct ?? 100))

  return (
    <div className="mcq-results">
      {/* Summary */}
      <div className="mcq-results-summary">
        <div className="mcq-results-stat">
          <span className="mcq-results-stat-val">{totalScans}</span>
          <span className="mcq-results-stat-label">sheets scanned</span>
        </div>
        <div className="mcq-results-stat">
          <span className="mcq-results-stat-val">{avgScore.toFixed(1)}</span>
          <span className="mcq-results-stat-label">avg score / {quiz.question_count}</span>
        </div>
        <div className="mcq-results-stat">
          <span className="mcq-results-stat-val">{avgPct}%</span>
          <span className="mcq-results-stat-label">class average</span>
        </div>
      </div>

      {/* Per-question breakdown */}
      <h3 className="mcq-results-section-title">Question performance (worst first)</h3>
      <div className="mcq-results-questions">
        {questionStats.map(({ q, correct, total, pct }) => {
          const tier = (pct ?? 100) >= 70 ? 'good' : (pct ?? 100) >= 40 ? 'ok' : 'low'
          return (
            <div key={q.id} className="mcq-results-q">
              <div className="mcq-results-q-text">{q.text}</div>
              <div className="mcq-results-q-bar-row">
                <div className="mcq-results-q-track">
                  <div
                    className={`mcq-results-q-fill mcq-results-q-fill--${tier}`}
                    style={{ width: `${pct ?? 0}%` }}
                  />
                </div>
                <span className={`mcq-results-q-pct mcq-results-q-pct--${tier}`}>
                  {pct}% ({correct}/{total})
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent scans */}
      <h3 className="mcq-results-section-title">Recent scans</h3>
      <div className="mcq-results-scans">
        {scans.map(sc => (
          <div key={sc.id} className="mcq-results-scan-row">
            <span className="mcq-results-scan-version">V{sc.version_number}</span>
            <span className="mcq-results-scan-score">{sc.score}/{sc.question_count}</span>
            <span className="mcq-results-scan-pct">
              {Math.round((sc.score / sc.question_count) * 100)}%
            </span>
            <span className="mcq-results-scan-date">
              {new Date(sc.scanned_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function MCQuizPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useProfileContext()
  const { fetchById, remove, fetchScans } = useMCQuiz(profile?.id ?? null)

  const [quiz, setQuiz] = useState<MCQuiz | null>(null)
  const [scans, setScans] = useState<QuizScan[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [view, setView] = useState<'quiz' | 'results'>('quiz')
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([fetchById(id), fetchScans(id)]).then(([q, s]) => {
      setQuiz(q)
      setScans(s)
      setLoading(false)
    })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: quiz?.title || 'quiz',
    pageStyle: printPageStyle,
  })

  async function handleDelete() {
    if (!quiz) return
    if (!confirm('Delete this quiz? This cannot be undone.')) return
    setDeleting(true)
    await remove(quiz.id)
    navigate(-1)
  }

  if (loading) return (
    <div className="mcq-page-layout"><Topbar /><div className="mcq-page-loading">Loading quiz…</div></div>
  )
  if (!quiz) return (
    <div className="mcq-page-layout"><Topbar /><div className="mcq-page-loading">Quiz not found.</div></div>
  )

  const versions = computeVersions(quiz.questions, quiz.version_count, quiz.id)

  const topbarActions = (
    <>
      <button className="btn-topbar" onClick={() => navigate(-1)}>← Back</button>
      <div className="mcq-view-toggle mcq-no-print">
        <button
          className={`mcq-view-btn${view === 'quiz' ? ' mcq-view-btn--active' : ''}`}
          onClick={() => setView('quiz')}
        >Quiz</button>
        <button
          className={`mcq-view-btn${view === 'results' ? ' mcq-view-btn--active' : ''}`}
          onClick={() => setView('results')}
        >Results {scans.length > 0 && `(${scans.length})`}</button>
      </div>
      <button className="btn-topbar btn-topbar--danger" onClick={handleDelete} disabled={deleting}>
        {deleting ? 'Deleting…' : 'Delete Quiz'}
      </button>
      {view === 'quiz' && (
        <button className="btn-download" onClick={() => handlePrint()}>Print / Save PDF</button>
      )}
    </>
  )

  return (
    <div className="mcq-page-layout">
      <Topbar actions={topbarActions} />
      <main className="mcq-page-main">
        {view === 'results' ? (
          <div className="mcq-page-results-wrap">
            <h1 className="mcq-page-title">{quiz.title}</h1>
            <ResultsTab quiz={quiz} scans={scans} />
          </div>
        ) : (
          <>
            <div className="mcq-page-info mcq-no-print">
              <h1 className="mcq-page-title">{quiz.title}</h1>
              <p className="mcq-page-meta">
                {quiz.question_count} questions · {quiz.version_count} versions · QR codes on every bubble sheet
              </p>
            </div>
            <div ref={printRef} className="mcq-print-body">
              {versions.map((version, vi) => (
                <div key={version.code} className={vi > 0 ? 'mcq-page-break' : ''}>
                  <VersionPrint
                    version={version}
                    questions={quiz.questions}
                    quizTitle={quiz.title}
                    quizId={quiz.id}
                  />
                </div>
              ))}
              <div className="mcq-page-break">
                <MarkScheme versions={versions} questions={quiz.questions} quizTitle={quiz.title} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
