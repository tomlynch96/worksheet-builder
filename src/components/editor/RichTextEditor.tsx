import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import Underline from '@tiptap/extension-underline'
import { MathInline } from './MathInline'
import './RichTextEditor.css'

const SCIENCE_SYMBOLS = [
  'λ', 'μ', 'σ', 'θ', 'φ', 'ω', 'α', 'β', 'γ', 'δ', 'Δ', 'Ω',
  '→', '⇌', '×', '÷', '±', '≈', '≠', '≤', '≥', '°', '∞',
]

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  multiline?: boolean
}

export function RichTextEditor({ value, onChange, placeholder, multiline = true }: Props) {
  const [mathInput, setMathInput] = useState('')
  const [showMath, setShowMath] = useState(false)
  const [showSymbols, setShowSymbols] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, blockquote: false, code: false, codeBlock: false,
        horizontalRule: false, bulletList: false, orderedList: false, listItem: false,
        hardBreak: multiline ? undefined : false,
      }),
      Superscript,
      Subscript,
      Underline,
      MathInline,
    ],
    content: value || '',
    onUpdate({ editor }) {
      const html = editor.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    },
    editorProps: {
      handleKeyDown(_view, event) {
        if (!multiline && event.key === 'Enter') {
          event.preventDefault()
          return true
        }
        return false
      },
    },
  })

  // Sync external value changes (e.g. preset loaded)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null

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

  const active = (mark: string) => editor.isActive(mark)

  return (
    <div className="rte-wrap">
      <div className="rte-toolbar">
        <button type="button" className={`rte-btn ${active('bold') ? 'rte-btn--on' : ''}`}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run() }} title="Bold">B</button>
        <button type="button" className={`rte-btn rte-btn--italic ${active('italic') ? 'rte-btn--on' : ''}`}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }} title="Italic">I</button>
        <button type="button" className={`rte-btn rte-btn--underline ${active('underline') ? 'rte-btn--on' : ''}`}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleUnderline().run() }} title="Underline">U</button>
        <span className="rte-sep" />
        <button type="button" className={`rte-btn ${active('superscript') ? 'rte-btn--on' : ''}`}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleSuperscript().run() }} title="Superscript">x²</button>
        <button type="button" className={`rte-btn ${active('subscript') ? 'rte-btn--on' : ''}`}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleSubscript().run() }} title="Subscript">x₂</button>
        <span className="rte-sep" />
        <div className="rte-popover-wrap">
          <button type="button" className="rte-btn" title="Insert equation"
            onMouseDown={e => { e.preventDefault(); setShowMath(v => !v); setShowSymbols(false) }}>Σ</button>
          {showMath && (
            <div className="rte-popover">
              <span className="rte-popover-label">LaTeX equation</span>
              <input
                className="rte-math-input"
                value={mathInput}
                onChange={e => setMathInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && insertMath()}
                placeholder="e.g. E=mc^2 or \frac{v}{f}"
                autoFocus
              />
              <button type="button" className="rte-math-insert" onClick={insertMath}>Insert</button>
            </div>
          )}
        </div>
        <div className="rte-popover-wrap">
          <button type="button" className="rte-btn" title="Insert symbol"
            onMouseDown={e => { e.preventDefault(); setShowSymbols(v => !v); setShowMath(false) }}>Ω</button>
          {showSymbols && (
            <div className="rte-popover rte-symbols-popover">
              {SCIENCE_SYMBOLS.map(sym => (
                <button key={sym} type="button" className="rte-sym-btn"
                  onMouseDown={e => { e.preventDefault(); insertSymbol(sym) }}>{sym}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      <EditorContent
        editor={editor}
        className={`rte-content ${multiline ? 'rte-content--multi' : 'rte-content--single'}`}
        data-placeholder={placeholder}
      />
    </div>
  )
}
