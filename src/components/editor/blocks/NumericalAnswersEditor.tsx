import type { NumericalAnswersBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field } from '../EditorPrimitives'
import { RichTextEditor } from '../RichTextEditor'

interface Props {
  block: NumericalAnswersBlock
  dispatch: React.Dispatch<WorksheetAction>
}

export function NumericalAnswersEditor({ block, dispatch }: Props) {
  function update(updates: Partial<NumericalAnswersBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }

  return (
    <div className="block-fields">
      <Field label="Heading">
        <RichTextEditor
          value={block.heading}
          onChange={heading => update({ heading })}
          placeholder="Numerical answers"
          multiline={false}
        />
      </Field>
      <p className="ep-hint">
        This block displays all numerical answers (without units) from questions marked as numerical — shuffled for self-checking. Mark each question or part answer as numerical in the question editor below.
      </p>
    </div>
  )
}
