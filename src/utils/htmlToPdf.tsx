/* eslint-disable @typescript-eslint/no-explicit-any */
import { Text } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

// ── LaTeX → Unicode converter ─────────────────────────────
// Covers the notation commonly used in secondary science worksheets.

const SUP: Record<string, string> = {
  '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
  '+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾',
  'a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ','h':'ʰ','i':'ⁱ',
  'j':'ʲ','k':'ᵏ','l':'ˡ','m':'ᵐ','n':'ⁿ','o':'ᵒ','p':'ᵖ','r':'ʳ','s':'ˢ',
  't':'ᵗ','u':'ᵘ','v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ',
}
const SUB: Record<string, string> = {
  '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
  '+':'₊','-':'₋','=':'₌','(':'₍',')':'₎',
  'a':'ₐ','e':'ₑ','i':'ᵢ','o':'ₒ','u':'ᵤ','r':'ᵣ','v':'ᵥ','x':'ₓ','n':'ₙ',
}
function toSup(s: string): string { return s.split('').map(c => SUP[c] ?? c).join('') }
function toSub(s: string): string { return s.split('').map(c => SUB[c] ?? c).join('') }

const GREEK: Record<string, string> = {
  alpha:'α', beta:'β', gamma:'γ', delta:'δ', epsilon:'ε', varepsilon:'ε',
  theta:'θ', lambda:'λ', mu:'μ', nu:'ν', pi:'π', rho:'ρ', sigma:'σ',
  phi:'φ', varphi:'φ', psi:'ψ', omega:'ω',
  Omega:'Ω', Delta:'Δ', Sigma:'Σ', Pi:'Π', Gamma:'Γ', Lambda:'Λ',
  Theta:'Θ', Phi:'Φ',
}
const OPS: Record<string, string> = {
  times:'×', div:'÷', pm:'±', mp:'∓',
  approx:'≈', neq:'≠', ne:'≠', leq:'≤', geq:'≥', le:'≤', ge:'≥',
  cdot:'·', cdots:'···', ldots:'…',
  rightarrow:'→', leftarrow:'←', Rightarrow:'⇒', leftrightarrow:'↔',
  rightleftharpoons:'⇌',
  infty:'∞', propto:'∝', sim:'∼', equiv:'≡', degree:'°',
}

export function latexToUnicode(latex: string): string {
  let s = latex
  // Named replacements first (longest match wins by iterating all)
  for (const [cmd, chr] of Object.entries({ ...GREEK, ...OPS })) {
    s = s.replace(new RegExp(`\\\\${cmd}(?![a-zA-Z])`, 'g'), chr)
  }
  // \frac{num}{den} → (num)/(den)  — handle simple one-level fractions
  s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
  // \sqrt{x} → √(x)
  s = s.replace(/\\sqrt\{([^}]*)\}/g, '√($1)')
  // ^{...} superscript groups
  s = s.replace(/\^\{([^}]*)\}/g, (_, n) => toSup(n))
  // ^x single char superscript
  s = s.replace(/\^([0-9a-zA-Z+\-(])/g, (_, c) => toSup(c))
  // _{...} subscript groups
  s = s.replace(/_\{([^}]*)\}/g, (_, n) => toSub(n))
  // _x single char subscript
  s = s.replace(/_([0-9a-zA-Z])/g, (_, c) => toSub(c))
  // Remove any remaining LaTeX commands
  s = s.replace(/\\[a-zA-Z]+/g, '')
  // Remove stray braces
  s = s.replace(/[{}]/g, '')
  return s.replace(/\s+/g, ' ').trim()
}

// ── HTML → react-pdf elements ─────────────────────────────

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
          out.push(<Text key={k} style={{ ...style, fontFamily: 'Helvetica-Oblique' }}>{latexToUnicode(latex)}</Text>)
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
