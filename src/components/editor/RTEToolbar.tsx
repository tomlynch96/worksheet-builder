import { useState, useEffect } from 'react'
import { useActiveEditor } from './ActiveEditorContext'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { PHYSICS_EQUATIONS } from '../../data/physicsEquations'
import { CHEM_DATABASE } from '../../data/chemDatabase'
import './RTEToolbar.css'

function chemPreviewHtml(chem: string): string {
  if (!chem.trim()) return ''
  return katex.renderToString(`\\ce{${chem}}`, { throwOnError: false, displayMode: false, output: 'mathml' })
}

const SCIENCE_SYMBOLS = [
  'λ', 'μ', 'σ', 'θ', 'φ', 'ω', 'α', 'β', 'γ', 'δ', 'Δ', 'Ω',
  '→', '⇌', '×', '÷', '±', '≈', '≠', '≤', '≥', '°', '∞',
]

const CHEM_EXAMPLES = [
  { label: 'Water', value: 'H2O' },
  { label: 'Carbon dioxide', value: 'CO2' },
  { label: 'Sulfuric acid', value: 'H2SO4' },
  { label: 'Combustion', value: 'CH4 + 2O2 -> CO2 + 2H2O' },
  { label: 'Equilibrium', value: 'N2 + 3H2 <=> 2NH3' },
  { label: 'Ionic', value: 'H^+ + OH^- -> H2O' },
]

