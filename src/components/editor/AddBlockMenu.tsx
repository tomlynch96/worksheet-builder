import { useState } from 'react'
import type { Block, BlockType } from '../../types/worksheet'
import type { WorksheetAction } from '../../hooks/useWorksheet'
import './AddBlockMenu.css'

interface Props {
  afterId?: string
  dispatch: React.Dispatch<WorksheetAction>
  onAdded?: (id: string) => void
}

const BLOCK_OPTIONS: { type: BlockType; label: string; description: string; color: string }[] = [
  { type: 'question',        label: 'Question',         description: 'Numbered question with answer lines',         color: '#16a34a' },
  { type: 'multiple_choice', label: 'Multiple choice',  description: 'A–D options with one correct answer',         color: '#0891b2' },
  { type: 'cloze',           label: 'Cloze activity',   description: 'Fill-in-the-blanks with a word bank',          color: '#db2777' },
  { type: 'match_them_up',   label: 'Match them up',    description: 'Draw lines between terms and definitions',     color: '#7c3aed' },
  { type: 'order_steps',     label: 'Order the steps',  description: 'Sequence jumbled steps into correct order',    color: '#4338ca' },
  { type: 'information',     label: 'Information',      description: 'Highlighted background knowledge block',       color: '#b45309' },
  { type: 'worked_example',  label: 'Worked example',   description: 'Step-by-step model answer in a box',           color: '#c2410c' },
  { type: 'figure',          label: 'Figure',           description: 'Diagram placeholder with caption',             color: '#475569' },
  { type: 'instructions',    label: 'Instructions',     description: 'Bulleted list of task instructions',           color: '#0369a1' },
  { type: 'spacer',          label: 'Spacer',           description: 'Blank vertical space',                         color: '#9ca3af' },
]

function makeBlock(type: BlockType): Block {
  const id = crypto.randomUUID()
  switch (type) {
    case 'header':
      return { id, type, title: 'Worksheet Title', topic: 'Topic', examBoard: 'AQA', tier: 'higher', showName: true, showDate: true, showClass: true }
    case 'instructions':
      return { id, type, items: ['Answer all questions.'] }
    case 'question':
      return { id, type, stem: '', marks: 2, lines: 4, parts: [] }
    case 'multiple_choice':
      return { id, type, stem: '', marks: 1, options: ['', '', '', ''], correctIndex: 0 }
    case 'worked_example':
      return { id, type, title: 'Worked example', steps: ['', ''] }
    case 'figure':
      return { id, type, caption: '', size: 'medium' }
    case 'spacer':
      return { id, type, size: 'medium' }
    case 'information':
      return { id, type, heading: 'Key information', content: '' }
    case 'match_them_up':
      return { id, type, heading: 'Match each term to its correct definition.', items: [
        { id: crypto.randomUUID(), left: '', right: '' },
        { id: crypto.randomUUID(), left: '', right: '' },
        { id: crypto.randomUUID(), left: '', right: '' },
      ]}
    case 'cloze':
      return { id, type, heading: 'Fill in the blanks using the words in the box.', text: '', showWordBank: true }
    case 'order_steps':
      return { id, type, heading: 'Number these steps 1 to … in the correct order.', steps: ['', '', ''] }
  }
}

export function AddBlockMenu({ afterId, dispatch, onAdded }: Props) {
  const [open, setOpen] = useState(false)

  function add(type: BlockType) {
    const block = makeBlock(type)
    dispatch({ type: 'ADD_BLOCK', block, afterId })
    onAdded?.(block.id)
    setOpen(false)
  }

  return (
    <div className="add-block-menu">
      <button type="button" className="add-block-trigger" onClick={() => setOpen(o => !o)}>
        + Add block
      </button>
      {open && (
        <>
          <div className="add-block-backdrop" onClick={() => setOpen(false)} />
          <div className="add-block-dropdown">
            {BLOCK_OPTIONS.map(opt => (
              <button
                key={opt.type}
                type="button"
                className="add-block-option"
                onClick={() => add(opt.type)}
              >
                <span className="add-block-dot" style={{ background: opt.color }} />
                <span className="add-block-info">
                  <span className="add-block-name">{opt.label}</span>
                  <span className="add-block-desc">{opt.description}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
