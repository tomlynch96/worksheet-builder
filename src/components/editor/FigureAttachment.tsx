import type { Block, FigureBlock } from '../../types/worksheet'
import type { WorksheetAction } from '../../hooks/useWorksheet'
import { FigureEditor } from './blocks/FigureEditor'

interface Props {
  figureId?: string
  blocks: Block[]
  afterId: string
  dispatch: React.Dispatch<WorksheetAction>
  onChangeFigureId: (id: string | undefined) => void
}

export function FigureAttachment({ figureId, blocks, afterId, dispatch, onChangeFigureId }: Props) {
  const figBlock = figureId
    ? blocks.find(b => b.id === figureId && b.type === 'figure') as FigureBlock | undefined
    : undefined

  function addFigure() {
    const newBlock: FigureBlock = { id: crypto.randomUUID(), type: 'figure', caption: '', size: 'medium' }
    dispatch({ type: 'ADD_BLOCK', block: newBlock, afterId })
    onChangeFigureId(newBlock.id)
  }

  return (
    <div className="q-attachments">
      {figBlock ? (
        <div className="q-inline-editor">
          <div className="q-inline-editor-header">
            <span className="q-inline-editor-toggle">▼ Figure / image</span>
            <button type="button" className="q-inline-editor-remove" onClick={() => onChangeFigureId(undefined)}>Remove</button>
          </div>
          <div className="q-inline-editor-body">
            <FigureEditor block={figBlock} dispatch={dispatch} />
          </div>
        </div>
      ) : (
        <div className="q-attach-add">
          <button type="button" className="q-attach-btn" onClick={addFigure}>+ Attach figure</button>
        </div>
      )}
    </div>
  )
}
