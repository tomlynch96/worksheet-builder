import type { DiagramVariable, FigureDiagram } from '../types/diagram'

const PLACEHOLDER_RE = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g

// Strip anything executable or external from AI-generated SVG. Diagrams are only
// ever shown through <img>, which already blocks scripts, but the template is
// stored and shared across users so we keep it clean at rest too.
export function sanitizeSvg(raw: string): string {
  const doc = new DOMParser().parseFromString(raw.trim(), 'image/svg+xml')
  const root = doc.documentElement
  if (root.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) {
    throw new Error('The AI did not return a valid SVG diagram. Try again or rephrase.')
  }
  root.querySelectorAll('script, foreignObject, iframe, object, embed').forEach(el => el.remove())
  const walk = (el: Element) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim().toLowerCase()
      if (name.startsWith('on')) el.removeAttribute(attr.name)
      else if ((name === 'href' || name === 'xlink:href') && !value.startsWith('#')) el.removeAttribute(attr.name)
    }
    Array.from(el.children).forEach(walk)
  }
  walk(root)
  if (!root.getAttribute('xmlns')) root.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  return new XMLSerializer().serializeToString(root)
}

export function placeholderKeys(template: string): string[] {
  return Array.from(new Set(Array.from(template.matchAll(PLACEHOLDER_RE), m => m[1])))
}

// Keep the variable list in step with the placeholders actually in the template.
export function syncVariables(template: string, variables: DiagramVariable[]): DiagramVariable[] {
  return placeholderKeys(template).map(key =>
    variables.find(v => v.key === key) ?? { key, label: key, value: key, unit: '' },
  )
}

export function formatValue(v: DiagramVariable): string {
  const unit = v.unit?.trim()
  if (!unit) return v.value
  // Degrees hug the number (30°); everything else takes a space (2.0 m)
  return unit.startsWith('°') ? `${v.value}${unit}` : `${v.value} ${unit}`
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function renderDiagram(template: string, variables: DiagramVariable[]): string {
  return template.replace(PLACEHOLDER_RE, (whole, key: string) => {
    const v = variables.find(x => x.key === key)
    return v ? escapeXml(formatValue(v)) : whole
  })
}

// Substitute {{key}} tokens in plain text (question stems, mark schemes).
export function fillText(text: string, variables: DiagramVariable[]): string {
  return text.replace(PLACEHOLDER_RE, (whole, key: string) => {
    const v = variables.find(x => x.key === key)
    return v ? formatValue(v) : whole
  })
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function svgSize(svg: string): { width: number; height: number } {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement
  const vb = root.getAttribute('viewBox')?.split(/[\s,]+/).map(Number)
  if (vb && vb.length === 4 && vb[2] > 0 && vb[3] > 0) return { width: vb[2], height: vb[3] }
  const w = parseFloat(root.getAttribute('width') ?? '')
  const h = parseFloat(root.getAttribute('height') ?? '')
  return { width: w > 0 ? w : 600, height: h > 0 ? h : 400 }
}

// PNG render for consumers that can't draw SVG (react-pdf). White background
// so it prints cleanly; 3× for crisp lines on A4.
export function rasterizeSvg(svg: string, scale = 3): Promise<string> {
  const { width, height } = svgSize(svg)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas unavailable')); return }
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Could not render the diagram.'))
    img.src = svgDataUrl(svg)
  })
}

// Everything a FigureBlock needs when its diagram changes.
export async function figureUpdatesForDiagram(diagram: FigureDiagram) {
  const rendered = renderDiagram(diagram.template, diagram.variables)
  const imageData = await rasterizeSvg(rendered)
  return { diagram, imageData, imageUrl: undefined }
}
