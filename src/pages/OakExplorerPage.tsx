import { useState } from 'react'
import { Topbar } from '../components/layout/Topbar'
import './OakExplorerPage.css'

const EXAM_BOARDS = [
  { label: 'AQA', slug: 'aqa' },
  { label: 'Edexcel', slug: 'edexcel' },
  { label: 'OCR', slug: 'ocr' },
]
const TIERS = [
  { label: 'Higher', slug: 'higher' },
  { label: 'Foundation', slug: 'foundation' },
]

interface Topic {
  unitSlug: string
  unitTitle: string
  year: number
  tier?: string | null
  unitOrder: number
}

interface OakLesson {
  lessonSlug: string
  lessonTitle: string
  lessonOrder?: number
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
  const [ks, setKs] = useState<'ks3' | 'ks4'>('ks4')
  const [examBoard, setExamBoard] = useState('aqa')
  const [tier, setTier] = useState('higher')

  const [allTopics, setAllTopics] = useState<Topic[]>([])
  const [topicsLoading, setTopicsLoading] = useState(false)
  const [topicsError, setTopicsError] = useState<string | null>(null)

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [lessons, setLessons] = useState<OakLesson[]>([])
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [lessonsError, setLessonsError] = useState<string | null>(null)

  const [selectedLesson, setSelectedLesson] = useState<OakLesson | null>(null)
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null)
  const [lessonLoading, setLessonLoading] = useState(false)
  const [lessonError, setLessonError] = useState<string | null>(null)

  const [rawJson, setRawJson] = useState<string | null>(null)

  function switchKs(newKs: 'ks3' | 'ks4') {
    setKs(newKs)
    setAllTopics([])
    setTopicsError(null)
    setSelectedTopic(null)
    setLessons([])
    setSelectedLesson(null)
    setLessonDetail(null)
    setRawJson(null)
  }

  function changeTier(t: string) {
    setTier(t)
    setSelectedTopic(null)
    setLessons([])
    setSelectedLesson(null)
    setLessonDetail(null)
  }

  async function loadTopics() {
    setTopicsLoading(true)
    setTopicsError(null)
    setAllTopics([])
    setSelectedTopic(null)
    setLessons([])
    setSelectedLesson(null)
    setLessonDetail(null)
    setRawJson(null)
    try {
      let data: { topics: Topic[] }
      if (ks === 'ks3') {
        data = await fetchJson('/api/oak?ks3science=1')
      } else {
        const seq = `science-secondary-${examBoard}`
        data = await fetchJson(`/api/oak?sequence=${encodeURIComponent(seq)}`)
      }
      setAllTopics(data.topics ?? [])
      setRawJson(JSON.stringify((data.topics ?? []).slice(0, 5), null, 2))
    } catch (e) {
      setTopicsError(String(e))
    } finally {
      setTopicsLoading(false)
    }
  }

  async function loadLessons(topic: Topic) {
    setSelectedTopic(topic)
    setLessons([])
    setLessonsError(null)
    setLessonsLoading(true)
    setSelectedLesson(null)
    setLessonDetail(null)
    setRawJson(null)
    try {
      const params = new URLSearchParams({ unit: topic.unitSlug })
      if (ks === 'ks4') {
        params.set('childSubject', 'physics')
        params.set('examBoard', examBoard)
        const effectiveTier = topic.tier ?? tier
        if (effectiveTier) params.set('tier', effectiveTier)
      }
      const data = await fetchJson(`/api/oak?${params}`)
      setLessons(data.unitLessons ?? [])
      setRawJson(JSON.stringify(data, null, 2))
    } catch (e) {
      setLessonsError(String(e))
    } finally {
      setLessonsLoading(false)
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

  // Group topics by year
  const filteredTopics = ks === 'ks4'
    ? allTopics.filter(t => !t.tier || t.tier === tier)
    : allTopics

  const years = ks === 'ks3' ? [7, 8, 9] : [10, 11]
  const topicsByYear = years.map(y => ({
    year: y,
    topics: filteredTopics.filter(t => t.year === y).sort((a, b) => a.unitOrder - b.unitOrder),
  }))

  const loadLabel = ks === 'ks3' ? 'Load KS3 Science topics' : 'Load Physics GCSE topics'

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
                <button key={k}
                  className={`oak-ex-toggle-btn${ks === k ? ' oak-ex-toggle-btn--active' : ''}`}
                  onClick={() => switchKs(k)}>
                  {k.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {ks === 'ks4' && (
            <>
              <div className="oak-ex-control-group">
                <label className="oak-ex-label">Exam board</label>
                <div className="oak-ex-toggle">
                  {EXAM_BOARDS.map(b => (
                    <button key={b.slug}
                      className={`oak-ex-toggle-btn${examBoard === b.slug ? ' oak-ex-toggle-btn--active' : ''}`}
                      onClick={() => setExamBoard(b.slug)}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="oak-ex-control-group">
                <label className="oak-ex-label">Tier</label>
                <div className="oak-ex-toggle">
                  {TIERS.map(t => (
                    <button key={t.slug}
                      className={`oak-ex-toggle-btn${tier === t.slug ? ' oak-ex-toggle-btn--active' : ''}`}
                      onClick={() => changeTier(t.slug)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button className="oak-ex-load-btn" onClick={loadTopics} disabled={topicsLoading}>
            {topicsLoading ? 'Loading…' : loadLabel}
          </button>
          {filteredTopics.length > 0 && (
            <span className="oak-ex-count" style={{ alignSelf: 'center' }}>
              {filteredTopics.length} topics
            </span>
          )}
        </div>

        {topicsError && <div className="oak-ex-error">{topicsError}</div>}

        {/* ── Three-column explorer ── */}
        <div className="oak-ex-cols">

          {/* Topics */}
          <div className="oak-ex-col">
            <div className="oak-ex-col-header">
              Topics
              {filteredTopics.length > 0 && <span className="oak-ex-count">{filteredTopics.length}</span>}
            </div>
            <div className="oak-ex-col-body">
              {filteredTopics.length === 0 && !topicsLoading && (
                <div className="oak-ex-empty">Click "{loadLabel}" above.</div>
              )}
              {topicsByYear.map(({ year, topics }) => topics.length === 0 ? null : (
                <div key={year}>
                  <div className="oak-ex-year-header">Year {year}</div>
                  {topics.map(t => (
                    <button key={t.unitSlug + (t.tier ?? '')}
                      className={`oak-ex-item${selectedTopic?.unitSlug === t.unitSlug ? ' oak-ex-item--selected' : ''}`}
                      onClick={() => loadLessons(t)}>
                      <span className="oak-ex-item-title">{t.unitTitle}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Lessons */}
          <div className="oak-ex-col">
            <div className="oak-ex-col-header">
              Lessons
              {lessons.length > 0 && <span className="oak-ex-count">{lessons.length}</span>}
            </div>
            <div className="oak-ex-col-body">
              {lessonsLoading && <div className="oak-ex-empty">Loading…</div>}
              {lessonsError && <div className="oak-ex-error">{lessonsError}</div>}
              {!lessonsLoading && !selectedTopic && <div className="oak-ex-empty">Select a topic.</div>}
              {!lessonsLoading && selectedTopic && lessons.length === 0 && !lessonsError && (
                <div className="oak-ex-empty">No published lessons.</div>
              )}
              {lessons.map(l => (
                <button key={l.lessonSlug}
                  className={`oak-ex-item${selectedLesson?.lessonSlug === l.lessonSlug ? ' oak-ex-item--selected' : ''} ${l.state !== 'published' ? 'oak-ex-item--dim' : ''}`}
                  onClick={() => l.state === 'published' && loadLesson(l)}>
                  <span className="oak-ex-item-title">{l.lessonTitle}</span>
                  <span className="oak-ex-item-meta">
                    {l.state !== 'published' ? l.state : l.lessonOrder != null ? `#${l.lessonOrder}` : ''}
                  </span>
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
