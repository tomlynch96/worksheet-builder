import type { Worksheet, BlockType } from '../../types/worksheet'
import type { WorksheetAction } from '../../hooks/useWorksheet'
import { BlockEditor } from './BlockEditor'
import { AddBlockMenu } from './AddBlockMenu'
import './Editor.css'

const BLOCK_LABELS: Record<BlockType, string> = {
  header:          'Header',
  instructions:    'Instructions',
  question:        'Question',
  multiple_choice: 'Multiple Choice',
  worked_example:  'Worked Example',
  information:     'Information',
  match_them_up:   'Match Them Up',
  cloze:           'Cloze Activity',
  order_steps:     'Order the Steps',
  figure:          'Figure',
  spacer:          'Spacer',
}

const BLOCK_COLORS: Record<BlockType, string> = {
  header:          '#1e3a5f',
  instructions:    '#0369a1',
  question:        '#16a34a',
  multiple_choice: '#0891b2',
  worked_example:  '#c2410c',
  information:     '#b45309',
  match_them_up:   '#7c3aed',
  cloze:           '#db2777',
  order_steps:     '#4338ca',
  figure:          '#475569',
  spacer:          '#9ca3af',
}

interface Props {
  worksheet: Worksheet
  dispatch: React.Dispatch<WorksheetAction>
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function Editor({ worksheet, dispatch, selectedId, onSelect }: Props) {
  const { blocks } = worksheet

  return (
    <div className="editor">
      <div className="editor-blocks">
        {blocks.map((block, idx) => {
          const isSelected = block.id === selectedId
          const color = BLOCK_COLORS[block.type]
          const isFirst = idx === 0
          const isLast = idx === blocks.length - 1

          return (
            <div
              key={block.id}
              className={`editor-block ${isSelected ? 'editor-block--selected' : ''}`}
              style={{ '--block-color': color } as React.CSSProperties}
            >
              <div className="editor-block-header" onClick={() => onSelect(isSelected ? null : block.id)}>
                <span className="editor-block-type">{BLOCK_LABELS[block.type]}</span>
                <div className="editor-block-controls">
                  <button
                    type="button"
                    className="ctrl-btn"
                    disabled={isFirst}
                    onClick={e => { e.stopPropagation(); dispatch({ type: 'MOVE_BLOCK', id: block.id, direction: 'up' }) }}
                    aria-label="Move up"
                  >↑</button>
                  <button
                    type="button"
                    className="ctrl-btn"
                    disabled={isLast}
                    onClick={e => { e.stopPropagation(); dispatch({ type: 'MOVE_BLOCK', id: block.id, direction: 'down' }) }}
                    aria-label="Move down"
                  >↓</button>
                  <button
                    type="button"
                    className="ctrl-btn ctrl-btn--danger"
                    onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_BLOCK', id: block.id }); onSelect(null) }}
                    aria-label="Delete block"
                  >×</button>
                </div>
              </div>

              {isSelected && (
                <div className="editor-block-body">
                  <BlockEditor block={block} dispatch={dispatch} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="editor-footer">
        <AddBlockMenu dispatch={dispatch} onAdded={id => onSelect(id)} />
      </div>
    </div>
  )
}
