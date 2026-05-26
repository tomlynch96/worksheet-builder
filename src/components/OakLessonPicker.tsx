import { useState, useMemo } from 'react'
import { useOakLessons } from '../hooks/useOakLessons'
import type { OakLesson, OakSubject } from '../types/oak'
import './OakLessonPicker.css'

interface Props {
  subject: OakSubject
  onSelect: (lesson: OakLesson) => void
  onSkip: () => void
}

export function OakLessonPicker({ subject, onSelect, onSkip }: Props) {
  const { data, loading, error } = useOakLessons(subject)
  const [search, setSearch] = useState('')
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())
  const [hoveredLesson, setHoveredLesson] = useState<OakLesson | null>(null)

  const q = search.trim().toLowerCase()

  const filteredUnits = useMemo(() => {
    if (!data) return []
    return data.units
      .map(unit => ({
        ...unit,
        lessons: unit.lessons.filter(l =>
          !q || l.lessonTitle.toLowerCase().includes(q)
        ),
      }))
      .filter(unit => unit.lessons.length > 0)
  }, [data, q])

  function toggleUnit(slug: string) {
    setExpandedUnits(prev => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }

  function getLessonData(lessonSlug: string): OakLesson | undefined {
    return data?.lessons.find(l => l.lessonSlug === lessonSlug)
  }

  const subjectLabel = subject === 'science' ? 'KS3 Science' : 'KS4 Physics'

  return (
    <div className="oak-picker">
      <div className="oak-picker-header">
        <div className="oak-picker-badge">Oak National Academy</div>
        <p className="oak-picker-hint">
          Select a {subjectLabel} lesson to seed your worksheet with its learning points and keywords.
        </p>
      </div>

      {loading && <div className="oak-picker-status">Loading {subjectLabel} lessons…</div>}
      {error && <div className="oak-picker-status oak-picker-status--error">Could not load Oak content: {error}</div>}

      {data && (
        <>
          <input
            className="oak-picker-search"
            type="search"
            placeholder="Search lessons…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className="oak-picker-body">
            <div className="oak-picker-list">
              {filteredUnits.length === 0 ? (
                <div className="oak-picker-empty">No lessons match your search.</div>
              ) : (
                filteredUnits.map(unit => (
                  <div key={unit.unitSlug} className="wizard-accordion-section">
                    <button
                      type="button"
                      className={`wizard-accordion-header${expandedUnits.has(unit.unitSlug) ? ' wizard-accordion-header--open' : ''}`}
                      onClick={() => toggleUnit(unit.unitSlug)}
                    >
                      <span className="wizard-accordion-ref oak-picker-year">
                        {unit.yearSlug.replace('year-', 'Y')}
                      </span>
                      <span className="wizard-accordion-title">{unit.unitTitle}</span>
                      <span className="wizard-accordion-chevron">
                        {expandedUnits.has(unit.unitSlug) ? '▾' : '▸'}
                      </span>
                    </button>

                    {expandedUnits.has(unit.unitSlug) && (
                      <div className="wizard-accordion-body">
                        {unit.lessons.map(l => {
                          const full = getLessonData(l.lessonSlug)
                          return (
                            <button
                              key={l.lessonSlug}
                              type="button"
                              className="wizard-accordion-lesson oak-picker-lesson"
                              onClick={() => full && onSelect(full)}
                              onMouseEnter={() => full && setHoveredLesson(full)}
                              onMouseLeave={() => setHoveredLesson(null)}
                            >
                              <span>{l.lessonTitle}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {hoveredLesson && (
              <div className="oak-picker-preview">
                <div className="oak-picker-preview-outcome">{hoveredLesson.pupilLessonOutcome}</div>
                {hoveredLesson.keyLearningPoints.length > 0 && (
                  <ul className="oak-picker-preview-points">
                    {hoveredLesson.keyLearningPoints.slice(0, 3).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                    {hoveredLesson.keyLearningPoints.length > 3 && (
                      <li className="oak-picker-preview-more">
                        +{hoveredLesson.keyLearningPoints.length - 3} more…
                      </li>
                    )}
                  </ul>
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
