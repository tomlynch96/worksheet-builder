import { useState } from 'react'
import type { MCQuestion } from '../types/mcQuiz'
import { GeneratingScreen, QuestionCard } from './mcQuiz/QuizReviewShared'
import './MCQuizModal.css'
import './FollowUpModal.css'

// Vercel serverless functions hard-cap the request body at 4.5MB, and base64 inflates
// the raw file size by ~33% once wrapped in the JSON payload — cap well under that.
const MAX_FILE_BYTES = 3 * 1024 * 1024
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png',
  'image/webp',
]

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function describeGenerationError(err: unknown): string {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return 'Could not reach the server — the file may be too large, or your connection dropped. Try a smaller file.'
  }
  return err instanceof Error ? err.message : 'Generation failed'
}

async function fetchQuestions(payload: {
  fileBase64: string
  mimeType: string
  title: string
  questionCount: number
  replaceContext?: string
}): Promise<MCQuestion[]> {
  const res = await fetch('/api/generate-follow-up-quiz', {
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

interface Props {
  onConfirm: (
    title: string,
    questions: MCQuestion[],
    questionCount: number,
    versionCount: number,
    sourceFile: { file: File; base64: string; mimeType: string },
  ) => Promise<void>
  onClose: () => void
  saving: boolean
}

export function FollowUpModal({ onConfirm, onClose, saving }: Props) {
  const [stage, setStage] = useState<'upload' | 'generating' | 'review'>('upload')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(10)
  const [versionCount, setVersionCount] = useState(3)
  const [draftQuestions, setDraftQuestions] = useState<MCQuestion[]>([])
  const [replacingIdx, setReplacingIdx] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    setError(null)
    setFile(null)
    setFileBase64(null)
    if (!f) return
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Unsupported file type — please upload a PDF, Word document, or image.')
      return
    }
    if (f.size > MAX_FILE_BYTES) {
      setError(`File too large — please keep uploads under ${MAX_FILE_BYTES / (1024 * 1024)}MB.`)
      return
    }
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
  }

  async function handleGenerate() {
    if (!file) return
    setError(null)
    setStage('generating')
    try {
      const base64 = await readFileAsBase64(file)
      setFileBase64(base64)
      const questions = await fetchQuestions({
        fileBase64: base64,
        mimeType: file.type,
        title: title || file.name,
        questionCount,
      })
      setDraftQuestions(questions)
      setStage('review')
    } catch (err) {
      setError(describeGenerationError(err))
      setStage('upload')
    }
  }

  async function handleReplace(idx: number) {
    if (!file || !fileBase64) return
    setReplacingIdx(idx)
    try {
      const otherTexts = draftQuestions
        .filter((_, i) => i !== idx)
        .map((q, i) => `Q${i + 1}: ${q.text}`)
        .join('\n')
      const replaceContext = `Generate exactly 1 replacement question. The other questions already cover:\n${otherTexts}\nThe replacement must test a DIFFERENT concept not already assessed.`
      const [replacement] = await fetchQuestions({
        fileBase64,
        mimeType: file.type,
        title: title || file.name,
        questionCount: 1,
        replaceContext,
      })
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
    if (!file || !fileBase64) return
    await onConfirm(title || file.name, draftQuestions, questionCount, versionCount, {
      file,
      base64: fileBase64,
      mimeType: file.type,
    })
  }

  // ── Upload stage ─────────────────────────────────────────────────────────
  if (stage === 'upload') {
    return (
      <div className="mcq-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="mcq-modal">
          <div className="mcq-modal-header">
            <h2 className="mcq-modal-title">New Follow Up</h2>
            <button className="mcq-modal-close" onClick={onClose}>✕</button>
          </div>

          <div className="mcq-modal-body">
            {error && <p className="mcq-error">{error}</p>}
            <p className="mcq-modal-desc">
              Upload a PDF, Word document, or image and get a multiple choice follow-up quiz built from its content.
            </p>

            <div className="fu-field">
              <label className="mcq-label">Title</label>
              <input
                className="fu-title-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Electromagnetic waves — homework sheet"
              />
            </div>

            <div className="fu-field">
              <label className="mcq-label">Document</label>
              <input
                className="fu-file-input"
                type="file"
                accept=".pdf,.docx,.doc,image/*"
                onChange={handleFileChange}
              />
              {file && <p className="fu-file-name">{file.name}</p>}
            </div>

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
          </div>

          <div className="mcq-modal-footer">
            <button className="mcq-btn-cancel" onClick={onClose}>Cancel</button>
            <button className="mcq-btn-generate" onClick={handleGenerate} disabled={!file}>
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
          <button className="mcq-btn-cancel" onClick={() => setStage('upload')} disabled={saving || replacingIdx !== null}>
            ← Back
          </button>
          <button
            className="mcq-btn-generate"
            onClick={handleConfirm}
            disabled={saving || replacingIdx !== null}
          >
            {saving ? 'Saving…' : `Save follow up · ${versionCount} version${versionCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
