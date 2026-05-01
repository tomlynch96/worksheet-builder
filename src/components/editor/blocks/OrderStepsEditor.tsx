import type { OrderStepsBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field, ListEditor } from '../EditorPrimitives'

interface Props {
  block: OrderStepsBlock
  dispatch: React.Dispatch<WorksheetAction>
}

export function OrderStepsEditor({ block, dispatch }: Props) {
  function update(updates: Partial<OrderStepsBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }
  return (
    <div className="block-fields">
      <Field label="Heading">
        <input value={block.heading} onChange={e => update({ heading: e.target.value })} placeholder="Number these steps 1 to … in the correct order." />
      </Field>
      <p className="ep-hint">Enter steps in the correct order — they will be shuffled for students.</p>
      <ListEditor
        items={block.steps}
        onChange={steps => update({ steps })}
        placeholder="Step…"
        addLabel="+ Add step"
      />
    </div>
  )
}
