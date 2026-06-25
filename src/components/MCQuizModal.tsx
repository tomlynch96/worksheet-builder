import { useState, useEffect, useRef } from 'react'
import type { Worksheet } from '../types/worksheet'
import type { MCQuestion } from '../types/mcQuiz'
import './MCQuizModal.css'

// ── Loading screen ────────────────────────────────────────────────────────────

const QUIZ_PHRASES = [
  'Analysing worksheet content…',
  'Identifying key concepts…',
  'Crafting plausible distractors…',
  'Varying question difficulty…',
  'Checking scientific accuracy…',
  'Shuffling answer orders…',
  'Building version answer keys…',
  'Reviewing question stems…',
  'Applying exam board style…',
  'Finalising question set…',
]

function GeneratingScreen({ label }: { label?: string }) {
  const [progress, setProgress] = useState(0)
  const [phraseIdx, setPhraseIdx] = useState(0)
  const shuffledRef = useRef<string[]>([...QUIZ_PHRASES].sort(() => Math.random() - 0.5))

  useEffect(() => {
    setProgress(0)
    const progressTimer = setInterval(() => {
      setProgress(p => Math.min(p + 100 / 56, 95))
    }, 500)
    const phraseTimer = setInterval(() => {
      setPhraseIdx(i => (i + 1) % shuffledRef.current.length)
    }, 3000)
    return () => { clearInterval(progressTimer); clearInterval(phraseTimer) }
  }, [])

  return (
    <div className="gen-screen">
      <img src="/paper_blowaway_large.svg" className="gen-logo" alt="" />
      <div className="gen-content">
        <p className="gen-phrase">{label ?? shuffledRef.current[phraseIdx]}</p>
        <div className="gen-bar-track">
          <div className="gen-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="gen-subtext">Usually takes 15–30 seconds</p>
      </div>
    </div>
  )
}

// ── Worksheet content extractor ───────────────────────────────────────────────