export function RTEToolbar() {
  const { editor } = useActiveEditor()
  const [, setTick] = useState(0)
  const [showMath, setShowMath] = useState(false)
  const [showChem, setShowChem] = useState(false)
  const [showSymbols, setShowSymbols] = useState(false)
  const [mathInput, setMathInput] = useState('')
  const [chemInput, setChemInput] = useState('')
  const [mathSuggestions, setMathSuggestions] = useState<typeof PHYSICS_EQUATIONS>([])
  const [chemSuggestions, setChemSuggestions] = useState<typeof CHEM_DATABASE>([])

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

  function btn(label: string, mark: string, action: () => void, className = '') {
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

  function onMathInputChange(val: string) {
    setMathInput(val)
    if (!val.trim()) { setMathSuggestions([]); return }
    const q = val.toLowerCase()
    setMathSuggestions(
      PHYSICS_EQUATIONS.filter(eq =>
        eq.name.toLowerCase().includes(q) || eq.latex.toLowerCase().includes(q)
      ).slice(0, 7)
    )
  }

  function onChemInputChange(val: string) {
    setChemInput(val)
    if (!val.trim()) { setChemSuggestions([]); return }
    const q = val.toLowerCase()
    setChemSuggestions(
      CHEM_DATABASE.filter(e =>
        e.name.toLowerCase().includes(q) || e.formula.toLowerCase().includes(q)
      ).slice(0, 7)
    )
  }

  function insertMath() {
    if (!mathInput.trim() || !editor) return
    editor.chain().focus().insertContent({ type: 'mathInline', attrs: { latex: mathInput.trim() } }).run()
    setMathInput('')
    setMathSuggestions([])
    setShowMath(false)
  }

  const isChemActive = editor?.isActive('chemInline') ?? false

  function openChemPopover() {
    if (isChemActive && editor) {
      setChemInput(editor.getAttributes('chemInline').chem ?? '')
    } else {
      setChemInput('')
    }
    setChemSuggestions([])
    setShowChem(v => !v)
    setShowMath(false)
    setShowSymbols(false)
  }

  function insertChem() {
    if (!chemInput.trim() || !editor) return
    if (isChemActive) {
      editor.chain().focus().updateAttributes('chemInline', { chem: chemInput.trim() }).run()
    } else {
      editor.chain().focus().insertContent({ type: 'chemInline', attrs: { chem: chemInput.trim() } }).run()
    }
    setChemInput('')
    setChemSuggestions([])
    setShowChem(false)
  }

  function insertSymbol(sym: string) {
    editor?.chain().focus().insertContent(sym).run()
    setShowSymbols(false)
  }

  function closeAll() {
    setShowMath(false)
    setShowChem(false)
    setShowSymbols(false)
    setMathSuggestions([])
    setChemSuggestions([])
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

      {/* LaTeX equation */}
      <span className="rtebar-group">
        <button
          type="button"
          className={`rtebar-btn${showMath ? ' rtebar-btn--on' : ''}`}
          data-tutorial-id="math-editor"
          title="Insert equation (LaTeX)"
          disabled={!editor}
          onMouseDown={e => { e.preventDefault(); setShowMath(v => !v); setShowChem(false); setShowSymbols(false) }}
        >Σ</button>
        {showMath && (
          <div className="rtebar-popover">
            <span className="rtebar-popover-label">LaTeX equation</span>
            <input
              className="rtebar-math-input"
              value={mathInput}
              onChange={e => onMathInputChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && insertMath()}
              placeholder="e.g. E=mc^2  or  \frac{v}{f}"
              autoFocus
            />
            {mathSuggestions.length > 0 && (
              <div className="rtebar-suggestions">
                {mathSuggestions.map((eq, i) => (
                  <button
                    key={i}
                    type="button"
                    className="rtebar-suggestion"
                    onMouseDown={e => { e.preventDefault(); setMathInput(eq.latex); setMathSuggestions([]) }}
                  >
                    <span className="rtebar-suggestion-name">{eq.name}</span>
                    <span className="rtebar-suggestion-meta">{eq.topic} · {eq.level}</span>
                    <span className="rtebar-suggestion-latex">{eq.latex}</span>
                  </button>
                ))}
              </div>
            )}
            <button type="button" className="rtebar-math-insert" onClick={insertMath}>Insert</button>
          </div>
        )}
      </span>

      {/* Chemistry notation */}
      <span className="rtebar-group">
        <button
          type="button"
          className={`rtebar-btn${showChem || isChemActive ? ' rtebar-btn--on' : ''}`}
          data-tutorial-id="chem-editor"
          title={isChemActive ? 'Edit chemical formula' : 'Insert chemical formula or equation'}
          disabled={!editor}
          onMouseDown={e => { e.preventDefault(); openChemPopover() }}
        >⚗</button>
        {showChem && (
          <div className="rtebar-popover rtebar-chem-popover">
            <span className="rtebar-popover-label">
              {isChemActive ? 'Edit chemical formula' : 'Chemical formula / equation'}
            </span>
            <input
              className="rtebar-math-input"
              value={chemInput}
              onChange={e => onChemInputChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && insertChem()}
              placeholder="e.g. H2O  or  2H2 + O2 -> 2H2O"
              autoFocus
            />
            {chemSuggestions.length > 0 && (
              <div className="rtebar-suggestions">
                {chemSuggestions.map((entry, i) => (
                  <button
                    key={i}
                    type="button"
                    className="rtebar-suggestion"
                    onMouseDown={e => { e.preventDefault(); setChemInput(entry.formula); setChemSuggestions([]) }}
                  >
                    <span className="rtebar-suggestion-name">{entry.name}</span>
                    <span className="rtebar-suggestion-meta">{entry.type}{entry.topic ? ` · ${entry.topic}` : ''}</span>
                    <span className="rtebar-suggestion-formula">{entry.formula}</span>
                  </button>
                ))}
              </div>
            )}
            {chemInput && (
              <span
                className="rtebar-chem-live-preview"
                dangerouslySetInnerHTML={{ __html: chemPreviewHtml(chemInput) }}
              />
            )}
            <div className="rtebar-chem-examples">
              {CHEM_EXAMPLES.map(ex => (
                <button
                  key={ex.value}
                  type="button"
                  className="rtebar-chem-example"
                  onMouseDown={e => { e.preventDefault(); setChemInput(ex.value) }}
                  title={ex.value}
                >{ex.label}</button>
              ))}
            </div>
            <div className="rtebar-chem-hints">
              <span><code>-&gt;</code> one-way</span>
              <span><code>&lt;=&gt;</code> reversible</span>
              <span><code>H2O</code> subscripts</span>
              <span><code>Ca^2+</code> charges</span>
            </div>
            <button type="button" className="rtebar-math-insert" onClick={insertChem}>
              {isChemActive ? 'Update' : 'Insert'}
            </button>
          </div>
        )}
      </span>

      {/* Symbol picker */}
      <span className="rtebar-group">
        <button
          type="button"
          className={`rtebar-btn${showSymbols ? ' rtebar-btn--on' : ''}`}
          data-tutorial-id="symbol-picker"
          title="Insert symbol"
          disabled={!editor}
          onMouseDown={e => { e.preventDefault(); setShowSymbols(v => !v); closeAll(); setShowSymbols(true) }}
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
