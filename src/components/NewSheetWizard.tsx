import { useState, useMemo, useEffect, useRef } from 'react'
import { useProfileContext } from '../context/ProfileContext'
import { QUALIFICATION_OFFERINGS, getOffering, getSpecTopics, offeringLabel } from '../data/qualifications'
import { generateWorksheet, type OakContext } from '../utils/generateWorksheet'
import { OakDirectoryPicker } from './OakDirectoryPicker'
import { oakQuestionToBlocks, oakQuestionNeedsImage } from '../utils/oakConvert'
import { supabase, isConfigured } from '../lib/supabase'
import type { UserCourse } from '../types/profile'
import type { WorksheetEntry } from '../hooks/useSupabaseWorksheets'
import type { Worksheet } from '../types/worksheet'
import type { OakLessonDetail } from '../types/oak'
import './NewSheetWizard.css'

interface WizardResult {
  qualification_id: string
  exam_board: string
  spec_point: string
  topic_title: string
}

interface Props {
  onConfirm: (result: WizardResult) => void
  onGenerated: (worksheet: Worksheet, worksheetType: string) => void
  onCancel: () => void
  entries?: WorksheetEntry[]
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

const PHRASES: Record<WorksheetType, string[]> = {
  maths: [
    'Selecting realistic numerical values…',
    'Building the worked example…',
    'Scaffolding calculation questions…',
    'Setting question difficulty…',
    'Calibrating unit conversions…',
    'Writing multi-step problems…',
    'Adding mark scheme working…',
    'Checking significant figures…',
    'Composing the information block…',
    'Populating numerical answers…',
  ],
  knowledge: [
    'Analysing the spec point…',
    'Crafting the match-up activity…',
    'Writing the cloze passage…',
    'Generating recall questions…',
    'Building progressively harder questions…',
    'Checking command words…',
    'Writing mark scheme points…',
    'Applying exam board style…',
    'Composing key facts…',
    'Formatting definitions…',
  ],
  practical: [
    'Generating experimental scatter data…',
    'Building the results table…',
    'Writing graph analysis questions…',
    'Creating the evaluation question…',
    'Checking method steps…',
    'Writing the conclusion question…',
    'Applying mark scheme structure…',
    'Adding graph plotting task…',
    'Reviewing variable identification…',
    'Composing the information block…',
  ],
}

const GENERIC_PHRASES = [
  'Thinking through the topic…',
  'Applying exam board guidelines…',
  'Structuring the worksheet…',
  'Reviewing question quality…',
  'Cross-referencing the spec…',
]

function AtomGraphic() {
  return (
    <svg className="gen-atom" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* Nucleus */}
      <circle cx="60" cy="60" r="8" fill="#4f46e5" className="gen-nucleus" />
      {/* Orbit 1 */}
      <ellipse cx="60" cy="60" rx="48" ry="18" fill="none" stroke="#c7d2fe" strokeWidth="1.5" className="gen-orbit gen-orbit--1" />
      <circle r="5" fill="#818cf8" className="gen-electron gen-electron--1">
        <animateMotion dur="1.8s" repeatCount="indefinite">
          <mpath href="#orbit1path" />
        </animateMotion>
      </circle>
      {/* Orbit 2 */}
      <ellipse cx="60" cy="60" rx="48" ry="18" fill="none" stroke="#c7d2fe" strokeWidth="1.5"
        transform="rotate(60 60 60)" className="gen-orbit gen-orbit--2" />
      <circle r="4" fill="#a5b4fc" className="gen-electron gen-electron--2">
        <animateMotion dur="2.4s" repeatCount="indefinite">
          <mpath href="#orbit2path" />
        </animateMotion>
      </circle>
      {/* Orbit 3 */}
      <ellipse cx="60" cy="60" rx="48" ry="18" fill="none" stroke="#c7d2fe" strokeWidth="1.5"
        transform="rotate(120 60 60)" className="gen-orbit gen-orbit--3" />
      <circle r="4" fill="#6366f1" className="gen-electron gen-electron--3">
        <animateMotion dur="3.1s" repeatCount="indefinite" keyTimes="0;1" keyPoints="1;0">
          <mpath href="#orbit3path" />
        </animateMotion>
      </circle>
      {/* Hidden motion paths */}
      <defs>
        <path id="orbit1path" d="M 108,60 A 48,18 0 1,1 107.99,60.01" />
        <path id="orbit2path" d="M 84,19.6 A 48,18 60 1,1 83.99,19.61" />
        <path id="orbit3path" d="M 36,19.6 A 48,18 120 1,1 35.99,19.61" />
      </defs>
    </svg>
  )
}

