import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/layout/Topbar'
import { useProfileContext } from '../context/ProfileContext'
import { useSupabaseWorksheets, type WorksheetEntry } from '../hooks/useSupabaseWorksheets'
import { getOffering, getSpecTopics, offeringLabel } from '../data/qualifications'
import { computeBlockMarks } from '../utils/marks'
import { drawRequestedDiagrams } from '../utils/generateDiagram'
import {
  EXEMPLAR_ACCEPT, MAX_EXEMPLAR_PAGES, buildExamFromQuestions, generateExamFromExemplars,
  renderExemplarPages, splitExemplar, type Exemplar, type ExamSettings, type ExemplarQuestion,
} from '../utils/examBuilder'
import type { Block, ExamBoard, Tier, Worksheet } from '../types/worksheet'
import './ExamBuilderPage.css'

type Step = 'setup' | 'source' | 'exemplar' | 'bank'

const EXAM_BOARDS: ExamBoard[] = ['AQA', 'OCR', 'Edexcel', 'WJEC', 'Pearson', 'IB']
const PICKABLE = new Set(['question', 'multiple_choice', 'cloze', 'match_them_up', 'order_steps'])

function plain(html: string | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
}

function blockPreview(b: Block): string {
  switch (b.type) {
    case 'question': {
      const stem = plain(b.stem)
      const first = b.parts[0] ? plain(b.parts[0].stem) : ''
      return [stem, first && `(${b.parts[0].label}) ${first}`].filter(Boolean).join(' ') || 'Untitled question'
    }
    case 'multiple_choice': return plain(b.stem) || 'Multiple choice question'
    case 'cloze': return plain(b.heading) || 'Fill in the blanks'
    case 'match_them_up': return plain(b.heading) || 'Match them up'
    case 'order_steps': return plain(b.heading) || 'Put the steps in order'
    default: return ''
  }
}

const TYPE_LABEL: Record<string, string> = {
  question: 'Written', multiple_choice: 'MCQ', cloze: 'Cloze', match_them_up: 'Match-up', order_steps: 'Ordering',
}

interface Pick { key: string; block: Block; source: Block[]; from: string }

function GeneratingOverlay({ stage }: { stage: string }) {
  return (
    <div className="xb-generating">
      <img src="/paper_blowaway_large.svg" className="xb-generating-logo" alt="" />
      <p className="xb-generating-stage">{stage}</p>
      <div className="xb-spinner" />
      <p className="xb-generating-sub">Writing a full paper can take a minute or two.</p>
    </div>
  )
}

