import { useState, useMemo } from 'react'
import { useProfileContext } from '../context/ProfileContext'
import { QUALIFICATION_OFFERINGS, getSpecTopics, offeringLabel } from '../data/qualifications'
import { getEquationsForTopic } from '../data/physicsEquations'
import { generateWorksheet } from '../utils/generateWorksheet'
import type { UserCourse } from '../types/profile'
import type { Worksheet } from '../types/worksheet'
import './NewSheetWizard.css'

interface WizardResult {
  qualification_id: string
  exam_board: string
  spec_point: string
  topic_title: string
}

interface Props {
  onConfirm: (result: WizardResult) => void
  onGenerated: (worksheet: Worksheet) => void
  onCancel: () => void
}

const BOARD_COLORS: Record<string, string> = {
  AQA: '#1e3a5f', OCR: '#1d4ed8', Edexcel: '#7c2d12', WJEC: '#166534',
}

type WorksheetType = 'maths' | 'knowledge' | 'practical'

const WORKSHEET_TYPES: { id: WorksheetType; label: string; desc: string; icon: string }[] = [
  { id: 'maths',     label: 'Maths / calculation', desc: '21+ scaffolded calculation questions with worked example', icon: '∑' },
  { id: 'knowledge', label: 'Knowledge recall',     desc: 'Match-ups, gap-fills, and progressively harder recall',   icon: '🧠' },
  { id: 'practical', label: 'Practical / graph',    desc: 'Scatter data, plotting task, and graph analysis questions', icon: '📈' },
]

