import { useState } from 'react'
import { Topbar } from '../components/layout/Topbar'
import './OakExplorerPage.css'

const OAK_EXAM_BOARDS = ['AQA', 'OCR', 'Edexcel', 'Eduqas', 'WJEC']
const OAK_CHILD_SUBJECTS = ['physics', 'biology', 'chemistry', 'combined-science']
const OAK_TIERS = ['higher', 'foundation']

interface OakUnit {
  unitSlug: string
  unitTitle: string
  yearSlug?: string
  year?: number | string
  keyStageSlug?: string
  subjectSlug?: string
  description?: string
  priorKnowledgeRequirements?: string[]
  nationalCurriculumContent?: string[]
  unitLessons?: Array<{ lessonSlug: string; lessonTitle: string; lessonOrder: number; state: string }>
  programmeFactors?: {
    examBoard?: { slug: string; title: string }
    tier?: { slug: string; title: string }
    childSubject?: { slug: string; title: string }
  }
}

interface OakLesson {
  lessonSlug: string
  lessonTitle: string
  lessonOrder: number
  state: string
}

interface LessonDetail {
  lessonSlug: string
  lessonTitle: string
  pupilLessonOutcome: string
  keyLearningPoints: string[]
  keywords: Array<{ keyword: string; description: string }>
  misconceptions: Array<{ misconception: string; response: string }>
  starterQuiz: Array<{ question: string; questionType: string; answers: unknown[] }>
  exitQuiz: Array<{ question: string; questionType: string; answers: unknown[] }>
}