export function ExamBuilderPage() {
  const { profile } = useProfileContext()
  const navigate = useNavigate()
  const { entries, fetchPublic } = useSupabaseWorksheets(profile?.id ?? null)

  const courses = (profile?.user_courses ?? []).filter(c => {
    const o = getOffering(c.qualification_id)
    return o && (o.examBoards.includes(c.exam_board) || o.examBoards.length === 0)
  })

  // ── Setup ──
  const [step, setStep] = useState<Step>('setup')
  const [courseIdx, setCourseIdx] = useState<number>(courses.length ? 0 : -1)
  const [freeBoard, setFreeBoard] = useState<ExamBoard>('AQA')
  const [topicRef, setTopicRef] = useState('')
  const [specPoint, setSpecPoint] = useState('')
  const [freeTopic, setFreeTopic] = useState('')
  const [title, setTitle] = useState('')
  const [tier, setTier] = useState<Tier>('higher')
  const [paperName, setPaperName] = useState('')
  const [duration, setDuration] = useState<number | ''>(60)

  const course = courseIdx >= 0 ? courses[courseIdx] : null
  const examBoard = (course?.exam_board as ExamBoard) ?? freeBoard
  const topics = course ? getSpecTopics(course.qualification_id, course.exam_board) ?? [] : []
  const topic = topics.find(t => t.ref === topicRef)
  const topicTitle = topic?.title ?? freeTopic.trim()

  const settings: ExamSettings = {
    title: title.trim() || (topicTitle ? `${topicTitle} exam` : 'Science exam'),
    topic: topicTitle,
    examBoard,
    tier,
    qualification: course?.qualification_id,
    specPoint: specPoint || undefined,
    paperName: paperName.trim() || undefined,
    durationMinutes: duration === '' ? undefined : duration,
  }

  // ── Exemplar path ──
  const fileRef = useRef<HTMLInputElement>(null)
  const [exemplars, setExemplars] = useState<Exemplar[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [markEdits, setMarkEdits] = useState<Record<string, number>>({})
  const [reading, setReading] = useState<string | null>(null)
  const [readError, setReadError] = useState<string | null>(null)
  const [targetMarks, setTargetMarks] = useState<number | ''>('')
  const [targetTouched, setTargetTouched] = useState(false)
  const [notes, setNotes] = useState('')
  const [generating, setGenerating] = useState<string | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  const marksOf = (q: ExemplarQuestion) => markEdits[q.key] ?? q.marks
  const chosen = exemplars.flatMap(e => e.questions.filter(q => selected.has(q.key)))
  const chosenMarks = chosen.reduce((s, q) => s + marksOf(q), 0)
  const chosenExemplars = new Set(chosen.map(q => q.exemplarId)).size
  const target = targetTouched && targetMarks !== '' ? targetMarks : chosenMarks

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    const list = Array.from(files)
    const name = list.length === 1 ? list[0].name.replace(/\.[^.]+$/, '') : `${list[0].name.replace(/\.[^.]+$/, '')} (+${list.length - 1} pages)`
    setReadError(null)
    try {
      setReading(`Reading ${name}…`)
      const { pages, truncated } = await renderExemplarPages(list)
      if (pages.length === 0) throw new Error('No pages found in that file.')
      setReading(`Finding the questions in ${name} (${pages.length} page${pages.length === 1 ? '' : 's'})…`)
      const ex = await splitExemplar(name, pages)
      setExemplars(prev => [...prev, ex])
      if (truncated) setReadError(`Only the first ${MAX_EXEMPLAR_PAGES} pages were read. Upload the rest as a separate exemplar if you need them.`)
    } catch (err) {
      setReadError(err instanceof Error ? err.message : String(err))
    } finally {
      setReading(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function toggle(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  function setAll(ex: Exemplar, on: boolean) {
    setSelected(prev => {
      const next = new Set(prev)
      ex.questions.forEach(q => on ? next.add(q.key) : next.delete(q.key))
      return next
    })
  }

  function removeExemplar(id: string) {
    const ex = exemplars.find(e => e.id === id)
    setExemplars(prev => prev.filter(e => e.id !== id))
    if (ex) setSelected(prev => { const next = new Set(prev); ex.questions.forEach(q => next.delete(q.key)); return next })
  }

  function openInEditor(worksheet: Worksheet, aiGenerated: boolean) {
    navigate('/editor', { state: { worksheet, aiGenerated, worksheetType: 'exam' } })
  }

  async function handleGenerate() {
    if (chosen.length === 0) return
    setGenError(null)
    try {
      setGenerating('Writing your exam: new numbers, new contexts, same structure…')
      const sources = Object.fromEntries(exemplars.map(e => [e.id, e.paperTitle || e.name]))
      const ws = await generateExamFromExemplars({
        settings,
        questions: chosen.map(q => ({ ...q, marks: marksOf(q) })),
        sources,
        targetMarks: target || chosenMarks,
        extraNotes: notes.trim() || undefined,
      })
      let finished = ws
      if (ws.blocks.some(b => b.type === 'figure' && b.diagramRequest)) {
        setGenerating('Drawing diagrams…')
        const context = [settings.examBoard, settings.tier, settings.topic, settings.specPoint].filter(Boolean).join(' · ')
        finished = await drawRequestedDiagrams(ws, context, {
          profileId: profile?.id,
          examBoard: settings.examBoard,
          qualification: settings.qualification,
          specPoint: settings.specPoint,
          topic: settings.topic || undefined,
        })
      }
      openInEditor(finished, true)
    } catch (err) {
      setGenError(err instanceof Error ? err.message : String(err))
      setGenerating(null)
    }
  }

  // ── Question bank path ──
  const [bankSource, setBankSource] = useState<'mine' | 'public'>('mine')
  const [bankQuery, setBankQuery] = useState('')
  const [publicEntries, setPublicEntries] = useState<WorksheetEntry[]>([])
  const [publicLoading, setPublicLoading] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [picks, setPicks] = useState<Pick[]>([])
  const [bankTarget, setBankTarget] = useState<number | ''>('')

  const [publicLoaded, setPublicLoaded] = useState(false)
  async function showPublic() {
    setBankSource('public')
    if (publicLoaded) return
    setPublicLoading(true)
    try {
      setPublicEntries(await fetchPublic({ qualification_id: course?.qualification_id, exam_board: course?.exam_board }))
      setPublicLoaded(true)
    } finally {
      setPublicLoading(false)
    }
  }

  const topicPointRefs = new Set(topic?.points.map(p => p.ref) ?? [])

  const bankEntries = (() => {
    const pool = bankSource === 'mine' ? entries : publicEntries
    const q = bankQuery.trim().toLowerCase()
    const tt = topicTitle.toLowerCase()
    return pool.filter(e => {
      if (!e.worksheet.blocks?.some(b => PICKABLE.has(b.type))) return false
      if (bankSource === 'mine' && course && e.qualification_id && e.qualification_id !== course.qualification_id) return false
      const byText = !!tt && `${e.title} ${e.topic}`.toLowerCase().includes(tt)
      if (specPoint) {
        if (e.spec_point !== specPoint && !byText) return false
      } else if (topicRef || tt) {
        const bySpec = !!e.spec_point && (topicPointRefs.has(e.spec_point) || e.spec_point === topicRef)
        if (!bySpec && !byText) return false
      }
      if (q && !`${e.title} ${e.topic} ${e.spec_point ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  })()

  const pickKey = (entryId: string, blockId: string) => `${entryId}:${blockId}`
  const picked = new Set(picks.map(p => p.key))
  const pickedMarks = picks.reduce((s, p) => s + computeBlockMarks(p.block), 0)

  function togglePick(entry: WorksheetEntry, block: Block) {
    const key = pickKey(entry.id, block.id)
    setPicks(prev => prev.some(p => p.key === key)
      ? prev.filter(p => p.key !== key)
      : [...prev, { key, block, source: entry.worksheet.blocks, from: entry.title }])
  }

  function movePick(idx: number, dir: -1 | 1) {
    setPicks(prev => {
      const next = [...prev]
      const j = idx + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
  }

  function handleCreateFromBank() {
    const ws = buildExamFromQuestions(settings, picks, bankTarget === '' ? undefined : bankTarget)
    openInEditor(ws, false)
  }

  // ── Render ──
  const canContinueSetup = !!topicTitle || !!title.trim()

  return (
    <div className="xb-layout">
      <Topbar />
      <main className="xb-main">
        <div className="xb-head">
          <h1 className="xb-title">New exam</h1>
          <ol className="xb-steps">
            <li className={step === 'setup' ? 'xb-steps--on' : ''}>1. Paper details</li>
            <li className={step === 'source' ? 'xb-steps--on' : ''}>2. How to build it</li>
            <li className={step === 'exemplar' || step === 'bank' ? 'xb-steps--on' : ''}>3. {step === 'bank' ? 'Pick questions' : 'Exemplars'}</li>
          </ol>
        </div>

        {step === 'setup' && (
          <section className="xb-card">
            <div className="xb-grid">
              <label className="xb-field">
                <span>Course</span>
                <select value={courseIdx} onChange={e => { setCourseIdx(Number(e.target.value)); setTopicRef(''); setSpecPoint(''); setPublicLoaded(false) }}>
                  {courses.map((c, i) => <option key={i} value={i}>{offeringLabel(c.qualification_id, c.exam_board)}</option>)}
                  <option value={-1}>Other / not listed</option>
                </select>
              </label>
              {!course && (
                <label className="xb-field">
                  <span>Exam board</span>
                  <select value={freeBoard} onChange={e => setFreeBoard(e.target.value as ExamBoard)}>
                    {EXAM_BOARDS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </label>
              )}
              {topics.length > 0 ? (
                <>
                  <label className="xb-field">
                    <span>Topic</span>
                    <select value={topicRef} onChange={e => { setTopicRef(e.target.value); setSpecPoint('') }}>
                      <option value="">Select a topic</option>
                      {topics.map(t => <option key={t.ref} value={t.ref}>{t.ref}: {t.title}</option>)}
                    </select>
                  </label>
                  {topic && (
                    <label className="xb-field">
                      <span>Spec point <em>(optional)</em></span>
                      <select value={specPoint} onChange={e => setSpecPoint(e.target.value)}>
                        <option value="">Whole topic</option>
                        {topic.points.map(p => <option key={p.ref} value={p.ref}>{p.ref}: {p.title}</option>)}
                      </select>
                    </label>
                  )}
                </>
              ) : (
                <label className="xb-field">
                  <span>Topic</span>
                  <input value={freeTopic} onChange={e => setFreeTopic(e.target.value)} placeholder="e.g. Energy and electricity" />
                </label>
              )}
              <label className="xb-field xb-field--wide">
                <span>Exam title</span>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder={topicTitle ? `${topicTitle} exam` : 'e.g. Year 10 Mock: Physics Paper 1'} />
              </label>
              <label className="xb-field">
                <span>Paper name <em>(optional)</em></span>
                <input value={paperName} onChange={e => setPaperName(e.target.value)} placeholder="e.g. Paper 1 (Higher Tier)" />
              </label>
              <label className="xb-field">
                <span>Tier</span>
                <select value={tier} onChange={e => setTier(e.target.value as Tier)}>
                  <option value="higher">Higher</option>
                  <option value="foundation">Foundation</option>
                  <option value="both">Not tiered</option>
                </select>
              </label>
              <label className="xb-field">
                <span>Time allowed (minutes)</span>
                <input type="number" min={0} step={5} value={duration} onChange={e => setDuration(e.target.value === '' ? '' : Number(e.target.value))} />
              </label>
            </div>
            <div className="xb-actions">
              <button className="xb-btn xb-btn--ghost" onClick={() => navigate(-1)}>Cancel</button>
              <button className="xb-btn" disabled={!canContinueSetup} onClick={() => setStep('source')}>Next</button>
            </div>
          </section>
        )}

        {step === 'source' && (
          <section className="xb-choice">
            <button className="xb-option" onClick={() => setStep('exemplar')}>
              <span className="xb-option-icon">⎘</span>
              <span className="xb-option-title">Replicate an exemplar paper</span>
              <span className="xb-option-desc">
                Upload a past paper or specimen. AI splits it into questions so you can pick the ones you want,
                then writes a very similar exam with new numbers and contexts, redrawing diagrams where they are needed.
              </span>
            </button>
            <button className="xb-option" onClick={() => setStep('bank')}>
              <span className="xb-option-icon">☰</span>
              <span className="xb-option-title">Start blank or from existing questions</span>
              <span className="xb-option-desc">
                Pick questions on {topicTitle || 'this topic'} from your worksheets or the public library.
                They go straight into the exam, and you can add more questions in the editor as usual.
              </span>
            </button>
            <div className="xb-actions xb-actions--left">
              <button className="xb-btn xb-btn--ghost" onClick={() => setStep('setup')}>Back</button>
            </div>
          </section>
        )}

        {step === 'exemplar' && (
          <div className="xb-split">
            <section className="xb-exemplars">
              <input ref={fileRef} type="file" accept={EXEMPLAR_ACCEPT} multiple hidden onChange={e => handleFiles(e.target.files)} />

              {exemplars.length === 0 && !reading && (
                <button className="xb-drop" onClick={() => fileRef.current?.click()}>
                  <strong>Upload an exemplar paper</strong>
                  <span>A PDF, or photos/scans of the pages (select them all at once). Up to {MAX_EXEMPLAR_PAGES} pages.</span>
                </button>
              )}

              {reading && <div className="xb-reading"><div className="xb-spinner" /> {reading}</div>}
              {readError && <p className="xb-error">{readError}</p>}

              {exemplars.map(ex => {
                const exSel = ex.questions.filter(q => selected.has(q.key))
                return (
                  <div key={ex.id} className="xb-exemplar">
                    <div className="xb-exemplar-head">
                      <div>
                        <h2>{ex.paperTitle || ex.name}</h2>
                        <p>{ex.questions.length} questions · {ex.questions.reduce((s, q) => s + marksOf(q), 0)} marks · {exSel.length} selected</p>
                      </div>
                      <div className="xb-exemplar-tools">
                        <button className="xb-link" onClick={() => setAll(ex, true)}>Select all</button>
                        <button className="xb-link" onClick={() => setAll(ex, false)}>Clear</button>
                        <button className="xb-link xb-link--danger" onClick={() => removeExemplar(ex.id)}>Remove</button>
                      </div>
                    </div>
                    <div className="xb-qgrid">
                      {ex.questions.map(q => {
                        const on = selected.has(q.key)
                        return (
                          <div key={q.key} className={`xb-q${on ? ' xb-q--on' : ''}`} onClick={() => toggle(q.key)}>
                            <div className="xb-q-head">
                              <input type="checkbox" checked={on} onChange={() => toggle(q.key)} onClick={e => e.stopPropagation()} />
                              <strong>Q{q.number}</strong>
                              <label className="xb-q-marks" onClick={e => e.stopPropagation()} title="Correct the marks if they were misread">
                                <input
                                  type="number" min={0}
                                  value={marksOf(q)}
                                  onChange={e => setMarkEdits(m => ({ ...m, [q.key]: Math.max(0, Number(e.target.value) || 0) }))}
                                />
                                marks
                              </label>
                            </div>
                            {q.summary && <p className="xb-q-summary">{q.summary}{q.hasDiagram && <span className="xb-tag">diagram</span>}</p>}
                            <div className="xb-q-thumbs">
                              {q.crops.map((c, i) => <img key={i} src={c} alt={`Question ${q.number}, part ${i + 1}`} />)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {exemplars.length > 0 && !reading && (
                <button className="xb-btn xb-btn--ghost xb-add" onClick={() => fileRef.current?.click()}>+ Add another exemplar</button>
              )}
            </section>

            <aside className="xb-summary">
              <h3>Your exam</h3>
              <p className="xb-summary-big">{chosenMarks}<span> marks of exemplars</span></p>
              <p className="xb-summary-sub">
                {chosen.length} question{chosen.length === 1 ? '' : 's'} from {chosenExemplars} exemplar{chosenExemplars === 1 ? '' : 's'}
              </p>
              {chosen.length > 0 && (
                <p className="xb-summary-list">{chosen.map(q => `Q${q.number}`).join(', ')}</p>
              )}
              <label className="xb-field">
                <span>How many marks should the exam be?</span>
                <input
                  type="number" min={1}
                  value={targetTouched ? targetMarks : chosenMarks || ''}
                  onChange={e => { setTargetTouched(true); setTargetMarks(e.target.value === '' ? '' : Number(e.target.value)) }}
                />
              </label>
              {chosen.length > 0 && target > 0 && target !== chosenMarks && (
                <p className="xb-summary-note">
                  AI will {target < chosenMarks ? `cut ${chosenMarks - target}` : `add ${target - chosenMarks}`} marks
                  while keeping as close to your exemplars as it can.
                </p>
              )}
              <label className="xb-field">
                <span>Notes for the AI <em>(optional)</em></span>
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Keep Q5 as a 6-mark question; set the contexts in sport" />
              </label>
              {genError && <p className="xb-error">{genError}</p>}
              <button className="xb-btn xb-btn--wide" disabled={chosen.length === 0 || !!reading || !target} onClick={handleGenerate}>
                ✦ Generate exam
              </button>
              <button className="xb-btn xb-btn--ghost xb-btn--wide" onClick={() => setStep('source')}>Back</button>
            </aside>
          </div>
        )}

        {step === 'bank' && (
          <div className="xb-split">
            <section className="xb-bank">
              <div className="xb-bank-bar">
                <div className="xb-tabs">
                  <button className={bankSource === 'mine' ? 'xb-tab--on' : ''} onClick={() => setBankSource('mine')}>My library</button>
                  <button className={bankSource === 'public' ? 'xb-tab--on' : ''} onClick={showPublic}>Public library</button>
                </div>
                <input className="xb-search" type="search" placeholder="Search worksheets…" value={bankQuery} onChange={e => setBankQuery(e.target.value)} />
              </div>
              <p className="xb-bank-hint">
                Showing worksheets on <strong>{specPoint || topicTitle || 'any topic'}</strong>
                {course ? ` for ${offeringLabel(course.qualification_id, course.exam_board)}` : ''}. Tick questions to add them.
              </p>

              {bankSource === 'public' && publicLoading ? (
                <div className="xb-reading"><div className="xb-spinner" /> Searching the public library…</div>
              ) : bankEntries.length === 0 ? (
                <p className="xb-empty">No {bankSource === 'mine' ? 'worksheets of yours' : 'public worksheets'} with questions on this topic yet.</p>
              ) : bankEntries.map(entry => {
                const qs = entry.worksheet.blocks.filter(b => PICKABLE.has(b.type))
                const open = expanded.has(entry.id)
                const nPicked = qs.filter(b => picked.has(pickKey(entry.id, b.id))).length
                return (
                  <div key={entry.id} className="xb-entry">
                    <button className="xb-entry-head" onClick={() => setExpanded(prev => { const n = new Set(prev); if (n.has(entry.id)) n.delete(entry.id); else n.add(entry.id); return n })}>
                      <span className={`xb-chevron${open ? ' xb-chevron--open' : ''}`}>▸</span>
                      <span className="xb-entry-title">{entry.title || 'Untitled'}</span>
                      {entry.spec_point && <span className="xb-tag">{entry.spec_point}</span>}
                      {bankSource === 'public' && <span className="xb-entry-by">{entry.author_name ? `by ${entry.author_name}` : 'anonymous'}</span>}
                      <span className="xb-entry-count">{nPicked ? `${nPicked} picked · ` : ''}{qs.length} question{qs.length === 1 ? '' : 's'}</span>
                    </button>
                    {open && (
                      <ul className="xb-entry-qs">
                        {qs.map(b => {
                          const key = pickKey(entry.id, b.id)
                          const m = computeBlockMarks(b)
                          return (
                            <li key={b.id}>
                              <label className={`xb-pick${picked.has(key) ? ' xb-pick--on' : ''}`}>
                                <input type="checkbox" checked={picked.has(key)} onChange={() => togglePick(entry, b)} />
                                <span className="xb-pick-type">{TYPE_LABEL[b.type]}</span>
                                <span className="xb-pick-text">{blockPreview(b)}</span>
                                {b.type === 'question' && b.parts.length > 0 && <span className="xb-pick-parts">{b.parts.length} parts</span>}
                                <span className="xb-pick-marks">{m} mark{m === 1 ? '' : 's'}</span>
                              </label>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )
              })}
            </section>

            <aside className="xb-summary">
              <h3>Your exam</h3>
              <p className="xb-summary-big">{pickedMarks}<span> marks</span></p>
              <p className="xb-summary-sub">{picks.length} question{picks.length === 1 ? '' : 's'} picked</p>
              {picks.length > 0 && (
                <ol className="xb-order">
                  {picks.map((p, i) => (
                    <li key={p.key}>
                      <span className="xb-order-num">{i + 1}</span>
                      <span className="xb-order-text" title={`From ${p.from}`}>{blockPreview(p.block)}</span>
                      <span className="xb-order-m">{computeBlockMarks(p.block)}</span>
                      <button aria-label="Move up" onClick={() => movePick(i, -1)} disabled={i === 0}>↑</button>
                      <button aria-label="Move down" onClick={() => movePick(i, 1)} disabled={i === picks.length - 1}>↓</button>
                      <button aria-label="Remove" onClick={() => setPicks(prev => prev.filter(x => x.key !== p.key))}>×</button>
                    </li>
                  ))}
                </ol>
              )}
              <label className="xb-field">
                <span>Target total marks <em>(optional)</em></span>
                <input type="number" min={0} value={bankTarget} onChange={e => setBankTarget(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Shown on the marks tracker" />
              </label>
              <button className="xb-btn xb-btn--wide" onClick={handleCreateFromBank}>
                {picks.length ? 'Create exam' : 'Start a blank exam'}
              </button>
              <p className="xb-summary-note">You can add, edit and reorder questions in the editor afterwards.</p>
              <button className="xb-btn xb-btn--ghost xb-btn--wide" onClick={() => setStep('source')}>Back</button>
            </aside>
          </div>
        )}
      </main>

      {generating && <GeneratingOverlay stage={generating} />}
    </div>
  )
}
