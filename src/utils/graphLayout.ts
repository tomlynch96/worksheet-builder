export interface GraphPoint { x: number; y: number }
export interface Tick { value: number; label: string }

export interface GraphLayout {
  xTicks: Tick[]
  yTicks: Tick[]
  xMin: number; xMax: number; yMin: number; yMax: number
  points: GraphPoint[]
  bestFitLine?: { x1: number; y1: number; x2: number; y2: number }
}

function niceInterval(range: number, targetTicks = 5): number {
  const raw = range / targetTicks
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const frac = raw / mag
  const nice = frac < 1.5 ? 1 : frac < 3.5 ? 2 : frac < 7.5 ? 5 : 10
  return nice * mag
}

function niceMin(val: number, step: number) { return Math.floor(val / step) * step }
function niceMax(val: number, step: number) { return Math.ceil(val / step) * step }

export function computeGraphLayout(
  rows: string[][],
  xCol: number,
  yCol: number,
  omitRows: number[],
): GraphLayout {
  const omitSet = new Set(omitRows)
  const raw: GraphPoint[] = rows
    .filter((_, i) => !omitSet.has(i))
    .map(r => ({ x: parseFloat(r[xCol] || '0'), y: parseFloat(r[yCol] || '0') }))
    .filter(p => isFinite(p.x) && isFinite(p.y))

  if (raw.length < 2) {
    return { xTicks: [], yTicks: [], xMin: 0, xMax: 10, yMin: 0, yMax: 10, points: raw }
  }

  const xs = raw.map(p => p.x)
  const ys = raw.map(p => p.y)
  const xRange = Math.max(...xs) - Math.min(...xs) || 1
  const yRange = Math.max(...ys) - Math.min(...ys) || 1

  const xStep = niceInterval(xRange)
  const yStep = niceInterval(yRange)

  const xMin = Math.min(0, niceMin(Math.min(...xs), xStep))
  const xMax = niceMax(Math.max(...xs), xStep)
  const yMin = Math.min(0, niceMin(Math.min(...ys), yStep))
  const yMax = niceMax(Math.max(...ys), yStep)

  const xTicks: Tick[] = []
  for (let v = xMin; v <= xMax + xStep * 0.01; v += xStep) {
    const rounded = Math.round(v * 1e9) / 1e9
    xTicks.push({ value: rounded, label: String(rounded) })
  }
  const yTicks: Tick[] = []
  for (let v = yMin; v <= yMax + yStep * 0.01; v += yStep) {
    const rounded = Math.round(v * 1e9) / 1e9
    yTicks.push({ value: rounded, label: String(rounded) })
  }

  // Linear regression for best fit
  const n = raw.length
  const sumX = raw.reduce((a, p) => a + p.x, 0)
  const sumY = raw.reduce((a, p) => a + p.y, 0)
  const sumXY = raw.reduce((a, p) => a + p.x * p.y, 0)
  const sumXX = raw.reduce((a, p) => a + p.x * p.x, 0)
  const denom = n * sumXX - sumX * sumX
  let bestFitLine: GraphLayout['bestFitLine'] | undefined
  if (Math.abs(denom) > 1e-10) {
    const m = (n * sumXY - sumX * sumY) / denom
    const b = (sumY - m * sumX) / n
    bestFitLine = { x1: xMin, y1: m * xMin + b, x2: xMax, y2: m * xMax + b }
  }

  return { xTicks, yTicks, xMin, xMax, yMin, yMax, points: raw, bestFitLine }
}

export function toSvgCoords(
  val: { x: number; y: number },
  layout: GraphLayout,
  plotW: number,
  plotH: number,
): { cx: number; cy: number } {
  const cx = ((val.x - layout.xMin) / (layout.xMax - layout.xMin)) * plotW
  const cy = plotH - ((val.y - layout.yMin) / (layout.yMax - layout.yMin)) * plotH
  return { cx, cy }
}