async function fetchJson(url: string) {
  const r = await fetch(url)
  const j = await r.json()
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`)
  return j
}

export function OakExplorerPage() {
  const [ks, setKs] = useState<'ks3' | 'ks4'>('ks3')
  const [examBoard, setExamBoard] = useState('')
  const [childSubject, setChildSubject] = useState('')
  const [tier, setTier] = useState('')

  const [units, setUnits] = useState<OakUnit[]>([])
  const [unitsLoading, setUnitsLoading] = useState(false)
  const [unitsError, setUnitsError] = useState<string | null>(null)

  const [selectedUnit, setSelectedUnit] = useState<OakUnit | null>(null)
  const [unitDetail, setUnitDetail] = useState<OakUnit | null>(null)
  const [unitLoading, setUnitLoading] = useState(false)
  const [unitError, setUnitError] = useState<string | null>(null)

  const [selectedLesson, setSelectedLesson] = useState<OakLesson | null>(null)
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null)
  const [lessonLoading, setLessonLoading] = useState(false)
  const [lessonError, setLessonError] = useState<string | null>(null)

  const [rawJson, setRawJson] = useState<string | null>(null)

  async function loadUnits() {
    setUnitsLoading(true)
    setUnitsError(null)
    setUnits([])
    setSelectedUnit(null)
    setUnitDetail(null)
    setSelectedLesson(null)
    setLessonDetail(null)
    setRawJson(null)
    try {
      const params = new URLSearchParams({ units: '', ks })
      if (examBoard) params.set('examBoard', examBoard.toLowerCase())
      if (childSubject) params.set('childSubject', childSubject)
      const data = await fetchJson(`/api/oak?${params}`)
      const raw: OakUnit[] = data.units ?? []
      setUnits(raw)
      setRawJson(JSON.stringify(raw.slice(0, 3), null, 2))
    } catch (e) {
      setUnitsError(String(e))
    } finally {
      setUnitsLoading(false)
    }
  }

  async function loadUnit(unit: OakUnit) {
    setSelectedUnit(unit)
    setUnitDetail(null)
    setUnitError(null)
    setUnitLoading(true)
    setSelectedLesson(null)
    setLessonDetail(null)
    setRawJson(null)
    try {
      const params = new URLSearchParams({ unit: unit.unitSlug })
      if (examBoard) params.set('examBoard', examBoard.toLowerCase())
      if (childSubject) params.set('childSubject', childSubject)
      if (tier) params.set('tier', tier)
      const data = await fetchJson(`/api/oak?${params}`)
      setUnitDetail(data)
      setRawJson(JSON.stringify(data, null, 2))
    } catch (e) {
      setUnitError(String(e))
    } finally {
      setUnitLoading(false)
    }
  }

  async function loadLesson(lesson: OakLesson) {
    setSelectedLesson(lesson)
    setLessonDetail(null)
    setLessonError(null)
    setLessonLoading(true)
    setRawJson(null)
    try {
      const data = await fetchJson(`/api/oak?lesson=${encodeURIComponent(lesson.lessonSlug)}`)
      setLessonDetail(data)
      setRawJson(JSON.stringify(data, null, 2))
    } catch (e) {
      setLessonError(String(e))
    } finally {
      setLessonLoading(false)
    }
  }

  const lessonList: OakLesson[] = (unitDetail?.unitLessons ?? [])

  return (
    <div className="oak-ex-layout">
      <Topbar />
      <div className="oak-ex-page">

        {/* ── Controls ── */}
        <div className="oak-ex-controls">
          <div className="oak-ex-control-group">
            <label className="oak-ex-label">Key stage</label>
            <div className="oak-ex-toggle">
              {(['ks3', 'ks4'] as const).map(k => (
                <button key={k} className={`oak-ex-toggle-btn${ks === k ? ' oak-ex-toggle-btn--active' : ''}`}
                  onClick={() => setKs(k)}>{k.toUpperCase()}</button>
              ))}
            </div>
          </div>

          {ks === 'ks4' && (
            <>
              <div className="oak-ex-control-group">
                <label className="oak-ex-label">Exam board</label>
                <select className="oak-ex-select" value={examBoard} onChange={e => setExamBoard(e.target.value)}>
                  <option value="">Any</option>
                  {OAK_EXAM_BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="oak-ex-control-group">
                <label className="oak-ex-label">Subject</label>
                <select className="oak-ex-select" value={childSubject} onChange={e => setChildSubject(e.target.value)}>
                  <option value="">Any</option>
                  {OAK_CHILD_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="oak-ex-control-group">
                <label className="oak-ex-label">Tier</label>
                <select className="oak-ex-select" value={tier} onChange={e => setTier(e.target.value)}>
                  <option value="">Any</option>
                  {OAK_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </>
          )}

          <button className="oak-ex-load-btn" onClick={loadUnits} disabled={unitsLoading}>
            {unitsLoading ? 'Loading…' : `Load ${ks.toUpperCase()} units`}
          </button>
        </div>

        {unitsError && <div className="oak-ex-error">{unitsError}</div>}

        {/* ── Three-column explorer ── */}
        <div className="oak-ex-cols">

          {/* Units */}
          <div className="oak-ex-col">
            <div className="oak-ex-col-header">
              Units <span className="oak-ex-count">{units.length}</span>
            </div>
            <div className="oak-ex-col-body">
              {units.length === 0 && !unitsLoading && (
                <div className="oak-ex-empty">Click "Load units" above.</div>
              )}
              {units.map(u => (
                <button
                  key={u.unitSlug}
                  className={`oak-ex-item${selectedUnit?.unitSlug === u.unitSlug ? ' oak-ex-item--selected' : ''}`}
                  onClick={() => loadUnit(u)}
                >
                  <span className="oak-ex-item-title">{u.unitTitle}</span>
                  {u.yearSlug && <span className="oak-ex-item-meta">{u.yearSlug.replace('year-', 'Y')}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Lessons */}
          <div className="oak-ex-col">
            <div className="oak-ex-col-header">
              Lessons
              {lessonList.length > 0 && <span className="oak-ex-count">{lessonList.length}</span>}
            </div>
            <div className="oak-ex-col-body">
              {unitLoading && <div className="oak-ex-empty">Loading…</div>}
              {unitError && <div className="oak-ex-error">{unitError}</div>}
              {!unitLoading && !selectedUnit && <div className="oak-ex-empty">Select a unit.</div>}
              {!unitLoading && selectedUnit && lessonList.length === 0 && !unitError && (
                <div className="oak-ex-empty">No published lessons.</div>
              )}
              {lessonList.map(l => (
                <button
                  key={l.lessonSlug}
                  className={`oak-ex-item${selectedLesson?.lessonSlug === l.lessonSlug ? ' oak-ex-item--selected' : ''} ${l.state !== 'published' ? 'oak-ex-item--dim' : ''}`}
                  onClick={() => l.state === 'published' && loadLesson(l)}
                >
                  <span className="oak-ex-item-title">{l.lessonTitle}</span>
                  <span className="oak-ex-item-meta">{l.state !== 'published' ? l.state : `#${l.lessonOrder}`}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lesson detail */}
          <div className="oak-ex-col oak-ex-col--detail">
            <div className="oak-ex-col-header">Detail</div>
            <div className="oak-ex-col-body">
              {lessonLoading && <div className="oak-ex-empty">Loading…</div>}
              {lessonError && <div className="oak-ex-error">{lessonError}</div>}
              {!lessonLoading && !selectedLesson && <div className="oak-ex-empty">Select a lesson.</div>}
              {lessonDetail && (
                <div className="oak-ex-detail">
                  <div className="oak-ex-detail-title">{lessonDetail.lessonTitle}</div>
                  {lessonDetail.pupilLessonOutcome && (
                    <div className="oak-ex-detail-outcome">{lessonDetail.pupilLessonOutcome}</div>
                  )}
                  {lessonDetail.keyLearningPoints?.length > 0 && (
                    <div className="oak-ex-detail-section">
                      <div className="oak-ex-detail-label">Learning points ({lessonDetail.keyLearningPoints.length})</div>
                      {lessonDetail.keyLearningPoints.map((p, i) => (
                        <div key={i} className="oak-ex-detail-point">• {p}</div>
                      ))}
                    </div>
                  )}
                  {lessonDetail.keywords?.length > 0 && (
                    <div className="oak-ex-detail-section">
                      <div className="oak-ex-detail-label">Keywords ({lessonDetail.keywords.length})</div>
                      {lessonDetail.keywords.map((k, i) => (
                        <div key={i} className="oak-ex-detail-kw"><strong>{k.keyword}</strong> — {k.description}</div>
                      ))}
                    </div>
                  )}
                  {lessonDetail.misconceptions?.length > 0 && (
                    <div className="oak-ex-detail-section">
                      <div className="oak-ex-detail-label">Misconceptions ({lessonDetail.misconceptions.length})</div>
                      {lessonDetail.misconceptions.map((m, i) => (
                        <div key={i} className="oak-ex-detail-misc">
                          <div className="oak-ex-detail-misc-q">⚠ {m.misconception}</div>
                          <div className="oak-ex-detail-misc-a">→ {m.response}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {lessonDetail.exitQuiz?.length > 0 && (
                    <div className="oak-ex-detail-section">
                      <div className="oak-ex-detail-label">Exit quiz ({lessonDetail.exitQuiz.length} questions)</div>
                      {lessonDetail.exitQuiz.map((q, i) => (
                        <div key={i} className="oak-ex-detail-q">
                          <span className="oak-ex-detail-qtype">{q.questionType}</span>
                          {q.question}
                        </div>
                      ))}
                    </div>
                  )}
                  {lessonDetail.starterQuiz?.length > 0 && (
                    <div className="oak-ex-detail-section">
                      <div className="oak-ex-detail-label">Starter quiz ({lessonDetail.starterQuiz.length} questions)</div>
                      {lessonDetail.starterQuiz.map((q, i) => (
                        <div key={i} className="oak-ex-detail-q">
                          <span className="oak-ex-detail-qtype">{q.questionType}</span>
                          {q.question}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Raw JSON viewer */}
        {rawJson && (
          <div className="oak-ex-raw">
            <div className="oak-ex-raw-header">
              Raw JSON
              <button className="oak-ex-raw-close" onClick={() => setRawJson(null)}>✕</button>
            </div>
            <pre className="oak-ex-raw-body">{rawJson}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
