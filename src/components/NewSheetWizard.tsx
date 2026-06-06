import { useState, useMemo, useEffect, useRef } from 'react'
import { useProfileContext } from '../context/ProfileContext'
import { QUALIFICATION_OFFERINGS, getOffering, getSpecTopics, offeringLabel } from '../data/qualifications'
import { generateWorksheet } from '../utils/generateWorksheet'
import type { OakContext } from '../types/worksheet'
import { OakDirectoryPicker } from './OakDirectoryPicker'
import { oakQuestionToBlocks, oakQuestionNeedsImage } from '../utils/oakConvert'
import { supabase, isConfigured } from '../lib/supabase'
import type { UserCourse } from '../types/profile'
import type { WorksheetEntry } from '../hooks/useSupabaseWorksheets'
import type { Worksheet } from '../types/worksheet'
import type { OakLessonDetail } from '../types/oak'
import './NewSheetWizard.css'

interface Props {
  onGenerated: (worksheet: Worksheet, worksheetType: string) => void
  onCancel: () => void
  entries?: WorksheetEntry[]
}

const BOARD_COLORS: Record<string, string> = {
  AQA: '#1e3a5f', OCR: '#1d4ed8', Edexcel: '#7c2d12', WJEC: '#166534', Pearson: '#0052cc', IB: '#00447c',
}

type WorksheetType = 'maths' | 'knowledge' | 'practical'

const WORKSHEET_TYPES: { id: WorksheetType; label: string; desc: string; icon: string }[] = [
  { id: 'maths',     label: 'Maths / calculation', desc: '20+ scaffolded questions starting with direct substitution and building to multi-step problems. Includes a worked example and full mark scheme. Best for equation-heavy topics.', icon: '∑' },
  { id: 'knowledge', label: 'Knowledge recall',     desc: 'A structured mix: match-up activity, fill-in-the-gaps passage, and progressively harder recall questions — all aligned to your spec point. Best for consolidation lessons.', icon: '🧠' },
  { id: 'practical', label: 'Practical / graph',    desc: 'A realistic dataset, a results table, a graph plotting task and written analysis questions. Best for post-practical follow-up or teaching graph skills.', icon: '📈' },
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
      <img src="/paper_blowaway.svg" className="gen-logo" alt="" />
      <p className="gen-phrase">{shuffledRef.current[phraseIdx]}</p>
      <div className="gen-bar-track">
        <div className="gen-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="gen-subtext">Usually takes 15–30 seconds</p>
    </div>
  )
}

