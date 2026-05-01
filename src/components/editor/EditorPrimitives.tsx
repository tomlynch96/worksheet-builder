import type { ReactNode } from 'react'
import './EditorPrimitives.css'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="ep-field">
      <span className="ep-label">{label}</span>
      {children}
    </label>
  )
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="ep-row">{children}</div>
}

export function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="ep-check-row">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export function ListEditor({
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  addLabel?: string
}) {
  function update(idx: number, val: string) {
    const next = [...items]
    next[idx] = val
    onChange(next)
  }
  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }
  function add() {
    onChange([...items, ''])
  }

  return (
    <div className="ep-list-editor">
      {items.map((item, i) => (
        <div key={i} className="ep-list-row">
          <input
            value={item}
            onChange={e => update(i, e.target.value)}
            placeholder={placeholder}
          />
          <button type="button" className="ep-list-remove" onClick={() => remove(i)} aria-label="Remove">×</button>
        </div>
      ))}
      <button type="button" className="ep-list-add" onClick={add}>{addLabel ?? '+ Add item'}</button>
    </div>
  )
}
