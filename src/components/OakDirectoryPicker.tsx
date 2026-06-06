import { useState, useEffect, useRef } from 'react'
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
  examBoard?: string
  subject?: 'physics' | 'biology' | 'chemistry'
  onSeed: (lesson: OakLessonDetail, topicImages: string[]) => void
  onImport: (lesson: OakLessonDetail) => void
  onSkip: () => void
}

async function fetchJson(url: string) {
  const r = await fetch(url)
  const j = await r.json()
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`)
  return j
}

function extractImages(detail: OakLessonDetail): string[] {
  return [...detail.starterQuiz, ...detail.exitQuiz]
    .map(q => q.questionImage?.url)
    .filter((url): url is string => !!url)
}

export function OakDirectoryPicker({ ks, examBoard, subject = 'physics', onSeed, onImport, onSkip }: Props) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(new Set())
  const [topicLessons, setTopicLessons] = useState<Map<string, OakLesson[]>>(new Map())
  const loadingTopicsRef = useRef<Set<string>>(new Set())
  const [loadingTopics, setLoadingTopics] = useState<Set<string>>(new Set())

  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

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

  const baseTopics = ks === 'ks4'
    ? topics.filter(t => !t.tier || t.tier === 'higher')
    : topics

  // Load lessons for a topic without changing expand state
  async function loadTopicLessons(topic: Topic) {
    const slug = topic.unitSlug
    if (topicLessons.has(slug) || loadingTopicsRef.current.has(slug)) return
    loadingTopicsRef.current.add(slug)
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
      loadingTopicsRef.current.delete(slug)
      setLoadingTopics(prev => { const n = new Set(prev); n.delete(slug); return n })
    }
  }

  function toggleTopic(topic: Topic) {
    const slug = topic.unitSlug
    if (expandedSlugs.has(slug)) {
      setExpandedSlugs(prev => { const n = new Set(prev); n.delete(slug); return n })
      return
    }
    setExpandedSlugs(prev => new Set([...prev, slug]))
    setSelectedLesson(null)
    loadTopicLessons(topic)
  }

  // When search becomes active, eagerly load all topic lessons so lesson titles are searchable
  const searchActive = search.trim().length > 0
  useEffect(() => {
    if (!searchActive || baseTopics.length === 0) return
    baseTopics.forEach(topic => loadTopicLessons(topic))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchActive, baseTopics.length])

  async function handleAction(action: 'seed' | 'import', lessonSlug: string, topicSlug: string) {
    setActionLoading(lessonSlug)
    setActionError(null)
    try {
      const detail: OakLessonDetail = await fetchJson(`/api/oak?lesson=${encodeURIComponent(lessonSlug)}`)

      if (action === 'import') {
        onImport(detail)
        return
      }

      // Collect images from all published lessons in the same unit
      const unitLessons = topicLessons.get(topicSlug) ?? []
      const otherSlugs = unitLessons
        .filter(l => l.state === 'published' && l.lessonSlug !== lessonSlug)
        .map(l => l.lessonSlug)

      const otherDetails: OakLessonDetail[] = (
        await Promise.all(
          otherSlugs.map(slug =>
            fetchJson(`/api/oak?lesson=${encodeURIComponent(slug)}`).catch(() => null)
          )
        )
      ).filter(Boolean)

      const allImages = [...extractImages(detail), ...otherDetails.flatMap(extractImages)]
        .filter((url, i, arr) => arr.indexOf(url) === i) // deduplicate

      onSeed(detail, allImages)
    } catch (e) {
      setActionError(String(e))
    } finally {
      setActionLoading(null)
    }
  }

  // Search filtering
  const q = search.trim().toLowerCase()
  const topicMatchesByTitle = (t: Topic) => t.unitTitle.toLowerCase().includes(q)
  const topicMatchesByLesson = (t: Topic) =>
    (topicLessons.get(t.unitSlug) ?? []).some(
      l => l.state === 'published' && l.lessonTitle.toLowerCase().includes(q)
    )

  const shownTopics = q
    ? baseTopics.filter(t => topicMatchesByTitle(t) || topicMatchesByLesson(t))
    : baseTopics

  // Auto-expand topics that only match by lesson title
  function isExpanded(t: Topic) {
    if (expandedSlugs.has(t.unitSlug)) return true
    if (q && !topicMatchesByTitle(t) && topicMatchesByLesson(t)) return true
    return false
  }

  // When search active, show only matching lessons within a topic (unless topic title matched)
  function visibleLessons(t: Topic, lessons: OakLesson[]) {
    const published = lessons.filter(l => l.state === 'published')
    if (!q || topicMatchesByTitle(t)) return published
    return published.filter(l => l.lessonTitle.toLowerCase().includes(q))
  }

  const years = ks === 'ks3' ? [7, 8, 9] : [10, 11]
  const allTopicsLoaded = searchActive && baseTopics.every(
    t => topicLessons.has(t.unitSlug) || loadingTopicsRef.current.has(t.unitSlug)
  )

  return (
    <div className="oak-dir">
      <div className="oak-dir-badge">
        Oak National Academy — {ks === 'ks3' ? 'KS3 Science' : `GCSE ${subject.charAt(0).toUpperCase() + subject.slice(1)}`}
      </div>

      {loading && <div className="oak-dir-loading">Loading topics…</div>}
      {error && <div className="oak-dir-error">{error}</div>}

      {!loading && !error && (
        <>
          <input
            className="oak-dir-search"
            type="search"
            placeholder="Search topics and lessons…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {searchActive && !allTopicsLoaded && (
            <div className="oak-dir-search-loading">Loading lessons for search…</div>
          )}
          <div className="oak-dir-tree">
            {years.map(year => {
              const yearTopics = shownTopics
                .filter(t => t.year === year)
                .sort((a, b) => a.unitOrder - b.unitOrder)
              if (yearTopics.length === 0) return null
              return (
                <div key={year} className="oak-dir-year-group">
                  <div className="oak-dir-year-label">Year {year}</div>
                  {yearTopics.map(topic => {
                    const expanded = isExpanded(topic)
                    const lessons = topicLessons.get(topic.unitSlug) ?? []
                    const isLoadingLessons = loadingTopics.has(topic.unitSlug)
                    const shown = visibleLessons(topic, lessons)

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
                            {!isLoadingLessons && shown.length === 0 && (
                              <div className="oak-dir-lessons-status">No matching lessons.</div>
                            )}
                            {shown.map(lesson => {
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
                                          onClick={() => handleAction('seed', lesson.lessonSlug, topic.unitSlug)}
                                          disabled={!!isActing}
                                        >
                                          {isActing ? '… Loading images' : <span>✦ Seed AI</span>}
                                        </button>
                                        <div className="oak-tooltip">
                                          AI reads this lesson's learning objectives, keywords and common misconceptions, then generates a complete worksheet informed by them. You choose the format on the next screen.
                                        </div>
                                      </div>
                                      <div className="oak-tooltip-wrap">
                                        <button
                                          className="oak-dir-action-btn oak-dir-action-btn--import"
                                          onClick={() => handleAction('import', lesson.lessonSlug, topic.unitSlug)}
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
            {q && shownTopics.length === 0 && (
              <div className="oak-dir-loading">No topics or lessons match "{search}"</div>
            )}
          </div>
        </>
      )}

      {actionError && <div className="oak-dir-error" style={{ marginTop: 4 }}>{actionError}</div>}

      <button className="oak-dir-skip-btn" onClick={onSkip}>
        Skip — enter topic manually instead
      </button>
    </div>
  )
}
