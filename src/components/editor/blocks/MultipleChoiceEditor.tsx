import type { MultipleChoiceBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field } from '../EditorPrimitives'
import { RichTextEditor } from '../RichTextEditor'

interface Props {
  block: MultipleChoiceBlock
  dispatch: React.Dispatch<WorksheetAction>
}

export function MultipleChoiceEditor({ block, dispatch }: Props) {
  function update(updates: Partial<MultipleChoiceBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }

  function updateOption(idx: number, val: string) {
    const options = block.options.map((o, i) => i === idx ? val : o)
    update({ options })
  }

  function addOption() {
    update({ options: [...block.options, ''] })
  }

  function removeOption(idx: number) {
    const options = block.options.filter((_, i) => i !== idx)
    const correctIndex = block.correctIndex >= idx && block.correctIndex > 0 ? block.correctIndex - 1 : block.correctIndex
    update({ options, correctIndex })
  }

  const LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

  return (
    <div className="block-fields">
      <Field label="Question stem">
        <RichTextEditor
          value={block.stem}
          onChange={stem => update({ stem })}
          placeholder="Question stem…"
          
        />
      </Field>
      <Field label="Marks">
        <input type="number" min={1} value={block.marks} onChange={e => update({ marks: +e.target.value })} style={{ maxWidth: 80 }} />
      </Field>
      <div className="mc-options">
        {block.options.map((opt, i) => (
          <div key={i} className="mc-option-row">
            <input
              type="radio"
              name={`correct-${block.id}`}
              checked={block.correctIndex === i}
              onChange={() => update({ correctIndex: i })}
              title="Mark as correct answer"
            />
            <span className="mc-label">{LABELS[i] ?? i + 1}</span>
            <div style={{ flex: 1 }}>
              <RichTextEditor
                value={opt}
                onChange={val => updateOption(i, val)}
                placeholder={`Option ${LABELS[i] ?? i + 1}`}
                
              />
            </div>
            <button type="button" className="ep-list-remove" onClick={() => removeOption(i)}>×</button>
          </div>
        ))}
      </div>
      {block.options.length < 6 && (
        <button type="button" className="ep-list-add" onClick={addOption}>+ Add option</button>
      )}
      <p className="mc-hint">Select the radio button next to the correct answer.</p>

      <div className="ms-divider" />
      <Field label="Mark scheme notes">
        <RichTextEditor
          value={block.markScheme ?? ''}
          onChange={markScheme => update({ markScheme })}
          placeholder="Optional explanation / working…"
        />
      </Field>
    </div>
  )
}
