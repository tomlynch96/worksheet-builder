import type { InstructionsBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { RichTextEditor } from '../RichTextEditor'

interface Props {
  block: InstructionsBlock
  dispatch: React.Dispatch<WorksheetAction>
}

export function InstructionsEditor({ block, dispatch }: Props) {
  function update(items: string[]) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates: { items } })
  }

  function updateItem(idx: number, val: string) {
    const next = [...block.items]
    next[idx] = val
    update(next)
  }

  function removeItem(idx: number) {
    update(block.items.filter((_, i) => i !== idx))
  }

  return (
    <div className="block-fields">
      <div className="ep-list-editor">
        {block.items.map((item, i) => (
          <div key={i} className="ep-list-row" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <RichTextEditor
                value={item}
                onChange={val => updateItem(i, val)}
                placeholder="Instruction…"
                multiline={false}
              />
            </div>
            <button type="button" className="ep-list-remove" onClick={() => removeItem(i)}>×</button>
          </div>
        ))}
        <button type="button" className="ep-list-add" onClick={() => update([...block.items, ''])}>
          + Add instruction
        </button>
      </div>
    </div>
  )
}
