import { useState, useEffect, useCallback, useRef } from 'react'
import './TutorialWizard.css'

export const TUTORIAL_KEY = 'wb_tutorial_v1'

interface StepDef {
  targetId?: string
  icon: string
  color: string
  bg: string
  title: string
  body: string
  // If set, the wizard auto-advances when this selector appears in the DOM
  autoAdvanceSelector?: string
  // If set, Next button stays disabled until this selector appears in the DOM
  waitSelector?: string
  waitPrompt?: string
}

const STEPS: StepDef[] = [
  {
    targetId: 'add-block',
    icon: '+',
    color: '#4f46e5',
    bg: '#eef2ff',
    title: 'Add a block',
    body: 'Click "+ Add block" at the bottom of the editor panel to open the block menu.',
    autoAdvanceSelector: '[data-tutorial-id="block-option-question"]',
  },
  {
    targetId: 'block-option-question',
    icon: '+',
    color: '#4f46e5',
    bg: '#eef2ff',
    title: 'Select Question',
    body: 'Click "Question" to add your first question block to the worksheet.',
    autoAdvanceSelector: '.pr-question',
  },
  {
    targetId: 'ai-fill',
    icon: '✦',
    color: '#7c3aed',
    bg: '#f5f3ff',
    title: 'AI fill',
    body: 'Select a block, then click ✦ to ask AI to fill or rewrite it. Describe what you want and AI generates the content. Perfect for rapid iteration on individual questions.',
  },
  {
    targetId: 'make-similar',
    icon: '↳',
    color: '#16a34a',
    bg: '#f0fdf4',
    title: 'Make a similar question',
    body: 'Click ↳ to generate a new question of the same type and difficulty, inserted directly below. Great for building sets of practice questions quickly.',
  },
  {
    targetId: 'add-worked-example',
    icon: 'WE',
    color: '#c2410c',
    bg: '#fff7ed',
    title: 'Add a worked example',
    body: 'On question blocks, click WE to insert an AI-generated worked example immediately above the question — matched to the topic and level.',
  },
  {
    targetId: 'attach-graph',
    icon: '⊞',
    color: '#0d9488',
    bg: '#f0fdfa',
    title: 'Attach a graph or figure',
    body: 'Click "+ Attach" inside a question\'s editor to add a graph, data table, or figure inline. You can also drag a standalone Figure or Data/Graph block onto a question in the preview panel — it will print alongside that question\'s answer space.',
  },
  {
    targetId: 'math-editor',
    icon: 'Σ',
    color: '#1e3a5f',
    bg: '#eff6ff',
    title: 'Equation editor',
    body: 'Click any text field to start editing, then click Σ in the formatting bar to open the LaTeX equation editor. Type equations like "E=mc^2" or "\\frac{v}{t}" and they render as typeset maths.',
  },
  {
    targetId: 'symbol-picker',
    icon: 'Ω',
    color: '#374151',
    bg: '#f9fafb',
    title: 'Symbol picker',
    body: 'Click Ω in the text formatting bar to insert Greek letters and science symbols — α, β, Δ, →, ⁻¹, × — without memorising keyboard shortcuts.',
  },
  {
    targetId: 'chem-editor',
    icon: '⚗',
    color: '#047857',
    bg: '#ecfdf5',
    title: 'Chemical formula editor',
    body: 'Click ⚗ in the text formatting bar to type properly formatted chemical equations: "H_{2}SO_{4}", "2H_{2} + O_{2} -> 2H_{2}O". Uses standard mhchem notation.',
  },
]

function getTargetRect(targetId?: string): DOMRect | null {
  if (!targetId) return null
  const el = document.querySelector(`[data-tutorial-id="${targetId}"]`)
  return el ? el.getBoundingClientRect() : null
}

const CARD_W = 320

function computeCardPos(rect: DOMRect): { top: number; left: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const GAP = 16

  const cx = rect.left + rect.width / 2
  const left = Math.min(Math.max(cx - CARD_W / 2, GAP), vw - CARD_W - GAP)

  if (rect.bottom + GAP + 260 < vh) {
    return { top: rect.bottom + GAP, left }
  }
  return { top: Math.max(rect.top - GAP - 260, GAP), left }
}

interface Props {
  open: boolean
  onClose: () => void
}

