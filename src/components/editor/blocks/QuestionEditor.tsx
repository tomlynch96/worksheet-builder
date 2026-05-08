import type { QuestionBlock, QuestionPart, Block, DataBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field, Row } from '../EditorPrimitives'
import { RichTextEditor } from '../RichTextEditor'

interface Props {
  block: QuestionBlock
  blocks: Block[]
  dispatch: React.Dispatch<WorksheetAction>
}

function DataPicker({
  value, blocks, onChange,
}: { value?: string; blocks: Block[]; onChange: (id: string | undefined) => void }) {
  const dataBlocks = blocks.filter(b => b.type === 'data') as DataBlock[]
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value || undefined)}>
      <option value="">None</option>
      {dataBlocks.map((b, i) => (
        <option key={b.id} value={b.id}>
          {b.heading || `Data block ${i + 1}`}
        </option>
      ))}
    </select>
  )
}

export function QuestionEditor({ block, blocks, dispatch }: Props) {
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

  const hasParts = block.parts.length > 0

  return (
    <div className="block-fields">
      <Field label="Question stem">
        <RichTextEditor
          value={block.stem}
          onChange={stem => update({ stem })}
          placeholder="Question stem…"
        />
      </Field>

      <Field label="Attached graph">
        <DataPicker value={block.attachedDataId} blocks={blocks} onChange={id => update({ attachedDataId: id })} />
      </Field>

      {!hasParts && (
        <Row>
          <Field label="Marks">
            <input type="number" min={0} value={block.marks} onChange={e => update({ marks: +e.target.value })} />
          </Field>
          <Field label="Answer lines">
            <input type="number" min={1} max={20} value={block.lines} onChange={e => update({ lines: +e.target.value })} />
          </Field>
        </Row>
      )}

      {hasParts && (
        <div className="q-parts">
          {block.parts.map((part, i) => (
            <div key={part.id} className="q-part">
              <div className="q-part-header">
                <span className="q-part-label">({part.label})</span>
                <button type="button" className="q-part-remove" onClick={() => removePart(i)}>×</button>
              </div>
              <Field label="Stem">
                <RichTextEditor
                  value={part.stem}
                  onChange={stem => updatePart(i, { stem })}
                  placeholder="Sub-question stem…"
                />
              </Field>
              <Field label="Attached graph">
                <DataPicker value={part.attachedDataId} blocks={blocks} onChange={id => updatePart(i, { attachedDataId: id })} />
              </Field>
              <Row>
                <Field label="Marks">
                  <input type="number" min={0} value={part.marks} onChange={e => updatePart(i, { marks: +e.target.value })} />
                </Field>
                <Field label="Answer lines">
                  <input type="number" min={1} max={20} value={part.lines} onChange={e => updatePart(i, { lines: +e.target.value })} />
                </Field>
              </Row>
              <div className="ms-divider" />
              <Field label="Mark scheme answer">
                <RichTextEditor
                  value={part.markScheme ?? ''}
                  onChange={markScheme => updatePart(i, { markScheme })}
                  placeholder="Model answer for this part…"
                />
              </Field>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="ep-list-add" onClick={addPart}>+ Add sub-part</button>

      {!hasParts && (
        <>
          <div className="ms-divider" />
          <Field label="Mark scheme answer">
            <RichTextEditor
              value={block.markScheme ?? ''}
              onChange={markScheme => update({ markScheme })}
              placeholder="Model answer / marking points…"
            />
          </Field>
        </>
      )}
    </div>
  )
}
