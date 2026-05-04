import type { Worksheet, BlockType } from '../../types/worksheet'
import type { WorksheetAction } from '../../hooks/useWorksheet'
import { BlockEditor } from './BlockEditor'
import { AddBlockMenu } from './AddBlockMenu'
import { ActiveEditorProvider } from './ActiveEditorContext'
import { RTEToolbar } from './RTEToolbar'
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
  data:            'Data / Graph',
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
  data:            '#0d9488',
}

interface Props {
  worksheet: Worksheet
  dispatch: React.Dispatch<WorksheetAction>
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function Editor({ worksheet, dispatch, selectedId, onSelect }: Props) {
  const { blocks } = worksheet
  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null
  const selectedIdx = selectedBlock ? blocks.indexOf(selectedBlock) : -1

  return (
    <ActiveEditorProvider>
      {selectedBlock && <RTEToolbar />}
      <div className="editor">
        {selectedBlock ? (
          <>
            <div
              className="editor-focused-header"
              style={{ '--block-color': BLOCK_COLORS[selectedBlock.type] } as React.CSSProperties}
            >
              <button
                type="button"
                className="editor-back-btn"
                onClick={() => onSelect(null)}
                aria-label="Close editor"
              >
                ← Back
              </button>
              <span className="editor-focused-type">{BLOCK_LABELS[selectedBlock.type]}</span>
              <div className="editor-focused-controls">
                <button
                  type="button"
                  className="ctrl-btn"
                  disabled={selectedIdx === 0}
                  onClick={() => dispatch({ type: 'MOVE_BLOCK', id: selectedBlock.id, direction: 'up' })}
                  aria-label="Move up"
                >↑</button>
                <button
                  type="button"
                  className="ctrl-btn"
                  disabled={selectedIdx === blocks.length - 1}
                  onClick={() => dispatch({ type: 'MOVE_BLOCK', id: selectedBlock.id, direction: 'down' })}
                  aria-label="Move down"
                >↓</button>
                <button
                  type="button"
                  className="ctrl-btn ctrl-btn--danger"
                  onClick={() => { dispatch({ type: 'DELETE_BLOCK', id: selectedBlock.id }); onSelect(null) }}
                  aria-label="Delete block"
                >×</button>
              </div>
            </div>
            <div className="editor-focused-body">
              <BlockEditor block={selectedBlock} dispatch={dispatch} />
            </div>
          </>
        ) : (
          <div className="editor-empty">
            <div className="editor-empty-icon">↗</div>
            <p className="editor-empty-text">Click any block in the preview to edit it</p>
          </div>
        )}

        <div className="editor-footer">
          <AddBlockMenu dispatch={dispatch} onAdded={id => onSelect(id)} />
        </div>
      </div>
    </ActiveEditorProvider>
  )
}
