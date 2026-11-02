import type { Block, HeaderBlock } from '../../types/worksheet'
import { questionMarksList } from '../../utils/marks'
import './ExamMarksNav.css'

interface Props {
  blocks: Block[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const TYPE_LABEL: Partial<Record<Block['type'], string>> = {
  multiple_choice: 'MCQ',
  match_them_up: 'Match',
  cloze: 'Cloze',
  order_steps: 'Order',
}

// Floating running total of an exam's marks; the per-question breakdown opens on hover/focus.
export function ExamMarksNav({ blocks, selectedId, onSelect }: Props) {
  const header = blocks.find(b => b.type === 'header') as HeaderBlock | undefined
  const questions = questionMarksList(blocks)
  const total = questions.reduce((s, q) => s + q.marks, 0)
  const target = header?.exam?.targetMarks
  const diff = target ? total - target : 0

  function jump(id: string) {
    onSelect(id)
    document.querySelector(`.panel-preview [data-block-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <nav className="exam-nav" aria-label="Exam marks">
      <div
        className={`exam-nav-total${target && diff !== 0 ? (diff > 0 ? ' exam-nav-total--over' : ' exam-nav-total--under') : ''}`}
        tabIndex={0}
        title="Hover to see marks per question"
      >
        <span className="exam-nav-total-num">{total}</span>
        <span className="exam-nav-total-label">marks{target ? ` / ${target}` : ''}</span>
      </div>
      <div className="exam-nav-breakdown">
        {target && diff !== 0 && (
          <div className={`exam-nav-diff${diff > 0 ? ' exam-nav-diff--over' : ''}`}>
            {diff > 0 ? `${diff} over target` : `${-diff} under target`}
          </div>
        )}
        <ol className="exam-nav-list">
          {questions.length === 0 && <li className="exam-nav-empty">No questions yet</li>}
          {questions.map(q => (
            <li key={q.id}>
              <button
                className={`exam-nav-row${q.id === selectedId ? ' exam-nav-row--active' : ''}`}
                onClick={e => {
                  jump(q.id)
                  // Mouse clicks shouldn't pin the breakdown open; keyboard focus still does
                  if (e.detail > 0) e.currentTarget.blur()
                }}
              >
                <span className="exam-nav-q">Q{q.num}{TYPE_LABEL[q.type] ? <small> {TYPE_LABEL[q.type]}</small> : null}</span>
                <span className="exam-nav-m">{q.marks}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}
