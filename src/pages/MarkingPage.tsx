import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProfileContext } from '../context/ProfileContext'
import { useMCQuiz } from '../hooks/useMCQuiz'
import { computeVersions } from '../utils/mcQuizVersions'
import type { MCQuiz, MCQuizVersion, QuizScan } from '../types/mcQuiz'
import './MarkingPage.css'

// ── Image helpers ────────────────────────────────────────────────────────────

async function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const maxW = 1400
      const scale = Math.min(1, maxW / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' })
    }
    img.onerror = reject
    img.src = url
  })
}

// ── Scan result type ─────────────────────────────────────────────────────────

interface ScanResult {
  studentAnswers: string[]
  score: number
  total: number
  results: { question: number; studentAnswer: string; correctAnswer: string; correct: boolean }[]
}

// ── Main component ───────────────────────────────────────────────────────────

export function MarkingPage() {
  const { quizId, versionNumber: versionParam } = useParams<{ quizId: string; versionNumber: string }>()
  const versionNumber = parseInt(versionParam ?? '1', 10)
  const { profile } = useProfileContext()
  const { fetchById, saveScan } = useMCQuiz(profile?.id ?? null)

  const [quiz, setQuiz] = useState<MCQuiz | null>(null)
  const [version, setVersion] = useState<MCQuizVersion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const capturedFileRef = useRef<File | null>(null)

  useEffect(() => {
    if (!quizId) return
    fetchById(quizId).then(q => {
      if (!q) { setError('Quiz not found.'); setLoading(false); return }
      setQuiz(q)
      const versions = computeVersions(q.questions, q.version_count, q.id)
      const v = versions.find(v => v.versionNumber === versionNumber)
      if (!v) { setError(`Version ${versionNumber} not found.`); setLoading(false); return }
      setVersion(v)
      setLoading(false)
    })
  }, [quizId, versionNumber]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    capturedFileRef.current = file
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setScanResult(null)
    setSaved(false)
    e.target.value = ''
  }

  async function handleScan() {
    if (!capturedFileRef.current || !quiz || !version) return
    setScanning(true)
    setError(null)
    try {
      const { base64, mimeType } = await compressImage(capturedFileRef.current)
      const res = await fetch('/api/scan-bubble-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          imageMimeType: mimeType,
          questionCount: version.answerKey.length,
          answerKey: version.answerKey,
        }),
      })
      const data = await res.json() as ScanResult & { error?: string }
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setScanResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed — try a clearer photo')
    } finally {
      setScanning(false)
    }
  }

  async function handleSave() {
    if (!scanResult || !quiz || !version || !profile) return
    setSaving(true)
    // Build per-canonical-question results
    const questionResults: Record<string, boolean> = {}
    version.questionOrder.forEach((canonicalIdx, displayIdx) => {
      const q = quiz.questions[canonicalIdx]
      questionResults[q.id] = scanResult.results[displayIdx]?.correct ?? false
    })
    const scan: Omit<QuizScan, 'id' | 'scanned_at'> = {
      quiz_id: quiz.id,
      profile_id: profile.id,
      version_number: versionNumber,
      score: scanResult.score,
      question_count: scanResult.total,
      question_results: questionResults,
    }
    await saveScan(scan)
    setSaved(true)
    setSaving(false)
  }

  function reset() {
    setScanResult(null)
    setPreviewUrl(null)
    capturedFileRef.current = null
    setSaved(false)
    setError(null)
  }

  // ── Loading / error states ───────────────────────────────────────────────
  if (loading) return <div className="marking-shell"><div className="marking-loading">Loading quiz…</div></div>
  if (error && !quiz) return <div className="marking-shell"><div className="marking-error">{error}</div></div>

  const pct = scanResult ? Math.round((scanResult.score / scanResult.total) * 100) : 0

  return (
    <div className="marking-shell">
      <div className="marking-card">
        {/* Header */}
        <div className="marking-header">
          <div className="marking-badge">MC Quiz</div>
          <h1 className="marking-title">{quiz?.title ?? 'Follow-up Quiz'}</h1>
          {version && (
            <div className="marking-version">Version {version.code}</div>
          )}
        </div>

        {/* Result view */}
        {scanResult ? (
          <div className="marking-results">
            <div className={`marking-score marking-score--${pct >= 70 ? 'good' : pct >= 40 ? 'ok' : 'low'}`}>
              <span className="marking-score-num">{scanResult.score}</span>
              <span className="marking-score-sep">/</span>
              <span className="marking-score-total">{scanResult.total}</span>
              <span className="marking-score-pct">{pct}%</span>
            </div>

            <div className="marking-breakdown">
              {scanResult.results.map((r, i) => {
                const canonicalIdx = version!.questionOrder[i]
                const qText = quiz!.questions[canonicalIdx]?.text ?? ''
                return (
                  <div key={i} className={`marking-row marking-row--${r.correct ? 'correct' : 'wrong'}`}>
                    <span className="marking-row-icon">{r.correct ? '✓' : '✗'}</span>
                    <div className="marking-row-body">
                      <span className="marking-row-q">Q{i + 1}. {qText}</span>
                      {!r.correct && (
                        <span className="marking-row-info">
                          You answered <strong>{r.studentAnswer}</strong> · Correct: <strong>{r.correctAnswer}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {error && <p className="marking-error">{error}</p>}

            <div className="marking-actions">
              {profile && !saved && (
                <button className="marking-btn marking-btn--save" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : '↑ Save result'}
                </button>
              )}
              {saved && <span className="marking-saved">✓ Result saved</span>}
              {!profile && (
                <Link to="/onboarding" className="marking-btn marking-btn--login">
                  Log in to save results & see analytics
                </Link>
              )}
              <button className="marking-btn marking-btn--again" onClick={reset}>
                Scan another sheet
              </button>
            </div>
          </div>
        ) : (
          /* Capture view */
          <div className="marking-capture">
            {previewUrl ? (
              <>
                <img src={previewUrl} className="marking-preview" alt="Captured sheet" />
                {error && <p className="marking-error">{error}</p>}
                <div className="marking-actions">
                  <button className="marking-btn marking-btn--scan" onClick={handleScan} disabled={scanning}>
                    {scanning ? (
                      <><span className="marking-spinner" /> Reading bubbles…</>
                    ) : '✦ Mark this sheet'}
                  </button>
                  <button className="marking-btn marking-btn--retry" onClick={reset}>
                    Retake photo
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="marking-instructions">
                  <div className="marking-instr-icon">📷</div>
                  <p>Take a photo of the completed bubble answer sheet.</p>
                  <ul>
                    <li>Lay the sheet flat on a desk</li>
                    <li>Fill the frame with the sheet</li>
                    <li>Good lighting — avoid shadows</li>
                  </ul>
                </div>
                <button
                  className="marking-btn marking-btn--capture"
                  onClick={() => fileRef.current?.click()}
                >
                  Take photo
                </button>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
