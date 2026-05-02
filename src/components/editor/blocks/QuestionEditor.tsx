import type { QuestionBlock, QuestionPart } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field, Row } from '../EditorPrimitives'
import { RichField } from '../RichField'

interface Props {
  block: QuestionBlock
  dispatch: React.Dispatch<WorksheetAction>
}

export function QuestionEditor({ block, dispatch }: Props) {
  function update(updates: Partial<QuestionBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }

  function updatePart(idx: number, updates: Partial<QuestionPart>) {
    const parts = block.parts.map((p, i) => i === idx ? { ...p, ...updates } : p)
    update({ parts })
  }

  function addPart() {
    const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const label = labels[block.parts.length] ?? `${block.parts.length + 1}`
    update({
      parts: [...block.parts, { id: crypto.randomUUID(), label, stem: '', marks: 1, lines: 3 }],
    })
  }

  function removePart(idx: number) {
    update({ parts: block.parts.filter((_, i) => i !== idx) })
  }

  return (
    <div className="block-fields">
      <Field label="Question stem">
        <RichField
          id={`${block.id}-stem`}
          label="Question stem"
          value={block.stem}
          onChange={stem => update({ stem })}
          placeholder="Question stem…"
          multiline={false}
        />
      </Field>
      {block.parts.length === 0 && (
        <Row>
          <Field label="Marks">
            <input type="number" min={0} value={block.marks} onChange={e => update({ marks: +e.target.value })} />
          </Field>
          <Field label="Answer lines">
            <input type="number" min={1} max={20} value={block.lines} onChange={e => update({ lines: +e.target.value })} />
          </Field>
        </Row>
      )}

      {block.parts.length > 0 && (
        <div className="q-parts">
          {block.parts.map((part, i) => (
            <div key={part.id} className="q-part">
              <div className="q-part-header">
                <span className="q-part-label">({part.label})</span>
                <button type="button" className="q-part-remove" onClick={() => removePart(i)}>×</button>
              </div>
              <Field label="Stem">
                <RichField
                  id={`${block.id}-part-${i}`}
                  label={`Part (${part.label}) stem`}
                  value={part.stem}
                  onChange={stem => updatePart(i, { stem })}
                  placeholder="Sub-question stem…"
                  multiline={false}
                />
              </Field>
              <Row>
                <Field label="Marks">
                  <input type="number" min={0} value={part.marks} onChange={e => updatePart(i, { marks: +e.target.value })} />
                </Field>
                <Field label="Answer lines">
                  <input type="number" min={1} max={20} value={part.lines} onChange={e => updatePart(i, { lines: +e.target.value })} />
                </Field>
              </Row>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="ep-list-add" onClick={addPart}>+ Add sub-part</button>
    </div>
  )
}
