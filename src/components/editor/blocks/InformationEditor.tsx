import type { InformationBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field } from '../EditorPrimitives'
import { RichField } from '../RichField'

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
        <RichField
          id={`${block.id}-content`}
          label="Information content"
          value={block.content}
          onChange={content => update({ content })}
          placeholder="Information text…"
          multiline
        />
      </Field>
    </div>
  )
}
