import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { Topbar } from '../components/layout/Topbar'
import { useProfileContext } from '../context/ProfileContext'
import { useMCQuiz } from '../hooks/useMCQuiz'
import { computeVersions } from '../utils/mcQuizVersions'
import type { MCQuiz, MCQuestion, MCQuizVersion } from '../types/mcQuiz'
import './MCQuizPage.css'

const LETTERS = ['A', 'B', 'C', 'D']

const printPageStyle = `
  @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
  html, body { margin: 0; padding: 0; background: white; }
  .mcq-page-break { page-break-before: always; break-before: page; }
  .mcq-no-print { display: none !important; }
`

function BubbleSheet({
  version,
  quizTitle,
}: {
  version: MCQuizVersion
  questions?: MCQuestion[]
  quizTitle: string
}) {
  const qCount = version.questionOrder.length

  return (
    <div className="mcq-bubble-sheet">
      <div className="mcq-bubble-header">
        <div className="mcq-bubble-info">
          <div className="mcq-bubble-title">{quizTitle}</div>
          <div className="mcq-bubble-version">Version: <strong>{version.code}</strong></div>
        </div>
        <div className="mcq-bubble-student">
          <div className="mcq-bubble-field"><span>Name:</span><div className="mcq-bubble-line" /></div>
          <div className="mcq-bubble-field"><span>Class:</span><div className="mcq-bubble-line" /></div>
          <div className="mcq-bubble-field"><span>Date:</span><div className="mcq-bubble-line" /></div>
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

function VersionPrint({
  version,
  questions,
  quizTitle,
}: {
  version: MCQuizVersion
  questions: MCQuestion[]
  quizTitle: string
}) {
  return (
    <>
      {/* Questions section */}
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

      {/* Bubble sheet on new page */}
      <div className="mcq-page-break">
        <BubbleSheet version={version} questions={questions} quizTitle={quizTitle} />
      </div>
    </>
  )
}

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

export function MCQuizPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useProfileContext()
  const { fetchById, remove } = useMCQuiz(profile?.id ?? null)

  const [quiz, setQuiz] = useState<MCQuiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    fetchById(id).then(q => {
      setQuiz(q)
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

  if (loading) {
    return (
      <div className="mcq-page-layout">
        <Topbar />
        <div className="mcq-page-loading">Loading quiz…</div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="mcq-page-layout">
        <Topbar />
        <div className="mcq-page-loading">Quiz not found.</div>
      </div>
    )
  }

  const versions = computeVersions(quiz.questions, quiz.version_count, quiz.id)

  const topbarActions = (
    <>
      <button className="btn-topbar" onClick={() => navigate(-1)}>← Back</button>
      <button className="btn-topbar btn-topbar--danger" onClick={handleDelete} disabled={deleting}>
        {deleting ? 'Deleting…' : 'Delete Quiz'}
      </button>
      <button className="btn-download" onClick={() => handlePrint()}>Print / Save PDF</button>
    </>
  )

  return (
    <div className="mcq-page-layout">
      <Topbar actions={topbarActions} />
      <main className="mcq-page-main">
        <div className="mcq-page-info mcq-no-print">
          <h1 className="mcq-page-title">{quiz.title}</h1>
          <p className="mcq-page-meta">
            {quiz.question_count} questions · {quiz.version_count} versions
          </p>
        </div>

        <div ref={printRef} className="mcq-print-body">
          {versions.map((version, vi) => (
            <div key={version.code} className={vi > 0 ? 'mcq-page-break' : ''}>
              <VersionPrint
                version={version}
                questions={quiz.questions}
                quizTitle={quiz.title}
              />
            </div>
          ))}

          {/* Mark scheme at the end */}
          <div className="mcq-page-break">
            <MarkScheme versions={versions} questions={quiz.questions} quizTitle={quiz.title} />
          </div>
        </div>
      </main>
    </div>
  )
}
