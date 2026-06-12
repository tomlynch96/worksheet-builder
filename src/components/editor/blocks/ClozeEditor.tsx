import type { ClozeBlock, Block } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field, CheckRow } from '../EditorPrimitives'
import { RichTextEditor } from '../RichTextEditor'
import { extractClozeWords } from '../../../utils/shuffle'
import { FigureAttachment } from '../FigureAttachment'

interface Props {
  block: ClozeBlock
  blocks: Block[]
  dispatch: React.Dispatch<WorksheetAction>
}

export function ClozeEditor({ block, blocks, dispatch }: Props) {
  function update(updates: Partial<ClozeBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }

  const words = extractClozeWords(block.text)

  return (
    <div className="block-fields">
      <Field label="Heading">
        <RichTextEditor value={block.heading} onChange={heading => update({ heading })} placeholder="Fill in the blanks using the words below." multiline={false} />
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
          Word bank: <strong>{words.join(', ')}</strong>
        </p>
      )}
      <CheckRow
        label="Show word bank"
        checked={block.showWordBank}
        onChange={v => update({ showWordBank: v })}
      />
      <FigureAttachment
        figureId={block.attachedFigureId}
        blocks={blocks}
        afterId={block.id}
        dispatch={dispatch}
        onChangeFigureId={id => update({ attachedFigureId: id })}
      />
    </div>
  )
}
