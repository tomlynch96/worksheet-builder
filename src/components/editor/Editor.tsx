import { useState } from 'react'
import type { Worksheet, BlockType, HeaderBlock } from '../../types/worksheet'
import type { WorksheetAction } from '../../hooks/useWorksheet'
import { BlockEditor } from './BlockEditor'
import { AddBlockMenu } from './AddBlockMenu'
import { AIDialog } from './AIDialog'
import { ActiveEditorProvider } from './ActiveEditorContext'
import { RTEToolbar } from './RTEToolbar'
import { generateBlock, generateVariation, generateWorkedExample, generateExtraPart } from '../../utils/generateWorksheet'
import './Editor.css'

const BLOCK_LABELS: Record<BlockType, string> = {
  header:             'Header',
  instructions:       'Instructions',
  question:           'Question',
  multiple_choice:    'Multiple Choice',
  worked_example:     'Worked Example',
  information:        'Information',
  match_them_up:      'Match Them Up',
  cloze:              'Cloze Activity',
  order_steps:        'Order the Steps',
  figure:             'Figure',
  spacer:             'Spacer',
  data:               'Data / Graph',
  numerical_answers:  'Numerical Answers',
}

const BLOCK_COLORS: Record<BlockType, string> = {
  header:             '#1e3a5f',
  instructions:       '#0369a1',
  question:           '#16a34a',
  multiple_choice:    '#0891b2',
  worked_example:     '#c2410c',
  information:        '#b45309',
  match_them_up:      '#7c3aed',
  cloze:              '#db2777',
  order_steps:        '#4338ca',
  figure:             '#475569',
  spacer:             '#9ca3af',
  data:               '#0d9488',
  numerical_answers:  '#374151',
}

interface Props {
  worksheet: Worksheet
  dispatch: React.Dispatch<WorksheetAction>
  selectedId: string | null
  onSelect: (id: string | null) => void
}

interface BlockAIState {
  prompt: string
  loading: boolean
  error: string | null
}

