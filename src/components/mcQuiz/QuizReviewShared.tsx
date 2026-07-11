import { useState, useEffect, useRef } from 'react'
import type { MCQuestion } from '../../types/mcQuiz'
import '../MCQuizModal.css'

const QUIZ_PHRASES = [
  'Analysing content…',
  'Identifying key concepts…',
  'Crafting plausible distractors…',
  'Varying question difficulty…',
  'Checking accuracy…',
  'Shuffling answer orders…',
  'Building version answer keys…',
  'Reviewing question stems…',
  'Applying exam board style…',
  'Finalising question set…',
]

export function GeneratingScreen({ label }: { label?: string }) {
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

export function QuestionCard({
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
