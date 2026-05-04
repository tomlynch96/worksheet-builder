import { useRef } from 'react'
import type { FigureBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field } from '../EditorPrimitives'

interface Props {
  block: FigureBlock
  dispatch: React.Dispatch<WorksheetAction>
}

export function FigureEditor({ block, dispatch }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  function update(updates: Partial<FigureBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }

  function readFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => update({ imageData: reader.result as string })
    reader.readAsDataURL(file)
  }

  function handlePaste(e: React.ClipboardEvent) {
    const imgItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'))
    if (!imgItem) return
    e.preventDefault()
    const file = imgItem.getAsFile()
    if (file) readFile(file)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) readFile(file)
    e.target.value = ''
  }

  return (
    <div className="block-fields">
      <Field label="Image">
        <div
          className={`figure-paste-zone${block.imageData ? ' figure-paste-zone--has-image' : ''}`}
          tabIndex={0}
          onPaste={handlePaste}
        >
          {block.imageData ? (
            <img src={block.imageData} alt="" className="figure-paste-preview" />
          ) : (
            <span className="figure-paste-hint">Paste image here (Ctrl+V / ⌘+V)</span>
          )}
        </div>
        <div className="figure-paste-actions">
          <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
            Browse…
          </button>
          {block.imageData && (
            <button type="button" className="btn-secondary btn-danger" onClick={() => update({ imageData: undefined })}>
              Remove image
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
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
