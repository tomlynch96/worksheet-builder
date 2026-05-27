import type { MultipleChoiceBlock, Block, FigureBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field } from '../EditorPrimitives'
import { RichTextEditor } from '../RichTextEditor'

interface Props {
  block: MultipleChoiceBlock
  blocks: Block[]
  dispatch: React.Dispatch<WorksheetAction>
}

export function MultipleChoiceEditor({ block, blocks, dispatch }: Props) {
  function update(updates: Partial<MultipleChoiceBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }

  // Normalise: if correctIndices not set, derive from correctIndex
  const correctIndices: number[] = block.correctIndices ?? [block.correctIndex]
  const isMultiAnswer = correctIndices.length > 1

  function toggleCorrect(idx: number) {
    if (isMultiAnswer || block.correctIndices) {
      // Multi-answer mode: toggle
      const next = correctIndices.includes(idx)
        ? correctIndices.filter(i => i !== idx)
        : [...correctIndices, idx].sort((a, b) => a - b)
      if (next.length === 0) return
      update({ correctIndices: next, correctIndex: next[0] })
    } else {
      // Single-answer mode
      update({ correctIndex: idx, correctIndices: undefined })
    }
  }

  function updateOption(idx: number, val: string) {
    update({ options: block.options.map((o, i) => i === idx ? val : o) })
  }

  function addOption() {
    update({ options: [...block.options, ''] })
  }

  function removeOption(idx: number) {
    const options = block.options.filter((_, i) => i !== idx)
    const nextIndices = correctIndices
      .map(ci => ci > idx ? ci - 1 : ci)
      .filter(ci => ci !== idx && ci < options.length)
    const safeIndices = nextIndices.length > 0 ? nextIndices : [0]
    update({ options, correctIndex: safeIndices[0], correctIndices: block.correctIndices ? safeIndices : undefined })
  }

  const LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

  const figBlock = block.attachedFigureId
    ? blocks.find(b => b.id === block.attachedFigureId && b.type === 'figure') as FigureBlock | undefined
    : undefined

  return (
    <div className="block-fields">
      <Field label="Question stem">
        <RichTextEditor
          value={block.stem}
          onChange={stem => update({ stem })}
          placeholder="Question stem…"
        />
      </Field>

      {figBlock && (
        <Field label="Figure">
          <img
            src={figBlock.imageData ?? figBlock.imageUrl}
            alt={figBlock.caption}
            style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain', display: 'block', borderRadius: 4 }}
          />
        </Field>
      )}

      <Field label="Marks">
        <input type="number" min={1} value={block.marks} onChange={e => update({ marks: +e.target.value })} style={{ maxWidth: 80 }} />
      </Field>

      <div className="mc-options">
        {block.options.map((opt, i) => {
          const isCorrect = correctIndices.includes(i)
          return (
            <div key={i} className="mc-option-row">
              <input
                type="checkbox"
                checked={isCorrect}
                onChange={() => toggleCorrect(i)}
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
          )
        })}
      </div>
      {block.options.length < 6 && (
        <button type="button" className="ep-list-add" onClick={addOption}>+ Add option</button>
      )}
      <p className="mc-hint">Tick the correct answer(s).</p>

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
