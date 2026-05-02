/* eslint-disable @typescript-eslint/no-explicit-any */
import { Text } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

function nodesToPdf(nodes: NodeList, style: any, key = ''): ReactElement[] {
  const out: ReactElement[] = []

  nodes.forEach((node, i) => {
    const k = `${key}-${i}`

    if (node.nodeType === 3) {
      const text = node.textContent ?? ''
      if (text) out.push(<Text key={k} style={style}>{text}</Text>)
      return
    }
    if (node.nodeType !== 1) return

    const el = node as Element
    const tag = el.tagName.toLowerCase()

    switch (tag) {
      case 'strong':
      case 'b': {
        const st = { ...style, fontFamily: 'Helvetica-Bold' }
        out.push(<Text key={k} style={st}>{nodesToPdf(el.childNodes, st, k)}</Text>)
        break
      }
      case 'em':
      case 'i': {
        const st = { ...style, fontStyle: 'italic' }
        out.push(<Text key={k} style={st}>{nodesToPdf(el.childNodes, st, k)}</Text>)
        break
      }
      case 'u': {
        const st = { ...style, textDecoration: 'underline' }
        out.push(<Text key={k} style={st}>{nodesToPdf(el.childNodes, st, k)}</Text>)
        break
      }
      case 'sub': {
        const st = { ...style, fontSize: ((style.fontSize as number) || 11) * 0.72 }
        out.push(<Text key={k} style={st}>{nodesToPdf(el.childNodes, st, k)}</Text>)
        break
      }
      case 'sup': {
        const st = { ...style, fontSize: ((style.fontSize as number) || 11) * 0.72 }
        out.push(<Text key={k} style={st}>{nodesToPdf(el.childNodes, st, k)}</Text>)
        break
      }
      case 'br':
        out.push(<Text key={k} style={style}>{'\n'}</Text>)
        break
      case 'p':
        out.push(<Text key={k} style={style}>{nodesToPdf(el.childNodes, style, k)}{'\n'}</Text>)
        break
      case 'span':
        if (el.getAttribute('data-type') === 'math') {
          const latex = el.getAttribute('data-latex') || ''
          out.push(<Text key={k} style={{ ...style, fontFamily: 'Courier', fontSize: ((style.fontSize as number) || 11) * 0.9 }}>{latex}</Text>)
        } else {
          out.push(...nodesToPdf(el.childNodes, style, k))
        }
        break
      default:
        out.push(...nodesToPdf(el.childNodes, style, k))
    }
  })

  return out
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim()
}

export function htmlToPdf(html: string, style: any = {}): ReactElement {
  if (!html || html === '<p></p>') return <Text style={style}></Text>

  if (typeof window !== 'undefined' && window.DOMParser) {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const elements = nodesToPdf(doc.body.childNodes, style, 'root')
    // Remove trailing newline paragraph
    const trimmed = elements.length > 0 && (elements[elements.length - 1].props as any).children === '\n'
      ? elements.slice(0, -1)
      : elements
    return <Text style={style}>{trimmed}</Text>
  }

  return <Text style={style}>{stripTags(html)}</Text>
}
