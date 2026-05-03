import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import katex from 'katex'

function MathView({ node }: NodeViewProps) {
  const latex = (node.attrs as { latex: string }).latex || ''
  const html = katex.renderToString(latex, {
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

export const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: el => el.getAttribute('data-latex') ?? '',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="math"]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-type': 'math',
      'data-latex': node.attrs.latex,
    })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathView)
  },
})