function extractWorksheetContent(worksheet: Worksheet): string {
  const lines: string[] = []
  for (const block of worksheet.blocks) {
    switch (block.type) {
      case 'header':
        if ('title' in block) lines.push(`Title: ${block.title}`)
        if ('topic' in block) lines.push(`Topic: ${block.topic}`)
        break
      case 'information':
        if ('html' in block) {
          const text = String(block.html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          if (text) lines.push(`Information: ${text}`)
        }
        break
      case 'question': {
        const q = block as unknown as Record<string, unknown>
        if (q.parts && Array.isArray(q.parts)) {
          for (const p of q.parts as Record<string, unknown>[]) {
            if (p.text) lines.push(`Question: ${p.text}`)
            if (p.markScheme) lines.push(`Answer: ${p.markScheme}`)
          }
        } else {
          if (q.text) lines.push(`Question: ${q.text}`)
          if (q.markScheme) lines.push(`Answer: ${q.markScheme}`)
        }
        break
      }
      case 'multiple_choice': {
        const mc = block as unknown as Record<string, unknown>
        if (mc.question) lines.push(`MCQ: ${mc.question}`)
        if (mc.options && Array.isArray(mc.options)) lines.push(`Options: ${(mc.options as string[]).join(' / ')}`)
        if (mc.correctIndex !== undefined && mc.options && Array.isArray(mc.options))
          lines.push(`Correct: ${(mc.options as string[])[mc.correctIndex as number]}`)
        break
      }
      case 'worked_example': {
        const we = block as unknown as Record<string, unknown>
        if (we.title) lines.push(`Worked example: ${we.title}`)
        if (we.steps && Array.isArray(we.steps))
          for (const s of we.steps as Record<string, unknown>[])
            if (s.text) lines.push(`Step: ${s.text}`)
        break
      }
      case 'cloze': {
        const cl = block as unknown as Record<string, unknown>
        if (cl.text) lines.push(`Cloze: ${cl.text}`)
        break
      }
      case 'match_them_up': {
        const mt = block as unknown as Record<string, unknown>
        if (mt.pairs && Array.isArray(mt.pairs))
          for (const p of mt.pairs as Record<string, unknown>[])
            if (p.term && p.definition) lines.push(`Match: ${p.term} → ${p.definition}`)
        break
      }
      case 'order_steps': {
        const os = block as unknown as Record<string, unknown>
        if (os.steps && Array.isArray(os.steps))
          lines.push(`Steps to order: ${(os.steps as string[]).join(' | ')}`)
        break
      }
      case 'data': {
        const dt = block as unknown as Record<string, unknown>
        if (dt.title) lines.push(`Data table: ${dt.title}`)
        break
      }
    }
  }
  return lines.join('\n')
}

// ── API helper ────────────────────────────────────────────────────────────────

async function fetchQuestions(payload: {
  worksheetContent: string
  questionCount: number
  title: string
  topic: string
  examBoard: string
  tier: string
  replaceContext?: string
}): Promise<MCQuestion[]> {
  const res = await fetch('/api/generate-mc-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error || `API error ${res.status}`)
  }
  const { questions } = await res.json() as { questions: MCQuestion[] }
  return questions
}

// ── Review stage: single question card ───────────────────────────────────────

function QuestionCard({
  question,
  index,
  replacing,
  onUpdate,
  onReplace,
}: {
  question: MCQuestion
  index: number
  replacing: boolean
  onUpdate: (q: MCQuestion) => void
  onReplace: () => void
}) {
  function updateText(text: string) {
    onUpdate({ ...question, text })
  }

  function updateOption(optIdx: number, value: string) {
    const options = [...question.options]
    options[optIdx] = value
    onUpdate({ ...question, options })
  }

  function markCorrect(optIdx: number) {
    // Swap chosen option to position 0 (canonical correct)
    const options = [...question.options]
    ;[options[0], options[optIdx]] = [options[optIdx], options[0]]
    onUpdate({ ...question, options })
  }

  return (
    <div className={`mcq-review-card${replacing ? ' mcq-review-card--replacing' : ''}`}>
      <div className="mcq-review-card-top">
        <span className="mcq-review-qnum">Q{index + 1}</span>
        <textarea
          className="mcq-review-qtext"
          value={question.text}
          rows={2}
          onChange={e => updateText(e.target.value)}
          disabled={replacing}
        />
        <button
          className="mcq-review-replace-btn"
          onClick={onReplace}
          disabled={replacing}
          title="Generate a new question in place of this one"
        >
          {replacing ? <span className="mcq-replace-spinner" /> : '↺ Replace'}
        </button>
      </div>

      <div className="mcq-review-options">
        {question.options.map((opt, oi) => (
          <div key={oi} className={`mcq-review-option${oi === 0 ? ' mcq-review-option--correct' : ''}`}>
            <span className="mcq-review-option-badge">
              {oi === 0 ? '✓' : '○'}
            </span>
            <input
              className="mcq-review-option-input"
              value={opt}
              onChange={e => updateOption(oi, e.target.value)}
              disabled={replacing}
            />
            {oi !== 0 && (
              <button
                className="mcq-review-mark-correct"
                onClick={() => markCorrect(oi)}
                disabled={replacing}
                title="Make this the correct answer"
              >
                Mark correct
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

interface Props {
  worksheet: Worksheet
  onConfirm: (questions: MCQuestion[], questionCount: number, versionCount: number) => Promise<void>
  onClose: () => void
  saving: boolean
}

export function MCQuizModal({ worksheet, onConfirm, onClose, saving }: Props) {
  const [stage, setStage] = useState<'config' | 'generating' | 'review'>('config')
  const [questionCount, setQuestionCount] = useState(10)
  const [versionCount, setVersionCount] = useState(3)
  const [draftQuestions, setDraftQuestions] = useState<MCQuestion[]>([])
  const [replacingIdx, setReplacingIdx] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const header = worksheet.blocks.find(b => b.type === 'header') as Record<string, string> | undefined
  const title = header?.title || 'Untitled'
  const worksheetContent = extractWorksheetContent(worksheet)
  const basePayload = {
    worksheetContent,
    title,
    topic: header?.topic || '',
    examBoard: header?.examBoard || 'AQA',
    tier: header?.tier || 'higher',
  }

  async function handleGenerate() {
    setError(null)
    setStage('generating')
    try {
      const questions = await fetchQuestions({ ...basePayload, questionCount })
      setDraftQuestions(questions)
      setStage('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setStage('config')
    }
  }

  async function handleReplace(idx: number) {
    setReplacingIdx(idx)
    try {
      const otherTexts = draftQuestions
        .filter((_, i) => i !== idx)
        .map((q, i) => `Q${i + 1}: ${q.text}`)
        .join('\n')
      const replaceContext = `Generate exactly 1 replacement question. The other questions already cover:\n${otherTexts}\nThe replacement must test a DIFFERENT concept not already assessed.`
      const [replacement] = await fetchQuestions({ ...basePayload, questionCount: 1, replaceContext })
      setDraftQuestions(prev => prev.map((q, i) => i === idx ? { ...replacement, id: q.id } : q))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Replace failed')
    } finally {
      setReplacingIdx(null)
    }
  }

  function updateQuestion(idx: number, q: MCQuestion) {
    setDraftQuestions(prev => prev.map((old, i) => i === idx ? q : old))
  }

  async function handleConfirm() {
    await onConfirm(draftQuestions, questionCount, versionCount)
  }

  // ── Config stage ─────────────────────────────────────────────────────────
  if (stage === 'config') {
    return (
      <div className="mcq-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="mcq-modal">
          <div className="mcq-modal-header">
            <h2 className="mcq-modal-title">Generate Follow-up Quiz</h2>
            <button className="mcq-modal-close" onClick={onClose}>✕</button>
          </div>

          <div className="mcq-modal-body">
            {error && <p className="mcq-error">{error}</p>}
            <p className="mcq-modal-desc">
              Create a multiple choice quiz based on <strong>{title}</strong>. You'll be able to review and edit each question before saving.
            </p>

            <div className="mcq-modal-fields">
              <div className="mcq-field">
                <label className="mcq-label">Number of questions</label>
                <div className="mcq-stepper">
                  <button onClick={() => setQuestionCount(n => Math.max(4, n - 1))}>−</button>
                  <span className="mcq-stepper-val">{questionCount}</span>
                  <button onClick={() => setQuestionCount(n => Math.min(30, n + 1))}>+</button>
                </div>
              </div>

              <div className="mcq-field">
                <label className="mcq-label">Number of versions</label>
                <div className="mcq-stepper">
                  <button onClick={() => setVersionCount(n => Math.max(1, n - 1))}>−</button>
                  <span className="mcq-stepper-val">{versionCount}</span>
                  <button onClick={() => setVersionCount(n => Math.min(8, n + 1))}>+</button>
                </div>
              </div>
            </div>

            <p className="mcq-modal-hint">
              Each version shuffles question order and answer positions — students next to each other see different answer sequences.
            </p>
          </div>

          <div className="mcq-modal-footer">
            <button className="mcq-btn-cancel" onClick={onClose}>Cancel</button>
            <button className="mcq-btn-generate" onClick={handleGenerate}>
              Generate {questionCount} questions →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Generating stage ──────────────────────────────────────────────────────
  if (stage === 'generating') {
    return (
      <div className="mcq-modal-overlay">
        <div className="mcq-modal mcq-modal--generating">
          <GeneratingScreen />
        </div>
      </div>
    )
  }

  // ── Review stage ──────────────────────────────────────────────────────────
  return (
    <div className="mcq-modal-overlay">
      <div className="mcq-modal mcq-modal--review">
        <div className="mcq-modal-header">
          <div>
            <h2 className="mcq-modal-title">Review Questions</h2>
            <p className="mcq-review-subtitle">Edit questions, swap options, or replace individual questions before saving.</p>
          </div>
          <button className="mcq-modal-close" onClick={onClose} disabled={saving}>✕</button>
        </div>

        <div className="mcq-review-body">
          {draftQuestions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              replacing={replacingIdx === i}
              onUpdate={updated => updateQuestion(i, updated)}
              onReplace={() => handleReplace(i)}
            />
          ))}
        </div>

        <div className="mcq-modal-footer">
          <button className="mcq-btn-cancel" onClick={() => setStage('config')} disabled={saving || replacingIdx !== null}>
            ← Back
          </button>
          <button
            className="mcq-btn-generate"
            onClick={handleConfirm}
            disabled={saving || replacingIdx !== null}
          >
            {saving ? 'Saving…' : `Save quiz · ${versionCount} version${versionCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
