import type { InformationBlock, Block } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field } from '../EditorPrimitives'
import { RichTextEditor } from '../RichTextEditor'
import { FigureAttachment } from '../FigureAttachment'

interface Props {
  block: InformationBlock
  blocks: Block[]
  dispatch: React.Dispatch<WorksheetAction>
}

export function InformationEditor({ block, blocks, dispatch }: Props) {
  function update(updates: Partial<InformationBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }
  return (
    <div className="block-fields">
      <Field label="Heading (optional)">
        <RichTextEditor value={block.heading} onChange={heading => update({ heading })} placeholder="e.g. Key information" multiline={false} />
      </Field>
      <Field label="Content">
        <RichTextEditor
          value={block.content}
          onChange={content => update({ content })}
          placeholder="Information text…"
        />
      </Field>
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
