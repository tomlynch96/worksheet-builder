import { useState, useEffect } from 'react'
import { useActiveEditor } from './ActiveEditorContext'
import './RTEToolbar.css'

const SCIENCE_SYMBOLS = [
  'λ', 'μ', 'σ', 'θ', 'φ', 'ω', 'α', 'β', 'γ', 'δ', 'Δ', 'Ω',
  '→', '⇌', '×', '÷', '±', '≈', '≠', '≤', '≥', '°', '∞',
]

export function RTEToolbar() {
  const { editor } = useActiveEditor()
  const [, setTick] = useState(0)
  const [showMath, setShowMath] = useState(false)
  const [showSymbols, setShowSymbols] = useState(false)
  const [mathInput, setMathInput] = useState('')

  // Re-render when selection or marks change so isActive stays accurate
  useEffect(() => {
    if (!editor) return
    const update = () => setTick(t => t + 1)
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  function btn(
    label: string,
    mark: string,
    action: () => void,
    className = '',
  ) {
    const on = editor?.isActive(mark) ?? false
    return (
      <button
        type="button"
        className={`rtebar-btn${on ? ' rtebar-btn--on' : ''}${className ? ` ${className}` : ''}`}
        title={label}
        disabled={!editor}
        onMouseDown={e => { e.preventDefault(); action() }}
      >
        {label === 'Bold' ? 'B'
          : label === 'Italic' ? 'I'
          : label === 'Underline' ? 'U'
          : label === 'Superscript' ? 'x²'
          : label === 'Subscript' ? 'x₂'
          : label}
      </button>
    )
  }

  function insertMath() {
    if (!mathInput.trim() || !editor) return
    editor.chain().focus().insertContent({
      type: 'mathInline',
      attrs: { latex: mathInput.trim() },
    }).run()
    setMathInput('')
    setShowMath(false)
  }

  function insertSymbol(sym: string) {
    editor?.chain().focus().insertContent(sym).run()
    setShowSymbols(false)
  }

  return (
    <div className="rtebar">
      <span className="rtebar-group">
        {btn('Bold',      'bold',        () => editor?.chain().focus().toggleBold().run(),      'rtebar-btn--bold')}
        {btn('Italic',    'italic',      () => editor?.chain().focus().toggleItalic().run(),    'rtebar-btn--italic')}
        {btn('Underline', 'underline',   () => editor?.chain().focus().toggleUnderline().run(), 'rtebar-btn--underline')}
      </span>
      <span className="rtebar-sep" />
      <span className="rtebar-group">
        {btn('Superscript', 'superscript', () => editor?.chain().focus().toggleSuperscript().run())}
        {btn('Subscript',   'subscript',   () => editor?.chain().focus().toggleSubscript().run())}
      </span>
      <span className="rtebar-sep" />
      <span className="rtebar-group" style={{ position: 'relative' }}>
        <button
          type="button"
          className={`rtebar-btn${showMath ? ' rtebar-btn--on' : ''}`}
          title="Insert equation (LaTeX)"
          disabled={!editor}
          onMouseDown={e => { e.preventDefault(); setShowMath(v => !v); setShowSymbols(false) }}
        >Σ</button>
        {showMath && (
          <div className="rtebar-popover">
            <span className="rtebar-popover-label">LaTeX equation</span>
            <input
              className="rtebar-math-input"
              value={mathInput}
              onChange={e => setMathInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && insertMath()}
              placeholder="e.g. E=mc^2  or  \frac{v}{f}"
              autoFocus
            />
            <button type="button" className="rtebar-math-insert" onClick={insertMath}>Insert</button>
          </div>
        )}
      </span>
      <span className="rtebar-group" style={{ position: 'relative' }}>
        <button
          type="button"
          className={`rtebar-btn${showSymbols ? ' rtebar-btn--on' : ''}`}
          title="Insert symbol"
          disabled={!editor}
          onMouseDown={e => { e.preventDefault(); setShowSymbols(v => !v); setShowMath(false) }}
        >Ω</button>
        {showSymbols && (
          <div className="rtebar-popover rtebar-symbols-popover">
            {SCIENCE_SYMBOLS.map(sym => (
              <button
                key={sym}
                type="button"
                className="rtebar-sym-btn"
                onMouseDown={e => { e.preventDefault(); insertSymbol(sym) }}
              >{sym}</button>
            ))}
          </div>
        )}
      </span>
      {!editor && (
        <span className="rtebar-hint">Click a text field to start editing</span>
      )}
    </div>
  )
}
