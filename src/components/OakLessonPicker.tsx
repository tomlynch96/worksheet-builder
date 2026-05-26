import { useState } from 'react'
import { useOakLessons, fetchOakLesson } from '../hooks/useOakLessons'
import type { OakSubject, OakLessonDetail } from '../types/oak'
import './OakLessonPicker.css'

interface Props {
  subject: OakSubject
  onImport: (lesson: OakLessonDetail) => void
  onSeed: (lesson: OakLessonDetail) => void
  onSkip: () => void
}

export function OakLessonPicker({ subject, onImport, onSeed, onSkip }: Props) {
  const { lessons, loading, error } = useOakLessons(subject)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<OakLessonDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const q = search.trim().toLowerCase()
  const filtered = q ? lessons.filter(l => l.lessonTitle.toLowerCase().includes(q)) : lessons

  async function handleSelect(slug: string) {
    if (selected === slug) return
    setSelected(slug)
    setDetail(null)
    setDetailError(null)
    setDetailLoading(true)
    try {
      const d = await fetchOakLesson(slug)
      setDetail(d)
    } catch (e) {
      setDetailError(String(e))
    } finally {
      setDetailLoading(false)
    }
  }

  const subjectLabel = subject === 'science' ? 'KS3 Science' : 'KS4 Physics'
  const exitCount = detail?.exitQuiz.length ?? 0

  return (
    <div className="oak-picker">
      <div className="oak-picker-header">
        <div className="oak-picker-badge">Oak National Academy · {subjectLabel}</div>
        <p className="oak-picker-hint">
          Find a lesson, then import its quiz questions directly or use it to seed AI generation.
        </p>
      </div>

      {loading && <div className="oak-picker-status">Loading lessons…</div>}
      {error && <div className="oak-picker-status oak-picker-status--error">Could not load lessons: {error}</div>}

      {!loading && !error && (
        <>
          <input
            className="oak-picker-search"
            type="search"
            placeholder={`Search ${filtered.length} ${subjectLabel} lessons…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />

          <div className="oak-picker-body">
            <div className="oak-picker-list">
              {filtered.length === 0 ? (
                <div className="oak-picker-empty">No lessons match your search.</div>
              ) : (
                filtered.map(l => (
                  <button
                    key={l.lessonSlug}
                    type="button"
                    className={`oak-picker-lesson${selected === l.lessonSlug ? ' oak-picker-lesson--selected' : ''}`}
                    onClick={() => handleSelect(l.lessonSlug)}
                  >
                    {l.lessonTitle}
                  </button>
                ))
              )}
            </div>

            {selected && (
              <div className="oak-picker-detail">
                {detailLoading && <div className="oak-picker-detail-loading">Loading lesson…</div>}
                {detailError && <div className="oak-picker-status oak-picker-status--error">{detailError}</div>}
                {detail && (
                  <>
                    <div className="oak-picker-detail-title">{detail.lessonTitle}</div>
                    {detail.pupilLessonOutcome && (
                      <div className="oak-picker-detail-outcome">{detail.pupilLessonOutcome}</div>
                    )}

                    {detail.keyLearningPoints.length > 0 && (
                      <div className="oak-picker-detail-section">
                        <div className="oak-picker-detail-label">Learning points</div>
                        <ul className="oak-picker-detail-list">
                          {detail.keyLearningPoints.slice(0, 4).map((p, i) => <li key={i}>{p}</li>)}
                          {detail.keyLearningPoints.length > 4 && (
                            <li className="oak-picker-detail-more">+{detail.keyLearningPoints.length - 4} more</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {detail.exitQuiz.length > 0 && (
                      <div className="oak-picker-detail-section">
                        <div className="oak-picker-detail-label">Exit quiz preview</div>
                        <div className="oak-picker-detail-q">{detail.exitQuiz[0].question}</div>
                        {detail.exitQuiz.length > 1 && (
                          <div className="oak-picker-detail-q">{detail.exitQuiz[1].question}</div>
                        )}
                        {detail.exitQuiz.length > 2 && (
                          <div className="oak-picker-detail-more">+{detail.exitQuiz.length - 2} more questions</div>
                        )}
                      </div>
                    )}

                    <div className="oak-picker-detail-actions">
                      {exitCount > 0 && (
                        <button
                          type="button"
                          className="oak-picker-btn oak-picker-btn--import"
                          onClick={() => onImport(detail)}
                        >
                          Import {exitCount} exit quiz questions
                        </button>
                      )}
                      <button
                        type="button"
                        className="oak-picker-btn oak-picker-btn--seed"
                        onClick={() => onSeed(detail)}
                      >
                        Seed AI generation
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <div className="oak-picker-footer">
        <button type="button" className="oak-picker-skip" onClick={onSkip}>
          Skip — generate without Oak content
        </button>
      </div>
    </div>
  )
}
