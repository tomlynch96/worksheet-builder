import { useRef, useState } from 'react'
import type { FigureBlock } from '../../../types/worksheet'
import type { DiagramVariable } from '../../../types/diagram'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import type { GeneratedQuestion } from '../../../utils/generateDiagram'
import { figureUpdatesForDiagram, renderDiagram, svgDataUrl } from '../../../utils/diagramSvg'
import { Field } from '../EditorPrimitives'
import { DiagramStudioModal, type DiagramStudioResult } from '../DiagramStudioModal'
import '../DiagramStudioModal.css'

interface Props {
  block: FigureBlock
  dispatch: React.Dispatch<WorksheetAction>
  oakImages?: string[]
  // Set when the figure belongs to a question: the studio can then write that
  // question too, and the result is handed back here to fill it in.
  questionContext?: string
  onQuestionGenerated?: (q: GeneratedQuestion, vars: DiagramVariable[]) => void
}

export function FigureEditor({ block, dispatch, oakImages, questionContext, onQuestionGenerated }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const pasteZoneRef = useRef<HTMLDivElement>(null)
  const renderSeq = useRef(0)
  const [pasteReady, setPasteReady] = useState(false)
  const [studio, setStudio] = useState<'generate' | 'library' | null>(null)
  const [valuesEdited, setValuesEdited] = useState(false)

  function update(updates: Partial<FigureBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }

  const imageSrc = block.diagram
    ? svgDataUrl(renderDiagram(block.diagram.template, block.diagram.variables))
    : block.imageData ?? block.imageUrl

  function readFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => update({ imageData: reader.result as string, imageUrl: undefined, diagram: undefined })
    reader.readAsDataURL(file)
  }

  // The SVG updates the preview straight away; the PNG copy used for PDF export follows
  async function updateVariable(key: string, updates: Partial<DiagramVariable>) {
    if (!block.diagram) return
    const diagram = { ...block.diagram, variables: block.diagram.variables.map(v => v.key === key ? { ...v, ...updates } : v) }
    update({ diagram })
    setValuesEdited(true)
    const seq = ++renderSeq.current
    const next = await figureUpdatesForDiagram(diagram).catch(() => null)
    if (next && seq === renderSeq.current) update({ imageData: next.imageData })
  }

  async function applyStudio({ diagram, caption, question }: DiagramStudioResult) {
    const updates = await figureUpdatesForDiagram(diagram)
    update({ ...updates, caption: caption || block.caption })
    setValuesEdited(false)
    if (question && onQuestionGenerated) onQuestionGenerated(question, diagram.variables)
  }

  function handlePaste(e: React.ClipboardEvent) {
    const imgItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'))
    if (!imgItem) return
    e.preventDefault()
    const file = imgItem.getAsFile()
    if (file) readFile(file)
    setPasteReady(false)
  }

  function handleZoneClick(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    pasteZoneRef.current?.focus()
    setPasteReady(true)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) readFile(file)
    e.target.value = ''
  }

  function handleRemove() {
    update({ imageData: undefined, imageUrl: undefined, diagram: undefined })
  }

  return (
    <div className="block-fields">
      {/* File input lives outside Field so the wrapping <label> doesn't activate it on click */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      <Field label="Image">
        <div
          ref={pasteZoneRef}
          className={`figure-paste-zone${imageSrc ? ' figure-paste-zone--has-image' : ''}${pasteReady ? ' figure-paste-zone--ready' : ''}`}
          tabIndex={0}
          onPaste={handlePaste}
          onClick={handleZoneClick}
          onBlur={() => setPasteReady(false)}
        >
          {imageSrc ? (
            <img src={imageSrc} alt="" className="figure-paste-preview" />
          ) : (
            <span className="figure-paste-hint">
              {pasteReady ? 'Ready — press Ctrl+V / ⌘+V' : 'Click then paste (Ctrl+V / ⌘+V)'}
            </span>
          )}
        </div>
        <div className="figure-paste-actions">
          <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
            {imageSrc ? 'Replace…' : 'Browse…'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setStudio('generate')}>
            {block.diagram ? '✦ Edit diagram…' : '✦ AI diagram…'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setStudio('library')}>
            Diagram library…
          </button>
          {imageSrc && (
            <button type="button" className="btn-secondary btn-danger" onClick={handleRemove}>
              Remove image
            </button>
          )}
        </div>
      </Field>
      {oakImages && oakImages.length > 0 && (
        <Field label="Oak lesson images">
          <p className="figure-oak-hint">Images from the linked Oak lesson — click one to use it.</p>
          <div className="figure-oak-grid">
            {oakImages.map((url, i) => (
              <button
                key={url}
                type="button"
                className={`figure-oak-thumb${block.imageUrl === url ? ' figure-oak-thumb--selected' : ''}`}
                onClick={() => update({ imageUrl: url, imageData: undefined, diagram: undefined })}
                title={`Oak lesson image ${i + 1}`}
              >
                <img src={url} alt={`Oak image ${i + 1}`} />
              </button>
            ))}
          </div>
        </Field>
      )}
      {block.diagram && block.diagram.variables.length > 0 && (
        <Field label="Labelled values">
          <div className="figure-diagram-vars">
            {block.diagram.variables.map(v => (
              <div key={v.key} className="ds-var-row">
                <span className="ds-var-label">{v.label}</span>
                <input className="ds-var-value" value={v.value} onChange={e => updateVariable(v.key, { value: e.target.value })} />
                <input className="ds-var-unit" value={v.unit ?? ''} onChange={e => updateVariable(v.key, { unit: e.target.value })} placeholder="unit" />
              </div>
            ))}
          </div>
          {valuesEdited && onQuestionGenerated && (
            <p className="figure-diagram-note">Values changed — check the question text and mark scheme still match.</p>
          )}
        </Field>
      )}
      <Field label="Caption">
        <input value={block.caption} onChange={e => update({ caption: e.target.value })} placeholder="Figure 1: …" />
      </Field>
      <Field label="Size">
        <select value={block.size} onChange={e => update({ size: e.target.value as FigureBlock['size'] })}>
          <option value="small">Small (quarter page)</option>
          <option value="medium">Medium (half page)</option>
          <option value="large">Large (three-quarter page)</option>
        </select>
      </Field>
      {studio && (
        <DiagramStudioModal
          initial={studio === 'generate' ? block.diagram : undefined}
          initialCaption={block.caption}
          questionMode={onQuestionGenerated ? 'optional' : 'none'}
          questionContext={questionContext}
          startTab={studio}
          onApply={applyStudio}
          onClose={() => setStudio(null)}
        />
      )}
    </div>
  )
}
