import type { FigureBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field } from '../EditorPrimitives'

interface Props {
  block: FigureBlock
  dispatch: React.Dispatch<WorksheetAction>
}

export function FigureEditor({ block, dispatch }: Props) {
  function update(updates: Partial<FigureBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }
  return (
    <div className="block-fields">
      <Field label="Caption">
        <input value={block.caption} onChange={e => update({ caption: e.target.value })} placeholder="Figure 1: …" />
      </Field>
      <Field label="Size">
        <select value={block.size} onChange={e => update({ size: e.target.value as FigureBlock['size'] })}>
          <option value="small">Small (quarter page)</option>
          <option value="medium">Medium (half page)</option>
          <option value="large">Large (three-quarter page)</option>
        </select>
      </Field>
    </div>
  )
}
