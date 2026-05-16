import type { MatchThemUpBlock, MatchItem } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field } from '../EditorPrimitives'
import { RichTextEditor } from '../RichTextEditor'

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
        <RichTextEditor value={block.heading} onChange={heading => update({ heading })} placeholder="Match each term to its definition." multiline={false} />
      </Field>
      <div className="match-grid-header">
        <span>Term</span>
        <span>Definition / match</span>
      </div>
      {block.items.map((item, i) => (
        <div key={item.id} className="match-row">
          <div style={{ flex: 1 }}>
            <RichTextEditor value={item.left} onChange={left => updateItem(i, { left })} placeholder="Term…"  />
          </div>
          <div style={{ flex: 1 }}>
            <RichTextEditor value={item.right} onChange={right => updateItem(i, { right })} placeholder="Definition…"  />
          </div>
          <button type="button" className="ep-list-remove" onClick={() => removeItem(i)}>×</button>
        </div>
      ))}
      <button type="button" className="ep-list-add" onClick={addItem}>+ Add pair</button>
    </div>
  )
}
