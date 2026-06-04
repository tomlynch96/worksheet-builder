import { useState, useEffect } from 'react'
import type { OakLessonDetail } from '../types/oak'
import './OakDirectoryPicker.css'

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

interface Props {
  ks: 'ks3' | 'ks4'
  examBoard?: string  // oak slug: aqa | edexcel | ocr (ks4 only)
  subject?: 'physics' | 'biology' | 'chemistry'  // ks4 only; defaults to physics
  onSeed: (lesson: OakLessonDetail) => void
  onImport: (lesson: OakLessonDetail) => void
  onSkip: () => void
}

async function fetchJson(url: string) {
  const r = await fetch(url)
  const j = await r.json()
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`)
  return j
}

export function OakDirectoryPicker({ ks, examBoard, subject = 'physics', onSeed, onImport, onSkip }: Props) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(new Set())
  const [topicLessons, setTopicLessons] = useState<Map<string, OakLesson[]>>(new Map())
  const [loadingTopics, setLoadingTopics] = useState<Set<string>>(new Set())

  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setTopics([])
    setExpandedSlugs(new Set())
    setTopicLessons(new Map())
    setSelectedLesson(null)

    async function load() {
      try {
        let data: { topics: Topic[] }
        if (ks === 'ks3') {
          data = await fetchJson('/api/oak?ks3science=1')
        } else {
          const seq = `science-secondary-${examBoard ?? 'aqa'}`
          data = await fetchJson(`/api/oak?sequence=${encodeURIComponent(seq)}&childSubject=${subject}`)
        }
        if (!cancelled) setTopics(data.topics ?? [])
      } catch (e) {
        if (!cancelled) setError(String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [ks, examBoard, subject])

  async function toggleTopic(topic: Topic) {
    const slug = topic.unitSlug

    if (expandedSlugs.has(slug)) {
      setExpandedSlugs(prev => { const n = new Set(prev); n.delete(slug); return n })
      return
    }

    setExpandedSlugs(prev => new Set([...prev, slug]))
    setSelectedLesson(null)

    if (topicLessons.has(slug)) return

    setLoadingTopics(prev => new Set([...prev, slug]))
    try {
      const params = new URLSearchParams({ unit: slug })
      if (ks === 'ks4') {
        params.set('childSubject', subject)
        params.set('examBoard', examBoard ?? 'aqa')
        if (topic.tier) params.set('tier', topic.tier)
      }
      const data = await fetchJson(`/api/oak?${params}`)
      setTopicLessons(prev => new Map([...prev, [slug, data.unitLessons ?? []]]))
    } catch {
      setTopicLessons(prev => new Map([...prev, [slug, []]]))
    } finally {
      setLoadingTopics(prev => { const n = new Set(prev); n.delete(slug); return n })
    }
  }

  async function handleAction(action: 'seed' | 'import', lessonSlug: string) {
    setActionLoading(lessonSlug)
    setActionError(null)
    try {
      const detail: OakLessonDetail = await fetchJson(`/api/oak?lesson=${encodeURIComponent(lessonSlug)}`)
      if (action === 'seed') onSeed(detail)
      else onImport(detail)
    } catch (e) {
      setActionError(String(e))
    } finally {
      setActionLoading(null)
    }
  }

  const filteredTopics = ks === 'ks4'
    ? topics.filter(t => !t.tier || t.tier === 'higher')
    : topics

  const years = ks === 'ks3' ? [7, 8, 9] : [10, 11]

  return (
    <div className="oak-dir">
      <div className="oak-dir-badge">
        Oak National Academy — {ks === 'ks3' ? 'KS3 Science' : `GCSE ${subject.charAt(0).toUpperCase() + subject.slice(1)}`}
      </div>

      {loading && <div className="oak-dir-loading">Loading topics…</div>}
      {error && <div className="oak-dir-error">{error}</div>}

      {!loading && !error && (
        <div className="oak-dir-tree">
          {years.map(year => {
            const yearTopics = filteredTopics
              .filter(t => t.year === year)
              .sort((a, b) => a.unitOrder - b.unitOrder)
            if (yearTopics.length === 0) return null
            return (
              <div key={year} className="oak-dir-year-group">
                <div className="oak-dir-year-label">Year {year}</div>
                {yearTopics.map(topic => {
                  const expanded = expandedSlugs.has(topic.unitSlug)
                  const lessons = topicLessons.get(topic.unitSlug) ?? []
                  const isLoadingLessons = loadingTopics.has(topic.unitSlug)
                  const publishedLessons = lessons.filter(l => l.state === 'published')

                  return (
                    <div key={topic.unitSlug} className="oak-dir-topic">
                      <button
                        className={`oak-dir-topic-btn${expanded ? ' oak-dir-topic-btn--open' : ''}`}
                        onClick={() => toggleTopic(topic)}
                      >
                        <span className="oak-dir-chevron">{expanded ? '▾' : '▸'}</span>
                        <span className="oak-dir-topic-title">{topic.unitTitle}</span>
                      </button>

                      {expanded && (
                        <div className="oak-dir-lessons">
                          {isLoadingLessons && (
                            <div className="oak-dir-lessons-status">Loading lessons…</div>
                          )}
                          {!isLoadingLessons && publishedLessons.length === 0 && (
                            <div className="oak-dir-lessons-status">No published lessons.</div>
                          )}
                          {publishedLessons.map(lesson => {
                            const isSelected = selectedLesson === lesson.lessonSlug
                            const isActing = actionLoading === lesson.lessonSlug
                            return (
                              <div key={lesson.lessonSlug}
                                className={`oak-dir-lesson${isSelected ? ' oak-dir-lesson--selected' : ''}`}
                              >
                                <button
                                  className="oak-dir-lesson-btn"
                                  onClick={() => setSelectedLesson(isSelected ? null : lesson.lessonSlug)}
                                >
                                  {lesson.lessonTitle}
                                </button>
                                {isSelected && (
                                  <div className="oak-dir-lesson-actions">
                                    <div className="oak-tooltip-wrap">
                                      <button
                                        className="oak-dir-action-btn oak-dir-action-btn--seed"
                                        onClick={() => handleAction('seed', lesson.lessonSlug)}
                                        disabled={!!isActing}
                                      >
                                        {isActing ? '…' : <span>✦ Seed AI</span>}
                                      </button>
                                      <div className="oak-tooltip">
                                        AI reads this lesson's learning objectives, keywords and common misconceptions, then generates a complete worksheet informed by them. You choose the format on the next screen.
                                      </div>
                                    </div>
                                    <div className="oak-tooltip-wrap">
                                      <button
                                        className="oak-dir-action-btn oak-dir-action-btn--import"
                                        onClick={() => handleAction('import', lesson.lessonSlug)}
                                        disabled={!!isActing}
                                      >
                                        {isActing ? '…' : <span>↓ Import questions</span>}
                                      </button>
                                      <div className="oak-tooltip">
                                        Exit quiz questions from this Oak lesson are converted directly into worksheet blocks — no AI involved. Quick and faithful to the lesson content.
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {actionError && <div className="oak-dir-error" style={{ marginTop: 4 }}>{actionError}</div>}

      <button className="oak-dir-skip-btn" onClick={onSkip}>
        Skip — enter topic manually instead
      </button>
    </div>
  )
}