export function NewSheetWizard({ onGenerated, onCancel, entries = [] }: Props) {
  const { profile } = useProfileContext()
  // Include all courses the teacher has added, including custom boards (where specDataId returns null)
  const courses = (profile?.user_courses ?? []).filter(c => getOffering(c.qualification_id) !== undefined)

  const [step, setStep] = useState<'course' | 'oak-prompt' | 'oak-dir' | 'spec' | 'mode'>('course')
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

  const [oakLesson, setOakLesson] = useState<OakLessonDetail | null>(null)
  const [oakTopicImages, setOakTopicImages] = useState<string[]>([])

  function isOakCourse(qualId: string): boolean {
    return qualId.startsWith('exploring-science') ||
      qualId === 'gcse-physics' ||
      qualId === 'gcse-biology' ||
      qualId === 'gcse-chemistry'
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

  function getOakSubject(qualId: string): 'physics' | 'biology' | 'chemistry' {
    if (qualId.includes('biology')) return 'biology'
    if (qualId.includes('chemistry')) return 'chemistry'
    return 'physics'
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
    setOakTopicImages([])
    setStep('spec')
  }

  function handleBack() {
    const qualId = selectedCourse?.qualification_id ?? ''
    if (step === 'mode') { setStep(isOakCourse(qualId) ? 'oak-prompt' : 'spec'); setGenError(null); return }
    if (step === 'oak-dir') { setStep('oak-prompt'); return }
    if (step === 'oak-prompt') { setStep('spec'); return }
    if (step === 'spec') {
      setStep('course')
      setSelectedTopic('')
      setSelectedPoint('')
      setFreeText('')
      setOakLesson(null)
      setOakTopicImages([])
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
    const resolvedTitle = topics?.find(t => t.ref === selectedTopic)?.title ?? freeText
    const specPointTitle = pointsForTopic.find(p => p.ref === selectedPoint)?.title ?? freeText
    const defaultTitle = specPointTitle || resolvedTitle
    const oakCtx: OakContext | undefined = oakLesson ? {
      lessonTitle: oakLesson.lessonTitle,
      learningPoints: oakLesson.keyLearningPoints,
      keywords: oakLesson.keywords,
      misconceptions: oakLesson.misconceptions,
      images: oakTopicImages.length > 0 ? oakTopicImages : undefined,
    } : undefined
    const worksheet: import('../types/worksheet').Worksheet = {
      id: crypto.randomUUID(),
      oakContext: oakCtx,
      blocks: [
        {
          id: crypto.randomUUID(),
          type: 'header',
          title: defaultTitle,
          topic: resolvedTitle,
          examBoard: selectedCourse.exam_board as import('../types/worksheet').ExamBoard,
          tier: 'higher',
          showName: true,
          showDate: true,
          showClass: true,
          qualification: selectedCourse.qualification_id,
          specPoint: selectedPoint || freeText || undefined,
        },
        {
          id: crypto.randomUUID(),
          type: 'instructions',
          items: [
            'Answer all questions.',
            'Write your answers in the spaces provided.',
            'The marks for each question are shown in brackets.',
          ],
        },
      ],
    }
    onGenerated(worksheet, 'blank')
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

      // Fetch block annotations for matching worksheets (include change_summary for richer context)
      let priorBlockAnnotations: Array<{ block_type: string; topic: string; annotation: string; change_summary?: string; insight?: string }> = []
      if (isConfigured && sameQual.length > 0) {
        type BlockAnnRow = {
          block_type: string
          annotation: string
          change_summary: string
          annotation_insights: { insight_text: string }[]
          worksheets: { topic: string } | null
        }
        const { data } = await supabase
          .from('block_annotations')
          .select('block_type, annotation, change_summary, annotation_insights(insight_text), worksheets(topic)')
          .in('worksheet_id', sameQual.map(e => e.id))
          .neq('annotation', '')
          .order('updated_at', { ascending: false })
          .limit(15)
        if (data) {
          priorBlockAnnotations = (data as unknown as BlockAnnRow[])
            .filter(b => b.annotation)
            .map(b => ({
              block_type: b.block_type,
              topic: (b.worksheets as { topic: string } | null)?.topic ?? '',
              annotation: b.annotation,
              change_summary: b.change_summary || undefined,
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
          images: oakTopicImages.length > 0 ? oakTopicImages : undefined,
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
                  {selectedCourse.exam_board} isn't in our spec library yet — type your topic or spec point above and we'll generate to it directly.
                </p>
              </div>
            )}

            <div className="wizard-actions">
              <button className="wizard-btn wizard-btn--back" onClick={handleBack}>← Back</button>
              <button className="wizard-btn wizard-btn--confirm" onClick={() => { setGenError(null); setStep(isOakCourse(selectedCourse?.qualification_id ?? '') ? 'oak-prompt' : 'mode') }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2a: Oak opt-in prompt */}
        {!generating && step === 'oak-prompt' && selectedCourse && (
          <div className="wizard-body">
            <div className="oak-prompt-card">
              <div className="oak-prompt-badge">
                <span className="oak-prompt-dot" />
                Oak National Academy
              </div>
              <p className="oak-prompt-heading">Seed from an Oak lesson? <span className="oak-prompt-optional">(optional)</span></p>
              <p className="oak-prompt-desc">
                Oak lessons include verified learning objectives, key vocabulary, common misconceptions and diagrams.
                Linking one gives the AI richer context — and lets you browse lesson images when adding figures.
              </p>
              <div className="oak-prompt-benefits">
                <span>✦ Seed AI with learning objectives &amp; keywords</span>
                <span>↓ Import exit-quiz questions directly</span>
                <span>🖼 Browse lesson diagrams for figures</span>
              </div>
              <div className="oak-prompt-actions">
                <button
                  className="wizard-btn wizard-btn--confirm"
                  onClick={() => setStep('oak-dir')}
                >
                  Browse Oak lessons →
                </button>
                <button
                  className="wizard-btn wizard-btn--back"
                  onClick={() => { setOakLesson(null); setOakTopicImages([]); setStep('mode') }}
                >
                  Skip
                </button>
              </div>
            </div>
            <div className="wizard-actions" style={{ marginTop: 8 }}>
              <button className="wizard-btn wizard-btn--back" onClick={handleBack}>← Back</button>
            </div>
          </div>
        )}

        {/* Step 2b: Oak directory */}
        {!generating && step === 'oak-dir' && selectedCourse && (
          <div className="wizard-body">
            <OakDirectoryPicker
              ks={getOakKs(selectedCourse.qualification_id)}
              examBoard={getOakKs(selectedCourse.qualification_id) === 'ks4' ? getOakBoard(selectedCourse.exam_board) : undefined}
              subject={getOakKs(selectedCourse.qualification_id) === 'ks4' ? getOakSubject(selectedCourse.qualification_id) : undefined}
              onSeed={(lesson, topicImages) => { setOakLesson(lesson); setOakTopicImages(topicImages); setStep('mode') }}
              onImport={handleOakImport}
              onSkip={() => { setOakLesson(null); setOakTopicImages([]); setStep('mode') }}
            />
            <div className="wizard-actions" style={{ marginTop: 4 }}>
              <button className="wizard-btn wizard-btn--back" onClick={handleBack}>← Back</button>
            </div>
          </div>
        )}

        {/* Step 3: blank vs AI */}
        {!generating && step === 'mode' && (
          <div className="wizard-body">
            <p className="wizard-hint">How would you like to create this worksheet?</p>

            {/* Start blank — prominent recommended option */}
            <button className="wizard-blank-card" onClick={handleBlank} disabled={generating}>
              <div className="wizard-blank-card-top">
                <span className="wizard-blank-card-title">✎ Start blank</span>
                <span className="wizard-blank-badge">Recommended</span>
              </div>
              <p className="wizard-blank-card-desc">
                Build your own worksheet in the editor. Use AI assistance to get suggestions for individual questions, add figures, graphs and mark schemes — but every decision is yours. Perfect if you know what you want to teach.
              </p>
            </button>

            <div className="wizard-ai-divider">— or generate a full worksheet with AI —</div>

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
                    <span className="wizard-type-prefix">What you'll get: </span>
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