export function Editor({ worksheet, dispatch, selectedId, onSelect }: Props) {
  const { blocks } = worksheet
  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null
  const selectedIdx = selectedBlock ? blocks.indexOf(selectedBlock) : -1
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [blockAI, setBlockAI] = useState<BlockAIState | null>(null)
  const [addingVariation, setAddingVariation] = useState(false)
  const [addingWorkedEx, setAddingWorkedEx] = useState(false)
  function isDataReferenced(id: string, excludeId?: string) {
    return blocks.some(b => {
      if (b.id === excludeId) return false
      if (b.type === 'question') {
        if (b.attachedDataId === id) return true
        if (b.parts.some(p => p.attachedDataId === id)) return true
      }
      if (b.type === 'data' && b.id !== id && b.graph.linkedDataId === id) return true
      return false
    })
  }

  function handleDelete() {
    if (!selectedBlock) return

    if (selectedBlock.type === 'question') {
      // Cascade-delete attached data blocks that have no other references
      const dataIds: string[] = []
      if (selectedBlock.attachedDataId) dataIds.push(selectedBlock.attachedDataId)
      selectedBlock.parts.forEach(p => { if (p.attachedDataId) dataIds.push(p.attachedDataId) })
      for (const dataId of dataIds) {
        if (!isDataReferenced(dataId, selectedBlock.id)) {
          dispatch({ type: 'DELETE_BLOCK', id: dataId })
        }
      }
    }

    dispatch({ type: 'DELETE_BLOCK', id: selectedBlock.id })
    onSelect(null)
  }

  const header = blocks.find(b => b.type === 'header') as HeaderBlock | undefined
  const worksheetContext = [
    header?.examBoard,
    header?.tier,
    header?.topic,
    header?.specPoint,
  ].filter(Boolean).join(' · ')

  async function handleBlockAISubmit() {
    if (!selectedBlock || !blockAI?.prompt.trim()) return
    setBlockAI(s => s && { ...s, loading: true, error: null })
    try {
      const generated = await generateBlock({
        blockType: selectedBlock.type,
        context: worksheetContext,
        request: blockAI.prompt,
        currentBlock: selectedBlock,
      })
      // Merge generated content into current block, preserving id and type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dispatch({ type: 'UPDATE_BLOCK', id: selectedBlock.id, updates: { ...(generated as any), id: selectedBlock.id, type: selectedBlock.type } })
      setBlockAI(null)
    } catch (err) {
      setBlockAI(s => s && { ...s, loading: false, error: err instanceof Error ? err.message : String(err) })
    }
  }

  async function handleAddVariation() {
    if (!selectedBlock) return
    setAddingVariation(true)
    try {
      if (selectedBlock.type === 'question' && selectedBlock.parts.length > 0) {
        // Multi-part question: add an extra sub-part rather than a whole new block
        const { parts } = await generateExtraPart(selectedBlock, worksheetContext)
        dispatch({ type: 'UPDATE_BLOCK', id: selectedBlock.id, updates: { parts } })
      } else {
        const varied = await generateVariation(selectedBlock, worksheetContext)
        dispatch({ type: 'ADD_BLOCK', block: varied, afterId: selectedBlock.id })
      }
    } catch (err) {
      console.error('Variation failed:', err)
    } finally {
      setAddingVariation(false)
    }
  }

  async function handleAddWorkedExample() {
    if (!selectedBlock) return
    setAddingWorkedEx(true)
    try {
      const we = await generateWorkedExample(selectedBlock, worksheetContext)
      // Find the index of the current block and insert the worked example just before it
      const idx = blocks.findIndex(b => b.id === selectedBlock.id)
      const afterId = idx > 0 ? blocks[idx - 1].id : undefined
      dispatch({ type: 'ADD_BLOCK', block: we, afterId })
    } catch (err) {
      console.error('Worked example failed:', err)
    } finally {
      setAddingWorkedEx(false)
    }
  }

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
                onClick={() => { onSelect(null); setBlockAI(null) }}
                aria-label="Close editor"
              >
                ← Back
              </button>
              <span className="editor-focused-type">{BLOCK_LABELS[selectedBlock.type]}</span>
              <div className="editor-focused-controls">
                <button type="button" className="ctrl-btn ctrl-btn--ai" onClick={() => setBlockAI(a => a ? null : { prompt: '', loading: false, error: null })} title="AI fill this block" disabled={addingVariation || addingWorkedEx}>✦</button>
                <button
                  type="button"
                  className="ctrl-btn ctrl-btn--vary"
                  onClick={handleAddVariation}
                  disabled={addingVariation || addingWorkedEx || blockAI !== null}
                  title="Add another like this"
                >{addingVariation ? <span className="ctrl-spinner" /> : '↳'}</button>
                {(selectedBlock.type === 'question' || selectedBlock.type === 'multiple_choice') && (
                  <button
                    type="button"
                    className="ctrl-btn ctrl-btn--we"
                    onClick={handleAddWorkedExample}
                    disabled={addingVariation || addingWorkedEx || blockAI !== null}
                    title="Add worked example before this question"
                  >{addingWorkedEx ? <span className="ctrl-spinner" /> : 'WE'}</button>
                )}
                <button type="button" className="ctrl-btn" disabled={selectedIdx === 0 || addingVariation || addingWorkedEx} onClick={() => dispatch({ type: 'MOVE_BLOCK', id: selectedBlock.id, direction: 'up' })} aria-label="Move up">↑</button>
                <button type="button" className="ctrl-btn" disabled={selectedIdx === blocks.length - 1 || addingVariation || addingWorkedEx} onClick={() => dispatch({ type: 'MOVE_BLOCK', id: selectedBlock.id, direction: 'down' })} aria-label="Move down">↓</button>
                <button type="button" className="ctrl-btn ctrl-btn--danger" onClick={handleDelete} aria-label="Delete block" disabled={addingVariation || addingWorkedEx}>×</button>
              </div>
            </div>

            {blockAI && (
              <div className="editor-block-ai">
                <textarea
                  className="editor-block-ai-input"
                  rows={2}
                  autoFocus
                  placeholder={`Describe what this ${BLOCK_LABELS[selectedBlock.type].toLowerCase()} should contain…`}
                  value={blockAI.prompt}
                  onChange={e => setBlockAI(s => s && { ...s, prompt: e.target.value })}
                  disabled={blockAI.loading}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleBlockAISubmit() }}
                />
                {blockAI.error && <p className="editor-block-ai-error">{blockAI.error}</p>}
                <div className="editor-block-ai-actions">
                  <span className="editor-block-ai-hint">⌘↵ to generate</span>
                  <button type="button" className="editor-block-ai-cancel" onClick={() => setBlockAI(null)} disabled={blockAI.loading}>Cancel</button>
                  <button
                    type="button"
                    className="editor-block-ai-submit"
                    onClick={handleBlockAISubmit}
                    disabled={!blockAI.prompt.trim() || blockAI.loading}
                  >
                    {blockAI.loading ? <><span className="editor-block-ai-spinner" /> Filling…</> : '✦ Fill block'}
                  </button>
                </div>
              </div>
            )}

            <div className="editor-focused-body">
              <BlockEditor block={selectedBlock} blocks={blocks} dispatch={dispatch} />
            </div>
          </>
        ) : (
          <div className="editor-empty">
            <div className="editor-empty-icon">↗</div>
            <p className="editor-empty-text">Click any block in the preview to edit it</p>
          </div>
        )}

        <div className="editor-footer">
          <AddBlockMenu
            afterId={selectedId ?? undefined}
            dispatch={dispatch}
            onAdded={id => onSelect(id)}
            worksheetContext={worksheetContext}
          />
          <button
            type="button"
            className="editor-ai-btn"
            onClick={() => setShowAIDialog(true)}
            title="Ask AI to edit the whole worksheet"
          >
            ✦ Edit worksheet with AI
          </button>
        </div>
      </div>

      {showAIDialog && (
        <AIDialog
          worksheet={worksheet}
          dispatch={dispatch}
          onClose={() => setShowAIDialog(false)}
        />
      )}
    </ActiveEditorProvider>
  )
}
