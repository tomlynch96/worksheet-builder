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

function ChemView({ node, selected }: NodeViewProps) {
  const chem = (node.attrs as { chem: string }).chem || ''
  const html = renderChem(chem)
  return (
    <NodeViewWrapper as="span" className="math-node" contentEditable={false}>
      <span
        className={selected ? 'chem-selected' : ''}
        dangerouslySetInnerHTML={{ __html: html || chem }}
        title="Click to select · use ⚗ in toolbar to edit"
      />
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
