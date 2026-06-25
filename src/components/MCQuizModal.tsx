import { useState, useEffect, useRef } from 'react'
import type { Worksheet } from '../types/worksheet'
import './MCQuizModal.css'

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

function GeneratingScreen() {
  const [progress, setProgress] = useState(0)
  const [phraseIdx, setPhraseIdx] = useState(0)
  const shuffledRef = useRef<string[]>([...QUIZ_PHRASES].sort(() => Math.random() - 0.5))

  useEffect(() => {
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
        <p className="gen-phrase">{shuffledRef.current[phraseIdx]}</p>
        <div className="gen-bar-track">
          <div className="gen-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="gen-subtext">Usually takes 15–30 seconds</p>
      </div>
    </div>
  )
}

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
        if (mc.options && Array.isArray(mc.options)) {
          lines.push(`Options: ${(mc.options as string[]).join(' / ')}`)
        }
        if (mc.correctIndex !== undefined && mc.options && Array.isArray(mc.options)) {
          lines.push(`Correct: ${(mc.options as string[])[mc.correctIndex as number]}`)
        }
        break
      }
      case 'worked_example': {
        const we = block as unknown as Record<string, unknown>
        if (we.title) lines.push(`Worked example: ${we.title}`)
        if (we.steps && Array.isArray(we.steps)) {
          for (const s of we.steps as Record<string, unknown>[]) {
            if (s.text) lines.push(`Step: ${s.text}`)
          }
        }
        break
      }
      case 'cloze': {
        const cl = block as unknown as Record<string, unknown>
        if (cl.text) lines.push(`Cloze: ${cl.text}`)
        break
      }
      case 'match_them_up': {
        const mt = block as unknown as Record<string, unknown>
        if (mt.pairs && Array.isArray(mt.pairs)) {
          for (const p of mt.pairs as Record<string, unknown>[]) {
            if (p.term && p.definition) lines.push(`Match: ${p.term} → ${p.definition}`)
          }
        }
        break
      }
      case 'order_steps': {
        const os = block as unknown as Record<string, unknown>
        if (os.steps && Array.isArray(os.steps)) {
          lines.push(`Steps to order: ${(os.steps as string[]).join(' | ')}`)
        }
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

interface Props {
  worksheet: Worksheet
  onGenerate: (questionCount: number, versionCount: number, content: string) => Promise<void>
  onClose: () => void
  generating: boolean
}

export function MCQuizModal({ worksheet, onGenerate, onClose, generating }: Props) {
  const [questionCount, setQuestionCount] = useState(10)
  const [versionCount, setVersionCount] = useState(3)

  const header = worksheet.blocks.find(b => b.type === 'header') as Record<string, string> | undefined
  const title = header?.title || 'Untitled'

  async function handleGenerate() {
    const content = extractWorksheetContent(worksheet)
    await onGenerate(questionCount, versionCount, content)
  }

  if (generating) {
    return (
      <div className="mcq-modal-overlay">
        <div className="mcq-modal mcq-modal--generating">
          <GeneratingScreen />
        </div>
      </div>
    )
  }

  return (
    <div className="mcq-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="mcq-modal">
        <div className="mcq-modal-header">
          <h2 className="mcq-modal-title">Generate Follow-up Quiz</h2>
          <button className="mcq-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="mcq-modal-body">
          <p className="mcq-modal-desc">
            Create a multiple choice quiz based on <strong>{title}</strong>. Each version has shuffled question and answer order with a unique answer key and bubble sheet.
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
            Each version has a unique question order and answer key — students seated next to each other see different answer sequences.
          </p>
        </div>

        <div className="mcq-modal-footer">
          <button className="mcq-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="mcq-btn-generate" onClick={handleGenerate}>
            Generate {versionCount} version{versionCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