function GeneratingScreen({ worksheetType }: { worksheetType: WorksheetType }) {
  const [progress, setProgress] = useState(0)
  const [phraseIdx, setPhraseIdx] = useState(0)
  const phrases = [...(PHRASES[worksheetType] ?? []), ...GENERIC_PHRASES]
  const shuffledRef = useRef<string[]>([...phrases].sort(() => Math.random() - 0.5))

  useEffect(() => {
    // Progress bar: reaches ~95% in about 28s
    const progressTimer = setInterval(() => {
      setProgress(p => Math.min(p + 100 / 56, 95))
    }, 500)
    // Cycle phrases every 3s
    const phraseTimer = setInterval(() => {
      setPhraseIdx(i => (i + 1) % shuffledRef.current.length)
    }, 3000)
    return () => { clearInterval(progressTimer); clearInterval(phraseTimer) }
  }, [])

  return (
    <div className="gen-screen">
      <AtomGraphic />
      <p className="gen-phrase">{shuffledRef.current[phraseIdx]}</p>
      <div className="gen-bar-track">
        <div className="gen-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="gen-subtext">Usually takes 15–30 seconds</p>
    </div>
  )
}

export function NewSheetWizard({ onConfirm, onGenerated, onCancel, entries = [] }: Props) {
  const { profile } = useProfileContext()
  const courses = (profile?.user_courses ?? []).filter(c => {
    const offering = getOffering(c.qualification_id)
    return offering?.examBoards.includes(c.exam_board) ?? false
  })

  const [step, setStep] = useState<'course' | 'oak-dir' | 'spec' | 'mode'>('course')
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

  const isKS3 = selectedCourse?.qualification_id.startsWith('exploring-science') ?? false

  const [oakLesson, setOakLesson] = useState<OakLessonDetail | null>(null)

  function isOakCourse(qualId: string): boolean {
    return qualId.startsWith('exploring-science') || qualId === 'gcse-physics'
  }

  function getOakKs(qualId: string): 'ks3' | 'ks4' {
    return qualId.startsWith('exploring-science') ? 'ks3' : 'ks4'
  }

  function getOakBoard(board: string): string {
    const b = board.toLowerCase()
    if (b === 'edexcel') return 'edexcel'
    if (b === 'ocr') return 'ocr'
    return 'aqa'
  }

  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())

  function toggleTopicExpand(ref: string) {
    setExpandedTopics(prev => {
      const next = new Set(prev)
      next.has(ref) ? next.delete(ref) : next.add(ref)
      return next
    })
  }

  const pointsForTopic = useMemo(() => {
    if (!topics || !selectedTopic) return []
    return topics.find(t => t.ref === selectedTopic)?.points ?? []
  }, [topics, selectedTopic])

  // Maths options
  const [difficulty, setDifficulty] = useState(3)

  const topicTitle = useMemo(
    () => topics?.find(t => t.ref === selectedTopic)?.title ?? freeText,
    [topics, selectedTopic, freeText]
  )

  function handleSelectMaths() {
    setWorksheetType('maths')
  }

  function handleCourseSelect(course: UserCourse) {
    setSelectedCourse(course)
    setSelectedTopic('')
    setSelectedPoint('')
    setFreeText('')
    setOakLesson(null)
    setStep('spec')
  }

  function handleBack() {
    const qualId = selectedCourse?.qualification_id ?? ''
    if (step === 'mode') { setStep(isOakCourse(qualId) ? 'oak-dir' : 'spec'); setGenError(null); return }
    if (step === 'oak-dir') { setStep('spec'); return }
    if (step === 'spec') {
      setStep('course')
      setSelectedTopic('')
      setSelectedPoint('')
      setFreeText('')
      setOakLesson(null)
      return
    }
    setStep('course')
  }

  function handleOakImport(lesson: OakLessonDetail) {
    if (!selectedCourse) return
    // Build a worksheet directly from Oak exit quiz questions
    const headerBlock = {
      id: crypto.randomUUID(),
      type: 'header' as const,
      title: lesson.lessonTitle,
      topic: lesson.lessonTitle,
      examBoard: selectedCourse.exam_board as import('../types/worksheet').ExamBoard,
      tier: 'higher' as const,
      qualification: selectedCourse.qualification_id,
      specPoint: selectedPoint || freeText || '',
      showName: true,
      showDate: true,
      showClass: true,
    }
    const instructionsBlock = {
      id: crypto.randomUUID(),
      type: 'instructions' as const,
      items: ['Answer all questions.', 'Marks are shown in brackets.'],
    }
    const questionBlocks = lesson.exitQuiz
      .filter(q => !oakQuestionNeedsImage(q))
      .flatMap(q => oakQuestionToBlocks(q))
    const worksheet: Worksheet = {
      id: crypto.randomUUID(),
      blocks: [headerBlock, instructionsBlock, ...questionBlocks],
    }
    onGenerated(worksheet, 'knowledge')
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
      // Build prior annotation context from same-qualification worksheets
      const sameQual = entries.filter(
        e => e.qualification_id === selectedCourse.qualification_id &&
             e.exam_board === selectedCourse.exam_board
      )
      const priorAnnotations = sameQual
        .filter(e => e.annotation)
        .slice(0, 5)
        .map(e => ({ topic: e.topic, rating: e.rating, annotation: e.annotation! }))

      // Fetch block annotations for matching worksheets
      let priorBlockAnnotations: Array<{ block_type: string; annotation: string; insight?: string }> = []
      if (isConfigured && sameQual.length > 0) {
        type BlockAnnRow = { block_type: string; annotation: string; annotation_insights: { insight_text: string }[] }
        const { data } = await supabase
          .from('block_annotations')
          .select('block_type, annotation, annotation_insights(insight_text)')
          .in('worksheet_id', sameQual.map(e => e.id))
          .neq('annotation', '')
          .limit(10)
        if (data) {
          priorBlockAnnotations = (data as BlockAnnRow[])
            .filter(b => b.annotation)
            .map(b => ({
              block_type: b.block_type,
              annotation: b.annotation,
              insight: b.annotation_insights?.[0]?.insight_text,
            }))
        }
      }

      const worksheet = await generateWorksheet({
        topic: topicTitle || freeText || selectedPoint,
        examBoard: selectedCourse.exam_board,
        tier: 'higher',
        qualification: selectedCourse.qualification_id,
        specPoint: selectedPoint || freeText,
        worksheetType,
        extraNotes: extraNotes.trim() || undefined,
        difficulty: worksheetType === 'maths' ? difficulty : undefined,
        teachingPhilosophy: profile?.teaching_philosophy || undefined,
        priorAnnotations: priorAnnotations.length > 0 ? priorAnnotations : undefined,
        priorBlockAnnotations: priorBlockAnnotations.length > 0 ? priorBlockAnnotations : undefined,
        oakContext: oakLesson ? ({
          lessonTitle: oakLesson.lessonTitle,
          learningPoints: oakLesson.keyLearningPoints,
          keywords: oakLesson.keywords,
          misconceptions: oakLesson.misconceptions,
          images: [...oakLesson.starterQuiz, ...oakLesson.exitQuiz]
            .map(q => q.questionImage?.url)
            .filter((url): url is string => !!url)
            .filter((url, i, arr) => arr.indexOf(url) === i), // deduplicate
        } satisfies OakContext) : undefined,
      })
      onGenerated(worksheet, worksheetType)
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

        {/* Generating screen — replaces all steps */}
        {generating && (
          <GeneratingScreen worksheetType={worksheetType ?? 'knowledge'} />
        )}

        {/* Step 1: course */}
        {!generating && step === 'course' && (
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
        {!generating && step === 'spec' && selectedCourse && (
          <div className="wizard-body">
            <p className="wizard-hint">Which spec point does this cover?</p>

            {topics && isKS3 ? (
              <div className="wizard-accordion">
                {selectedPoint && (
                  <p className="wizard-accordion-selected">
                    ✓ {selectedPoint} — {topics.flatMap(t => t.points).find(p => p.ref === selectedPoint)?.title}
                  </p>
                )}
                {topics.map(topic => (
                  <div key={topic.ref} className="wizard-accordion-section">
                    <button
                      type="button"
                      className={`wizard-accordion-header${expandedTopics.has(topic.ref) ? ' wizard-accordion-header--open' : ''}`}
                      onClick={() => toggleTopicExpand(topic.ref)}
                    >
                      <span className="wizard-accordion-ref">{topic.ref}</span>
                      <span className="wizard-accordion-title">{topic.title}</span>
                      <span className="wizard-accordion-chevron">{expandedTopics.has(topic.ref) ? '▾' : '▸'}</span>
                    </button>
                    {expandedTopics.has(topic.ref) && (
                      <div className="wizard-accordion-body">
                        {topic.points.map(point => (
                          <button
                            key={point.ref}
                            type="button"
                            className={`wizard-accordion-lesson${selectedPoint === point.ref ? ' wizard-accordion-lesson--selected' : ''}`}
                            onClick={() => { setSelectedTopic(topic.ref); setSelectedPoint(point.ref) }}
                          >
                            <span className="wizard-accordion-lesson-ref">{point.ref}</span>
                            <span>{point.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : topics ? (
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
              <button className="wizard-btn wizard-btn--confirm" onClick={() => { setGenError(null); setStep(isOakCourse(selectedCourse?.qualification_id ?? '') ? 'oak-dir' : 'mode') }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Oak directory */}
        {!generating && step === 'oak-dir' && selectedCourse && (
          <div className="wizard-body">
            <OakDirectoryPicker
              ks={getOakKs(selectedCourse.qualification_id)}
              examBoard={getOakKs(selectedCourse.qualification_id) === 'ks4' ? getOakBoard(selectedCourse.exam_board) : undefined}
              onSeed={lesson => { setOakLesson(lesson); setStep('mode') }}
              onImport={handleOakImport}
              onSkip={() => { setOakLesson(null); setStep('mode') }}
            />
            <div className="wizard-actions" style={{ marginTop: 4 }}>
              <button className="wizard-btn wizard-btn--back" onClick={handleBack}>← Back</button>
            </div>
          </div>
        )}

        {/* Step 3: blank vs AI */}
        {!generating && step === 'mode' && (
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
