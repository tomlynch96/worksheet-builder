import { useState } from 'react'
import type { QuestionBlock, QuestionPart, Block, DataBlock, FigureBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field, Row } from '../EditorPrimitives'
import { RichTextEditor } from '../RichTextEditor'
import { DataEditor } from './DataEditor'
import { FigureEditor } from './FigureEditor'

interface Props {
  block: QuestionBlock
  blocks: Block[]
  dispatch: React.Dispatch<WorksheetAction>
}

function AttachMenu({ onAddGraph, onAddFigure }: { onAddGraph: () => void; onAddFigure: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="q-attach-add">
      {open && <div className="q-attach-backdrop" onClick={() => setOpen(false)} />}
      <button type="button" className="q-attach-btn" onClick={() => setOpen(v => !v)} title="Attach graph or figure">
        + Attach
      </button>
      {open && (
        <div className="q-attach-menu">
          <button type="button" onClick={() => { onAddGraph(); setOpen(false) }}>Graph / data table</button>
          <button type="button" onClick={() => { onAddFigure(); setOpen(false) }}>Figure / image</button>
        </div>
      )}
    </div>
  )
}

function InlineBlockEditor({
  label,
  onRemove,
  children,
}: {
  label: string
  onRemove: () => void
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="q-inline-editor">
      <div className="q-inline-editor-header">
        <button
          type="button"
          className="q-inline-editor-toggle"
          onClick={() => setCollapsed(v => !v)}
        >
          <span className="q-inline-editor-caret">{collapsed ? '▶' : '▼'}</span>
          {label}
        </button>
        <button type="button" className="q-inline-editor-remove" onClick={onRemove} title="Remove attachment">
          Remove
        </button>
      </div>
      {!collapsed && <div className="q-inline-editor-body">{children}</div>}
    </div>
  )
}

function Attachments({
  dataId, figureId, blocks, afterId, dispatch,
  onChangeDataId, onChangeFigureId,
}: {
  dataId?: string
  figureId?: string
  blocks: Block[]
  afterId: string
  dispatch: React.Dispatch<WorksheetAction>
  onChangeDataId: (id: string | undefined) => void
  onChangeFigureId: (id: string | undefined) => void
}) {
  const dataBlock = dataId ? blocks.find(b => b.id === dataId && b.type === 'data') as DataBlock | undefined : undefined
  const figBlock = figureId ? blocks.find(b => b.id === figureId && b.type === 'figure') as FigureBlock | undefined : undefined

  function addGraph() {
    const newBlock: DataBlock = {
      id: crypto.randomUUID(),
      type: 'data',
      heading: '',
      columns: [
        { label: 'x', unit: '' },
        { label: 'y', unit: '' },
      ],
      rows: [['', ''], ['', ''], ['', ''], ['', ''], ['', '']],
      display: 'graph',
      graph: {
        xCol: 0, yCol: 1,
        showXLabel: true, showYLabel: true,
        showXScale: true, showYScale: true,
        omitRows: [0, 1, 2, 3, 4],
        fitType: 'none',
        showFitLine: true,
        linkedDataId: null,
      },
      hiddenCells: [],
    }
    dispatch({ type: 'ADD_BLOCK', block: newBlock, afterId })
    onChangeDataId(newBlock.id)
  }

  function addFigure() {
    const newBlock: FigureBlock = {
      id: crypto.randomUUID(),
      type: 'figure',
      caption: '',
      size: 'medium',
    }
    dispatch({ type: 'ADD_BLOCK', block: newBlock, afterId })
    onChangeFigureId(newBlock.id)
  }

  const canAddMore = !dataBlock || !figBlock

  return (
    <div className="q-attachments">
      {dataBlock && (
        <InlineBlockEditor
          label="Graph / data table"
          onRemove={() => onChangeDataId(undefined)}
        >
          <DataEditor block={dataBlock} dispatch={dispatch} blocks={blocks} />
        </InlineBlockEditor>
      )}
      {figBlock && (
        <InlineBlockEditor
          label="Figure / image"
          onRemove={() => onChangeFigureId(undefined)}
        >
          <FigureEditor block={figBlock} dispatch={dispatch} />
        </InlineBlockEditor>
      )}
      {canAddMore && (
        <AttachMenu onAddGraph={addGraph} onAddFigure={addFigure} />
      )}
    </div>
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
    const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const remaining = block.parts.filter((_, i) => i !== idx)
    const relabelled = remaining.map((p, i) => ({ ...p, label: labels[i] ?? `${i + 1}` }))
    update({ parts: relabelled })
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

      <Attachments
        dataId={block.attachedDataId}
        figureId={block.attachedFigureId}
        blocks={blocks}
        afterId={block.id}
        dispatch={dispatch}
        onChangeDataId={id => update({ attachedDataId: id })}
        onChangeFigureId={id => update({ attachedFigureId: id })}
      />

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
              <Attachments
                dataId={part.attachedDataId}
                figureId={part.attachedFigureId}
                blocks={blocks}
                afterId={block.id}
                dispatch={dispatch}
                onChangeDataId={id => updatePart(i, { attachedDataId: id })}
                onChangeFigureId={id => updatePart(i, { attachedFigureId: id })}
              />
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
              <Field label="Numerical answer (no units, for answer box)">
                <input
                  value={part.numericalAnswer ?? ''}
                  onChange={e => updatePart(i, { numericalAnswer: e.target.value || undefined })}
                  placeholder="e.g. 9.8"
                  style={{ maxWidth: 160 }}
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
          <Field label="Numerical answer (no units, for answer box)">
            <input
              value={block.numericalAnswer ?? ''}
              onChange={e => update({ numericalAnswer: e.target.value || undefined })}
              placeholder="e.g. 9.8"
              style={{ maxWidth: 160 }}
            />
          </Field>
        </>
      )}
    </div>
  )
}
