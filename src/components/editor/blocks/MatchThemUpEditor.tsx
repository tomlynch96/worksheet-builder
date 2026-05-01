import type { MatchThemUpBlock, MatchItem } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field } from '../EditorPrimitives'

interface Props {
  block: MatchThemUpBlock
  dispatch: React.Dispatch<WorksheetAction>
}

export function MatchThemUpEditor({ block, dispatch }: Props) {
  function update(updates: Partial<MatchThemUpBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }

  function updateItem(idx: number, updates: Partial<MatchItem>) {
    const items = block.items.map((item, i) => i === idx ? { ...item, ...updates } : item)
    update({ items })
  }

  function addItem() {
    update({ items: [...block.items, { id: crypto.randomUUID(), left: '', right: '' }] })
  }

  function removeItem(idx: number) {
    update({ items: block.items.filter((_, i) => i !== idx) })
  }

  return (
    <div className="block-fields">
      <Field label="Heading">
        <input value={block.heading} onChange={e => update({ heading: e.target.value })} placeholder="Match each term to its definition." />
      </Field>
      <div className="match-grid-header">
        <span>Term</span>
        <span>Definition / match</span>
      </div>
      {block.items.map((item, i) => (
        <div key={item.id} className="match-row">
          <input value={item.left} onChange={e => updateItem(i, { left: e.target.value })} placeholder="Term…" />
          <input value={item.right} onChange={e => updateItem(i, { right: e.target.value })} placeholder="Definition…" />
          <button type="button" className="ep-list-remove" onClick={() => removeItem(i)}>×</button>
        </div>
      ))}
      <button type="button" className="ep-list-add" onClick={addItem}>+ Add pair</button>
    </div>
  )
}
