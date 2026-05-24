import { useState } from 'react'
import type { Block, BlockType } from '../../types/worksheet'
import type { WorksheetAction } from '../../hooks/useWorksheet'
import { generateBlock } from '../../utils/generateWorksheet'
import './AddBlockMenu.css'

interface Props {
  afterId?: string
  dispatch: React.Dispatch<WorksheetAction>
  onAdded?: (id: string) => void
  worksheetContext?: string
}

const BLOCK_OPTIONS: { type: BlockType; label: string; description: string; color: string }[] = [
  { type: 'question',           label: 'Question',              description: 'Numbered question with answer lines',          color: '#16a34a' },
  { type: 'multiple_choice',    label: 'Multiple choice',       description: 'A–D options with one correct answer',          color: '#0891b2' },
  { type: 'cloze',              label: 'Cloze activity',        description: 'Fill-in-the-blanks with a word bank',          color: '#db2777' },
  { type: 'match_them_up',      label: 'Match them up',         description: 'Draw lines between terms and definitions',     color: '#7c3aed' },
  { type: 'order_steps',        label: 'Order the steps',       description: 'Sequence jumbled steps into correct order',    color: '#4338ca' },
  { type: 'information',        label: 'Information',           description: 'Highlighted background knowledge block',       color: '#b45309' },
  { type: 'worked_example',     label: 'Worked example',        description: 'Step-by-step model answer in a box',          color: '#c2410c' },
  { type: 'numerical_answers',  label: 'Numerical answers box', description: 'Scrambled numerical answers for self-checking',color: '#374151' },
  { type: 'figure',             label: 'Figure',                description: 'Diagram placeholder with caption',             color: '#475569' },
  { type: 'instructions',       label: 'Instructions',          description: 'Bulleted list of task instructions',           color: '#0369a1' },
  { type: 'spacer',             label: 'Spacer',                description: 'Blank vertical space',                         color: '#9ca3af' },
  { type: 'data',               label: 'Data table / graph',    description: 'Editable data table with optional graph view', color: '#0d9488' },
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
    case 'data':
      return { id, type: 'data', heading: 'Results', columns: [
        { label: 'x', unit: '' }, { label: 'y', unit: '' }
      ], rows: [['', ''], ['', ''], ['', ''], ['', '']], display: 'table',
      graph: { xCol: 0, yCol: 1, showXLabel: true, showYLabel: true, showXScale: true, showYScale: true, omitRows: [], fitType: 'none', showFitLine: true, linkedDataId: null }, hiddenCells: [] }
    case 'numerical_answers':
      return { id, type: 'numerical_answers', heading: 'Numerical answers' }
  }
}

interface AIFillState {
  blockType: BlockType
  request: string
  loading: boolean
  error: string | null
}

export function AddBlockMenu({ afterId, dispatch, onAdded, worksheetContext }: Props) {
  const [open, setOpen] = useState(false)
  const [aiFill, setAiFill] = useState<AIFillState | null>(null)

  function add(type: BlockType) {
    const block = makeBlock(type)
    dispatch({ type: 'ADD_BLOCK', block, afterId })
    onAdded?.(block.id)
    setOpen(false)
  }

  function startAIFill(type: BlockType, e: React.MouseEvent) {
    e.stopPropagation()
    setAiFill({ blockType: type, request: '', loading: false, error: null })
  }

  async function submitAIFill() {
    if (!aiFill || !aiFill.request.trim()) return
    setAiFill(s => s && { ...s, loading: true, error: null })
    try {
      const { block, attachedBlocks } = await generateBlock({
        blockType: aiFill.blockType,
        context: worksheetContext,
        request: aiFill.request,
      })
      for (const attached of attachedBlocks) {
        dispatch({ type: 'ADD_BLOCK', block: attached, afterId })
      }
      dispatch({ type: 'ADD_BLOCK', block, afterId })
      onAdded?.(block.id)
      setAiFill(null)
      setOpen(false)
    } catch (err) {
      setAiFill(s => s && { ...s, loading: false, error: err instanceof Error ? err.message : String(err) })
    }
  }

  const optLabel = BLOCK_OPTIONS.find(o => o.type === aiFill?.blockType)?.label ?? ''

  return (
    <div className="add-block-menu">
      <button type="button" className="add-block-trigger" onClick={() => { setOpen(o => !o); setAiFill(null) }}>
        + Add block
      </button>
      {open && (
        <>
          <div className="add-block-backdrop" onClick={() => { setOpen(false); setAiFill(null) }} />
          <div className="add-block-dropdown">
            {aiFill ? (
              /* AI fill sub-panel */
              <div className="add-block-ai-panel">
                <div className="add-block-ai-header">
                  <button type="button" className="add-block-ai-back" onClick={() => setAiFill(null)}>←</button>
                  <span>AI fill: <strong>{optLabel}</strong></span>
                </div>
                <textarea
                  className="add-block-ai-input"
                  rows={3}
                  placeholder={`Describe what this ${optLabel.toLowerCase()} should contain…`}
                  value={aiFill.request}
                  onChange={e => setAiFill(s => s && { ...s, request: e.target.value })}
                  disabled={aiFill.loading}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitAIFill() }}
                />
                {aiFill.error && <p className="add-block-ai-error">{aiFill.error}</p>}
                <button
                  type="button"
                  className="add-block-ai-submit"
                  onClick={submitAIFill}
                  disabled={!aiFill.request.trim() || aiFill.loading}
                >
                  {aiFill.loading
                    ? <><span className="add-block-ai-spinner" /> Generating…</>
                    : '✦ Generate block'
                  }
                </button>
              </div>
            ) : (
              /* Normal block list */
              BLOCK_OPTIONS.map(opt => (
                <div key={opt.type} className="add-block-row">
                  <button
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
                  <button
                    type="button"
                    className="add-block-ai-btn"
                    title={`Fill ${opt.label} with AI`}
                    onClick={e => startAIFill(opt.type, e)}
                  >
                    ✦
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
