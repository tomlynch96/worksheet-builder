import { useState, useMemo } from 'react'
import { useProfileContext } from '../context/ProfileContext'
import { QUALIFICATION_OFFERINGS, getSpecTopics, offeringLabel } from '../data/qualifications'
import type { UserCourse } from '../types/profile'
import './NewSheetWizard.css'

interface WizardResult {
  qualification_id: string
  exam_board: string
  spec_point: string
  topic_title: string
}

interface Props {
  onConfirm: (result: WizardResult) => void
  onCancel: () => void
}

const BOARD_COLORS: Record<string, string> = {
  AQA: '#1e3a5f', OCR: '#1d4ed8', Edexcel: '#7c2d12', WJEC: '#166534',
}

function CourseButton({
  course,
  selected,
  onClick,
}: {
  course: UserCourse
  selected: boolean
  onClick: () => void
}) {
  const offering = QUALIFICATION_OFFERINGS.find(q => q.id === course.qualification_id)
  const color = BOARD_COLORS[course.exam_board] ?? '#374151'
  return (
    <button
      className={`wizard-course-btn${selected ? ' wizard-course-btn--selected' : ''}`}
      style={{ '--course-color': color } as React.CSSProperties}
      onClick={onClick}
    >
      <span className="wizard-course-board">{course.exam_board}</span>
      <span className="wizard-course-name">{offering?.label ?? course.qualification_id}</span>
    </button>
  )
}

export function NewSheetWizard({ onConfirm, onCancel }: Props) {
  const { profile } = useProfileContext()
  const courses = profile?.user_courses ?? []

  const [step, setStep] = useState<'course' | 'spec'>('course')
  const [selectedCourse, setSelectedCourse] = useState<UserCourse | null>(null)
  const [selectedTopic, setSelectedTopic] = useState('')
  const [selectedPoint, setSelectedPoint] = useState('')
  const [freeText, setFreeText] = useState('')

  const topics = useMemo(() => {
    if (!selectedCourse) return null
    return getSpecTopics(selectedCourse.qualification_id, selectedCourse.exam_board)
  }, [selectedCourse])

  const pointsForTopic = useMemo(() => {
    if (!topics || !selectedTopic) return []
    return topics.find(t => t.ref === selectedTopic)?.points ?? []
  }, [topics, selectedTopic])

  function handleCourseSelect(course: UserCourse) {
    setSelectedCourse(course)
    setSelectedTopic('')
    setSelectedPoint('')
    setFreeText('')
    setStep('spec')
  }

  function handleBack() {
    setStep('course')
    setSelectedTopic('')
    setSelectedPoint('')
    setFreeText('')
  }

  function handleConfirm() {
    if (!selectedCourse) return
    const topicTitle = topics?.find(t => t.ref === selectedTopic)?.title ?? freeText
    onConfirm({
      qualification_id: selectedCourse.qualification_id,
      exam_board: selectedCourse.exam_board,
      spec_point: selectedPoint || freeText,
      topic_title: topicTitle,
    })
  }

  const canConfirm = selectedCourse && (selectedPoint || freeText || true)

  return (
    <div className="wizard-backdrop" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="wizard-panel">
        <div className="wizard-header">
          <h2 className="wizard-title">
            {step === 'course' ? 'New worksheet' : offeringLabel(selectedCourse?.qualification_id, selectedCourse?.exam_board)}
          </h2>
          <button className="wizard-close" onClick={onCancel} aria-label="Close">✕</button>
        </div>

        {step === 'course' && (
          <div className="wizard-body">
            <p className="wizard-hint">Which course is this worksheet for?</p>
            {courses.length === 0 ? (
              <p className="wizard-empty">No courses configured — update your profile to add courses.</p>
            ) : (
              <div className="wizard-course-grid">
                {courses.map((c, i) => (
                  <CourseButton
                    key={i}
                    course={c}
                    selected={selectedCourse === c}
                    onClick={() => handleCourseSelect(c)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'spec' && selectedCourse && (
          <div className="wizard-body">
            <p className="wizard-hint">Which spec point does this cover?</p>

            {topics ? (
              <>
                <div className="wizard-field">
                  <label className="wizard-label">Topic</label>
                  <select
                    className="wizard-select"
                    value={selectedTopic}
                    onChange={e => { setSelectedTopic(e.target.value); setSelectedPoint('') }}
                  >
                    <option value="">— Select a topic —</option>
                    {topics.map(t => (
                      <option key={t.ref} value={t.ref}>{t.title}</option>
                    ))}
                  </select>
                </div>

                {selectedTopic && (
                  <div className="wizard-field">
                    <label className="wizard-label">Spec point</label>
                    <select
                      className="wizard-select"
                      value={selectedPoint}
                      onChange={e => setSelectedPoint(e.target.value)}
                    >
                      <option value="">— Select a spec point —</option>
                      {pointsForTopic.map(p => (
                        <option key={p.ref} value={p.ref}>{p.ref} — {p.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            ) : (
              <div className="wizard-field">
                <label className="wizard-label">Spec point / topic (free text)</label>
                <input
                  className="wizard-input"
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  placeholder="e.g. Newton's Laws of Motion"
                />
                <p className="wizard-field-hint">
                  Full spec data for {selectedCourse.exam_board} is coming soon. You can still label this worksheet manually.
                </p>
              </div>
            )}

            <div className="wizard-actions">
              <button className="wizard-btn wizard-btn--back" onClick={handleBack}>← Back</button>
              <button
                className="wizard-btn wizard-btn--confirm"
                onClick={handleConfirm}
                disabled={!canConfirm}
              >
                Create worksheet →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
