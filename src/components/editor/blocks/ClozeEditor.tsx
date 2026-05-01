import type { ClozeBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field, CheckRow } from '../EditorPrimitives'
import { extractClozeWords } from '../../../utils/shuffle'

interface Props {
  block: ClozeBlock
  dispatch: React.Dispatch<WorksheetAction>
}

export function ClozeEditor({ block, dispatch }: Props) {
  function update(updates: Partial<ClozeBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }

  const words = extractClozeWords(block.text)

  return (
    <div className="block-fields">
      <Field label="Heading">
        <input value={block.heading} onChange={e => update({ heading: e.target.value })} placeholder="Fill in the blanks using the words below." />
      </Field>
      <Field label="Text — wrap answer words in [square brackets]">
        <textarea
          rows={5}
          value={block.text}
          onChange={e => update({ text: e.target.value })}
          placeholder="The [frequency] of a wave is the number of [waves] passing a point per second."
        />
      </Field>
      {words.length > 0 && (
        <p className="cloze-words-preview">
          Word bank will contain: <strong>{words.join(', ')}</strong>
        </p>
      )}
      <CheckRow
        label="Show word bank"
        checked={block.showWordBank}
        onChange={v => update({ showWordBank: v })}
      />
    </div>
  )
}
