import { useEffect } from 'react'
import { useRichField } from './RichFieldContext'

interface Props {
  id: string
  label: string
  value: string
  onChange: (html: string) => void
  placeholder?: string
  multiline?: boolean
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').trim()
}

export function RichField({ id, label, value, onChange, placeholder, multiline = true }: Props) {
  const { active, setActive, updateValue } = useRichField()
  const isActive = active?.id === id

  // Keep active field's value in sync when block state updates (e.g. after typing)
  useEffect(() => {
    updateValue(id, value)
  }, [id, value, updateValue])

  const preview = stripHtml(value)

  function activate() {
    setActive({ id, label, value, onChange, multiline, placeholder })
  }

  return (
    <div
      className={`rich-field${isActive ? ' rich-field--active' : ''}`}
      onClick={activate}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') activate() }}
      aria-label={`Edit ${label}`}
    >
      <span className={`rich-field-text${!preview ? ' rich-field-text--empty' : ''}`}>
        {preview || placeholder || 'Click to edit…'}
      </span>
      <span className="rich-field-icon" aria-hidden>✎</span>
    </div>
  )
}
