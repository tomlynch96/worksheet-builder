import type { WorkedExampleBlock, Block } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field } from '../EditorPrimitives'
import { RichTextEditor } from '../RichTextEditor'
import { FigureAttachment } from '../FigureAttachment'

interface Props {
  block: WorkedExampleBlock
  blocks: Block[]
  dispatch: React.Dispatch<WorksheetAction>
}

export function WorkedExampleEditor({ block, blocks, dispatch }: Props) {
  function update(updates: Partial<WorkedExampleBlock>) {
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
      <Field label="Title">
        <RichTextEditor value={block.title} onChange={title => update({ title })} placeholder="Worked example" multiline={false} />
      </Field>
      <div className="ep-list-editor">
        {block.steps.map((step, i) => (
          <div key={i} className="ep-list-row" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <RichTextEditor
                value={step}
                onChange={val => updateStep(i, val)}
                placeholder={`Step ${i + 1}…`}
                
              />
            </div>
            <button type="button" className="ep-list-remove" onClick={() => removeStep(i)}>×</button>
          </div>
        ))}
        <button type="button" className="ep-list-add" onClick={addStep}>+ Add step</button>
      </div>
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