function CourseButton({
  course, selected, onClick,
}: { course: UserCourse; selected: boolean; onClick: () => void }) {
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

export function NewSheetWizard({ onConfirm, onGenerated, onCancel }: Props) {
  const { profile } = useProfileContext()
  const courses = profile?.user_courses ?? []

  const [step, setStep] = useState<'course' | 'spec' | 'mode'>('course')
  const [selectedCourse, setSelectedCourse] = useState<UserCourse | null>(null)
  const [selectedTopic, setSelectedTopic] = useState('')
  const [selectedPoint, setSelectedPoint] = useState('')
  const [freeText, setFreeText] = useState('')

  const [worksheetType, setWorksheetType] = useState<WorksheetType | null>(null)
  const [extraNotes, setExtraNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  const topics = useMemo(() => {
    if (!selectedCourse) return null
    return getSpecTopics(selectedCourse.qualification_id, selectedCourse.exam_board)
  }, [selectedCourse])

  const pointsForTopic = useMemo(() => {
    if (!topics || !selectedTopic) return []
    return topics.find(t => t.ref === selectedTopic)?.points ?? []
  }, [topics, selectedTopic])

  // Maths options
  const [difficulty, setDifficulty] = useState(3)
  const [selectedEquations, setSelectedEquations] = useState<Set<string> | null>(null)

  const topicTitle = useMemo(
    () => topics?.find(t => t.ref === selectedTopic)?.title ?? freeText,
    [topics, selectedTopic, freeText]
  )

  const relevantEquations = useMemo(
    () => getEquationsForTopic(topicTitle || selectedPoint),
    [topicTitle, selectedPoint]
  )

  function handleSelectMaths() {
    setWorksheetType('maths')
    setSelectedEquations(new Set(relevantEquations.map(e => e.name)))
  }

  function toggleEquation(name: string) {
    setSelectedEquations(prev => {
      const next = new Set(prev ?? [])
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  function handleCourseSelect(course: UserCourse) {
    setSelectedCourse(course)
    setSelectedTopic('')
    setSelectedPoint('')
    setFreeText('')
    setStep('spec')
  }

  function handleBack() {
    if (step === 'mode') { setStep('spec'); setGenError(null); return }
    setStep('course')
    setSelectedTopic('')
    setSelectedPoint('')
    setFreeText('')
  }

  function handleBlank() {
    if (!selectedCourse) return
    const topicTitle = topics?.find(t => t.ref === selectedTopic)?.title ?? freeText
    onConfirm({
      qualification_id: selectedCourse.qualification_id,
      exam_board: selectedCourse.exam_board,
      spec_point: selectedPoint || freeText,
      topic_title: topicTitle,
    })
  }

  async function handleGenerate() {
    if (!selectedCourse || !worksheetType) return
    setGenerating(true)
    setGenError(null)
    try {
      const worksheet = await generateWorksheet({
        topic: topicTitle || freeText || selectedPoint,
        examBoard: selectedCourse.exam_board,
        tier: 'higher',
        qualification: selectedCourse.qualification_id,
        specPoint: selectedPoint || freeText,
        worksheetType,
        extraNotes: extraNotes.trim() || undefined,
        difficulty: worksheetType === 'maths' ? difficulty : undefined,
        equations: worksheetType === 'maths' && selectedEquations
          ? Array.from(selectedEquations)
          : undefined,
      })
      onGenerated(worksheet)
    } catch (err) {
      setGenError(err instanceof Error ? err.message : String(err))
    } finally {
      setGenerating(false)
    }
  }

  const specLabel = selectedCourse
    ? offeringLabel(selectedCourse.qualification_id, selectedCourse.exam_board)
    : 'New worksheet'

  return (
    <div className="wizard-backdrop" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="wizard-panel">
        <div className="wizard-header">
          <h2 className="wizard-title">
            {step === 'course' ? 'New worksheet' : specLabel}
          </h2>
          <button className="wizard-close" onClick={onCancel} aria-label="Close">✕</button>
        </div>

        {/* Step 1: course */}
        {step === 'course' && (
          <div className="wizard-body">
            <p className="wizard-hint">Which course is this worksheet for?</p>
            {courses.length === 0 ? (
              <p className="wizard-empty">No courses configured — update your profile to add courses.</p>
            ) : (
              <div className="wizard-course-grid">
                {courses.map((c, i) => (
                  <CourseButton key={i} course={c} selected={selectedCourse === c} onClick={() => handleCourseSelect(c)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: spec point */}
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
                  Full spec data for {selectedCourse.exam_board} is coming soon.
                </p>
              </div>
            )}

            <div className="wizard-actions">
              <button className="wizard-btn wizard-btn--back" onClick={handleBack}>← Back</button>
              <button className="wizard-btn wizard-btn--confirm" onClick={() => { setGenError(null); setStep('mode') }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: blank vs AI */}
        {step === 'mode' && (
          <div className="wizard-body">
            <p className="wizard-hint">How do you want to start?</p>

            <div className="wizard-type-grid">
              {WORKSHEET_TYPES.map(wt => (
                <button
                  key={wt.id}
                  className={`wizard-type-btn${worksheetType === wt.id ? ' wizard-type-btn--selected' : ''}`}
                  onClick={() => wt.id === 'maths' ? handleSelectMaths() : setWorksheetType(wt.id)}
                  disabled={generating}
                >
                  <span className="wizard-type-icon">{wt.icon}</span>
                  <span className="wizard-type-info">
                    <span className="wizard-type-label">{wt.label}</span>
                    <span className="wizard-type-desc">{wt.desc}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Maths-specific options */}
            {worksheetType === 'maths' && (
              <div className="wizard-maths-options">
                <div className="wizard-field">
                  <label className="wizard-label">
                    Difficulty
                    <span className="wizard-difficulty-badge">
                      {['', 'Very easy', 'Easy', 'Medium', 'Hard', 'Very hard'][difficulty]}
                    </span>
                  </label>
                  <div className="wizard-slider-row">
                    <span className="wizard-slider-label">Simple</span>
                    <input
                      type="range" min={1} max={5} value={difficulty}
                      onChange={e => setDifficulty(Number(e.target.value))}
                      className="wizard-slider"
                      disabled={generating}
                    />
                    <span className="wizard-slider-label">Complex</span>
                  </div>
                  <p className="wizard-field-hint">
                    {difficulty <= 2 && 'Mostly direct substitution. Minimal rearranging.'}
                    {difficulty === 3 && 'Balanced: substitution → unit conversions → rearranging → multi-step.'}
                    {difficulty === 4 && 'More rearranging and multi-step. Still starts with 5 simple questions.'}
                    {difficulty >= 5 && 'Heavy on rearranging, multi-step, and combining equations.'}
                  </p>
                </div>

                {relevantEquations.length > 0 && (
                  <div className="wizard-field">
                    <label className="wizard-label">
                      Equations to include
                      <span className="wizard-eq-count">
                        {selectedEquations?.size ?? 0} of {relevantEquations.length} selected
                      </span>
                    </label>
                    <div className="wizard-eq-grid">
                      {relevantEquations.map(eq => {
                        const checked = selectedEquations?.has(eq.name) ?? false
                        return (
                          <button
                            key={eq.name}
                            type="button"
                            className={`wizard-eq-btn${checked ? ' wizard-eq-btn--on' : ''}`}
                            onClick={() => toggleEquation(eq.name)}
                            disabled={generating}
                          >
                            <span className="wizard-eq-check">{checked ? '✓' : ''}</span>
                            <span className="wizard-eq-info">
                              <span className="wizard-eq-name">{eq.name}</span>
                              <span className="wizard-eq-formula">{eq.latex.replace(/\\[a-zA-Z]+{?|[{}\\]/g, '').trim()}</span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {worksheetType && (
              <div className="wizard-field">
                <label className="wizard-label">
                  Extra notes for the AI <span className="wizard-optional">(optional)</span>
                </label>
                <textarea
                  className="wizard-textarea"
                  rows={2}
                  value={extraNotes}
                  onChange={e => setExtraNotes(e.target.value)}
                  placeholder="e.g. include a question about the effect of mass on acceleration"
                  disabled={generating}
                />
              </div>
            )}

            {genError && <p className="wizard-error">{genError}</p>}

            <div className="wizard-actions wizard-actions--mode">
              <button className="wizard-btn wizard-btn--back" onClick={handleBack} disabled={generating}>
                ← Back
              </button>
              <button className="wizard-btn wizard-btn--blank" onClick={handleBlank} disabled={generating}>
                Start blank
              </button>
              <button
                className="wizard-btn wizard-btn--generate"
                onClick={handleGenerate}
                disabled={!worksheetType || generating}
              >
                {generating
                  ? <><span className="wizard-spinner" /> Generating…</>
                  : '✦ Generate with AI'
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
