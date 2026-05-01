import type { SpacerBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field } from '../EditorPrimitives'

interface Props {
  block: SpacerBlock
  dispatch: React.Dispatch<WorksheetAction>
}

export function SpacerEditor({ block, dispatch }: Props) {
  function update(updates: Partial<SpacerBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }
  return (
    <div className="block-fields">
      <Field label="Height">
        <select value={block.size} onChange={e => update({ size: e.target.value as SpacerBlock['size'] })}>
          <option value="small">Small (8 mm)</option>
          <option value="medium">Medium (16 mm)</option>
          <option value="large">Large (30 mm)</option>
        </select>
      </Field>
    </div>
  )
}
