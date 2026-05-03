import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import katex from 'katex'
import 'katex/contrib/mhchem'

function ChemView({ node }: NodeViewProps) {
  const chem = (node.attrs as { chem: string }).chem || ''
  const html = katex.renderToString(`\\ce{${chem}}`, {
    throwOnError: false,
    displayMode: false,
    output: 'mathml',
  })
  return (
    <NodeViewWrapper as="span" className="math-node" contentEditable={false}>
      <span dangerouslySetInnerHTML={{ __html: html }} />
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
