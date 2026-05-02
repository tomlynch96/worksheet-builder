import type { OrderStepsBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field } from '../EditorPrimitives'
import { RichTextEditor } from '../RichTextEditor'

interface Props {
  block: OrderStepsBlock
  dispatch: React.Dispatch<WorksheetAction>
}

export function OrderStepsEditor({ block, dispatch }: Props) {
  function update(updates: Partial<OrderStepsBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }

  function updateStep(idx: number, val: string) {
    const steps = block.steps.map((s, i) => i === idx ? val : s)
    update({ steps })
  }

  function addStep() { update({ steps: [...block.steps, ''] }) }
  function removeStep(idx: number) { update({ steps: block.steps.filter((_, i) => i !== idx) }) }

  return (
    <div className="block-fields">
      <Field label="Heading">
        <input value={block.heading} onChange={e => update({ heading: e.target.value })} placeholder="Number these steps 1 to … in the correct order." />
      </Field>
      <p className="ep-hint">Enter steps in the correct order — they will be shuffled for students.</p>
      <div className="ep-list-editor">
        {block.steps.map((step, i) => (
          <div key={i} className="ep-list-row" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <RichTextEditor
                value={step}
                onChange={val => updateStep(i, val)}
                placeholder={`Step ${i + 1}…`}
                multiline={false}
              />
            </div>
            <button type="button" className="ep-list-remove" onClick={() => removeStep(i)}>×</button>
          </div>
        ))}
        <button type="button" className="ep-list-add" onClick={addStep}>+ Add step</button>
      </div>
    </div>
  )
}