export function TutorialWizard({ open, onClose }: Props) {
  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [waitMet, setWaitMet] = useState(false)
  // Baseline element count captured when a step activates — auto-advance only
  // triggers when the count *increases*, so pre-existing elements don't fire it.
  const baselineCountRef = useRef(0)

  const step = STEPS[stepIdx]
  const total = STEPS.length

  const refreshRect = useCallback(() => {
    setRect(getTargetRect(step.targetId))
  }, [step.targetId])

  useEffect(() => {
    if (!open) return
    setStepIdx(0)
    setWaitMet(false)
  }, [open])

  // Capture baseline count whenever the step changes
  useEffect(() => {
    if (!open) return
    setWaitMet(false)
    const sel = step.autoAdvanceSelector ?? step.waitSelector
    baselineCountRef.current = sel ? document.querySelectorAll(sel).length : 0
    const t = setTimeout(refreshRect, 60)
    return () => clearTimeout(t)
  }, [open, stepIdx, refreshRect, step.autoAdvanceSelector, step.waitSelector])

  useEffect(() => {
    window.addEventListener('resize', refreshRect)
    return () => window.removeEventListener('resize', refreshRect)
  }, [refreshRect])

  // Poll for autoAdvance and waitSelector on the current step
  useEffect(() => {
    if (!open) return
    if (!step.autoAdvanceSelector && !step.waitSelector) return

    const id = setInterval(() => {
      if (step.autoAdvanceSelector) {
        const count = document.querySelectorAll(step.autoAdvanceSelector).length
        if (count > baselineCountRef.current) {
          setStepIdx(s => s + 1)
          setWaitMet(false)
          clearInterval(id)
        }
        return
      }
      if (step.waitSelector) {
        const count = document.querySelectorAll(step.waitSelector).length
        if (count > baselineCountRef.current) setWaitMet(true)
      }
    }, 150)

    return () => clearInterval(id)
  }, [open, step.autoAdvanceSelector, step.waitSelector, stepIdx])

  // Re-measure rect whenever stepIdx changes
  useEffect(() => {
    const t = setTimeout(refreshRect, 80)
    return () => clearTimeout(t)
  }, [stepIdx, refreshRect])

  if (!open) return null

  const nextBlocked = !!step.waitSelector && !waitMet
  const cardPos = rect ? computeCardPos(rect) : null

  function next() {
    if (stepIdx < total - 1) {
      setStepIdx(s => s + 1)
      setWaitMet(false)
    } else {
      onClose()
    }
  }

  function prev() {
    if (stepIdx > 0) {
      setStepIdx(s => s - 1)
      setWaitMet(false)
    }
  }

  return (
    <>
      {rect ? (
        <div
          className="tutorial-spotlight"
          style={{
            top: rect.top - 5,
            left: rect.left - 5,
            width: rect.width + 10,
            height: rect.height + 10,
          }}
        />
      ) : (
        <div className="tutorial-overlay" />
      )}

      <div
        className={`tutorial-card${rect ? ' tutorial-card--anchored' : ' tutorial-card--centered'}`}
        style={cardPos ? { top: cardPos.top, left: cardPos.left } : undefined}
      >
        <div className="tutorial-progress">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`tutorial-dot${i === stepIdx ? ' tutorial-dot--active' : i < stepIdx ? ' tutorial-dot--done' : ''}`}
            />
          ))}
        </div>

        <div className="tutorial-top">
          <div className="tutorial-icon" style={{ background: step.bg, color: step.color }}>
            {step.icon}
          </div>
          <div className="tutorial-step-label">{stepIdx + 1} / {total}</div>
        </div>

        <h3 className="tutorial-title">{step.title}</h3>
        <p className="tutorial-body">{step.body}</p>

        <div className="tutorial-actions">
          <button className="tutorial-skip" onClick={onClose}>
            {stepIdx === total - 1 ? 'Done' : 'Skip'}
          </button>
          <div className="tutorial-nav">
            {stepIdx > 0 && (
              <button className="tutorial-btn tutorial-btn--prev" onClick={prev}>← Back</button>
            )}
            {/* Hide Next on auto-advance steps — the action itself moves things forward */}
            {!step.autoAdvanceSelector && (
              <button
                className={`tutorial-btn tutorial-btn--next${nextBlocked ? ' tutorial-btn--waiting' : ''}`}
                onClick={nextBlocked ? undefined : next}
                disabled={nextBlocked}
                title={nextBlocked ? (step.waitPrompt ?? 'Complete the action first') : undefined}
              >
                {nextBlocked
                  ? (step.waitPrompt ?? 'Waiting…')
                  : stepIdx < total - 1 ? 'Next →' : 'Finish ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
