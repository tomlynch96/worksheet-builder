import { useRef, useState } from 'react'
import type { FigureBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field } from '../EditorPrimitives'

interface Props {
  block: FigureBlock
  dispatch: React.Dispatch<WorksheetAction>
}

export function FigureEditor({ block, dispatch }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const pasteZoneRef = useRef<HTMLDivElement>(null)
  const [pasteReady, setPasteReady] = useState(false)

  function update(updates: Partial<FigureBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }

  const imageSrc = block.imageData ?? block.imageUrl

  function readFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => update({ imageData: reader.result as string, imageUrl: undefined })
    reader.readAsDataURL(file)
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
    update({ imageData: undefined, imageUrl: undefined })
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
          {imageSrc && (
            <button type="button" className="btn-secondary btn-danger" onClick={handleRemove}>
              Remove image
            </button>
          )}
        </div>
      </Field>
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
    </div>
  )
}
