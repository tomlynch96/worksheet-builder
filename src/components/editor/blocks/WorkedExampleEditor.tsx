import type { WorkedExampleBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field, ListEditor } from '../EditorPrimitives'

interface Props {
  block: WorkedExampleBlock
  dispatch: React.Dispatch<WorksheetAction>
}

export function WorkedExampleEditor({ block, dispatch }: Props) {
  function update(updates: Partial<WorkedExampleBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }
  return (
    <div className="block-fields">
      <Field label="Title">
        <input value={block.title} onChange={e => update({ title: e.target.value })} placeholder="Worked example" />
      </Field>
      <Field label="Steps">
        <ListEditor
          items={block.steps}
          onChange={steps => update({ steps })}
          placeholder="Step…"
          addLabel="+ Add step"
        />
      </Field>
    </div>
  )
}
