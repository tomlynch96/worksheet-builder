import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import katex from 'katex'
import 'katex/contrib/mhchem'

function renderChem(chem: string): string {
  if (!chem.trim()) return ''
  return katex.renderToString(`\\ce{${chem}}`, {
    throwOnError: false,
    displayMode: false,
    output: 'mathml',
  })
}

function ChemView({ node, updateAttributes }: NodeViewProps) {
  const chem = (node.attrs as { chem: string }).chem || ''
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const displayRef = useRef<HTMLSpanElement>(null)

  function openEdit(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDraft(chem)
    if (displayRef.current) {
      const r = displayRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left })
    }
    setEditing(true)
  }

  function save() {
    const trimmed = draft.trim()
    if (trimmed) updateAttributes({ chem: trimmed })
    setEditing(false)
  }

  function cancel() {
    setEditing(false)
  }

  // Close popover on outside click
  useEffect(() => {
    if (!editing) return
    function handle(e: MouseEvent) {
      const popover = document.querySelector('.chem-popover')
      if (popover && !popover.contains(e.target as Node)) cancel()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [editing])

  const displayHtml = renderChem(chem)
  const previewHtml = renderChem(draft)

  return (
    <NodeViewWrapper as="span" className="math-node" contentEditable={false}>
      <span
        ref={displayRef}
        className={`chem-display${editing ? ' chem-display--editing' : ''}`}
        dangerouslySetInnerHTML={{ __html: displayHtml || chem }}
        onClick={openEdit}
        title="Click to edit"
      />
      {editing && createPortal(
        <div
          className="chem-popover"
          style={{ top: pos.top, left: pos.left }}
          onMouseDown={e => e.stopPropagation()}
        >
          <span className="chem-popover-label">Edit formula</span>
          <input
            className="chem-popover-input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); save() }
              if (e.key === 'Escape') { cancel() }
            }}
            autoFocus
          />
          {previewHtml && (
            <span
              className="chem-popover-preview"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
          <span className="chem-popover-actions">
            <button
              type="button"
              className="chem-popover-save"
              onMouseDown={e => { e.preventDefault(); save() }}
            >Save</button>
            <button
              type="button"
              className="chem-popover-cancel"
              onMouseDown={e => { e.preventDefault(); cancel() }}
            >Cancel</button>
          </span>
        </div>,
        document.body
      )}
    </NodeViewWrapper>
  )
}

export const ChemInline = Node.create({
  name: 'chemInline',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      chem: {
        default: '',
        parseHTML: el => el.getAttribute('data-chem') ?? '',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="chem"]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-type': 'chem',
      'data-chem': node.attrs.chem,
    })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChemView)
  },
})
