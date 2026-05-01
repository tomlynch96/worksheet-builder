import type { InformationBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field } from '../EditorPrimitives'

interface Props {
  block: InformationBlock
  dispatch: React.Dispatch<WorksheetAction>
}

export function InformationEditor({ block, dispatch }: Props) {
  function update(updates: Partial<InformationBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }
  return (
    <div className="block-fields">
      <Field label="Heading (optional)">
        <input value={block.heading} onChange={e => update({ heading: e.target.value })} placeholder="e.g. Key information" />
      </Field>
      <Field label="Content">
        <textarea rows={4} value={block.content} onChange={e => update({ content: e.target.value })} />
      </Field>
    </div>
  )
}
