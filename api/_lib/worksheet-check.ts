// Checks a worksheet written by Claude against everything the site's editor and print
// view rely on, before it is saved. Safe, unambiguous gaps are filled in (missing part
// and item ids, part labels, display defaults). Anything that needs a judgement (a
// broken reference, a spec ref that isn't in the taxonomy, unsafe SVG) is reported back
// as an error so Claude fixes it, rather than the server guessing.
import { randomUUID } from 'node:crypto'
import { findBoard, findCourse, findSpec, searchSpec } from './taxonomy.js'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Obj = Record<string, any>

export interface CheckedWorksheet {
  id: string
  blocks: Obj[]
  showLines?: boolean
}

export interface WorksheetSummary {
  title: string
  topic: string
  qualification: string
  examBoard: string
  tier: string
  specPoint: string
  specTitle: string
  totalMarks: number
  questionCount: number
  blockCount: number
  diagramCount: number
}

export interface CheckResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  worksheet: CheckedWorksheet
  summary: WorksheetSummary
}

const BLOCK_TYPES = new Set([
  'header', 'instructions', 'question', 'worked_example', 'figure', 'spacer', 'information',
  'match_them_up', 'cloze', 'order_steps', 'multiple_choice', 'data', 'numerical_answers',
])
const NUMBERED = new Set(['question', 'multiple_choice', 'match_them_up', 'cloze', 'order_steps'])
const FIGURE_HOSTS = new Set(['question', 'multiple_choice', 'information', 'worked_example', 'cloze', 'match_them_up', 'order_steps'])
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PLACEHOLDER_RE = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g
const MAX_BLOCKS = 150
const MAX_JSON_BYTES = 1_500_000

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim()
const clozeBlanks = (text: string) => (text.match(/\[([^\]]+)\]/g) ?? []).length

export function blockMarks(b: Obj): number {
  switch (b.type) {
    case 'question': return Array.isArray(b.parts) && b.parts.length
      ? b.parts.reduce((s: number, p: Obj) => s + (isNum(p.marks) ? p.marks : 0), 0)
      : (isNum(b.marks) ? b.marks : 0)
    case 'multiple_choice': return isNum(b.marks) ? b.marks : 0
    case 'match_them_up': return Array.isArray(b.items) ? b.items.length : 0
    case 'cloze': return isStr(b.text) ? clozeBlanks(b.text) : 0
    case 'order_steps': return Array.isArray(b.steps) ? b.steps.length : 0
    default: return 0
  }
}

// Text that looks like it carries its own numbering or marks, which the site adds itself.
function lintText(text: unknown, where: string, warnings: string[], isPart = false) {
  if (!isStr(text) || !text) return
  const t = strip(text)
  if (/^\s*(Q(uestion)?\s*)?\d+\s*[.)]\s/i.test(t)) warnings.push(`${where}: starts with a question number; the site numbers questions itself.`)
  if (/[[(]\s*\d+\s*marks?\s*[\])]/i.test(t)) warnings.push(`${where}: contains marks like "[2 marks]"; put marks in the marks field instead.`)
  if (isPart && /^\s*\(?[a-h]\)\s|^\s*\([ivx]+\)\s/i.test(t)) warnings.push(`${where}: starts with a part label; use the part's "label" field instead.`)
}

function svgProblems(svg: string): string[] {
  const problems: string[] = []
  const s = svg.trim()
  if (!/^<svg[\s>]/i.test(s) || !/<\/svg>\s*$/i.test(s)) problems.push('must be a single <svg>…</svg> element')
  if (!/viewBox\s*=/.test(s)) problems.push('needs a viewBox')
  if (/<\s*(script|foreignObject|iframe|object|embed|image|style|link|meta)\b/i.test(s)) problems.push('contains a forbidden element (script, foreignObject, image, style, iframe, object, embed or link)')
  if (/\son[a-z]+\s*=/i.test(s)) problems.push('contains an event attribute (on…=)')
  for (const m of s.matchAll(/(?:xlink:)?href\s*=\s*["']([^"']*)["']/gi)) {
    if (!m[1].trim().startsWith('#')) { problems.push(`contains an external link (href="${m[1].slice(0, 40)}"); only "#id" references are allowed`); break }
  }
  if (/url\(\s*['"]?(?!#)/i.test(s)) problems.push('contains a url(...) that is not a "#id" reference')
  if (s.length > 200_000) problems.push('is too large (keep it under 200 KB)')
  return problems
}

export function checkWorksheet(input: unknown): CheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  const emptySummary: WorksheetSummary = {
    title: '', topic: '', qualification: '', examBoard: '', tier: '', specPoint: '', specTitle: '',
    totalMarks: 0, questionCount: 0, blockCount: 0, diagramCount: 0,
  }
  const fail = (msg: string): CheckResult => ({ ok: false, errors: [msg], warnings, worksheet: { id: '', blocks: [] }, summary: emptySummary })

  if (!isObj(input)) return fail('The worksheet must be an object: { "id"?: "<uuid>", "blocks": [ … ] }.')
  if (JSON.stringify(input).length > MAX_JSON_BYTES) return fail('The worksheet is too large (over 1.5 MB). Reduce diagram size or split it into two sheets.')
  if (!Array.isArray(input.blocks) || input.blocks.length === 0) return fail('"blocks" must be a non-empty array.')
  if (input.blocks.length > MAX_BLOCKS) return fail(`Too many blocks (${input.blocks.length}); the limit is ${MAX_BLOCKS}.`)

  let id: string
  if (input.id === undefined || input.id === null || input.id === '') id = randomUUID()
  else if (isStr(input.id) && UUID_RE.test(input.id)) id = input.id.toLowerCase()
  else return fail('"id" must be a UUID, or left out for a new worksheet.')

  // Work on a deep copy so the caller's object is never mutated.
  const blocks: Obj[] = JSON.parse(JSON.stringify(input.blocks))
  const ids = new Map<string, string>()   // id → where it was first seen
  const claimId = (value: unknown, where: string, fallback: () => string): string => {
    let v = isStr(value) && value.trim() ? value.trim() : ''
    if (!v) v = fallback()
    if (ids.has(v)) {
      errors.push(`${where}: id "${v}" is already used by ${ids.get(v)}. Every id in the worksheet must be unique.`)
    } else ids.set(v, where)
    return v
  }
  let autoId = 0
  const genId = (prefix: string) => {
    let v: string
    do v = `${prefix}-auto-${++autoId}`; while (ids.has(v))
    return v
  }

  const label = (i: number, b: Obj) => `blocks[${i}]${isStr(b?.id) && b.id ? ` (${b.id})` : ''}${isStr(b?.type) ? ` ${b.type}` : ''}`

  // ── Pass 1: structure and safe normalisation ────────────────────────────────
  blocks.forEach((b, i) => {
    if (!isObj(b)) { errors.push(`blocks[${i}]: must be an object.`); return }
    const where = label(i, b)
    if (!isStr(b.type) || !BLOCK_TYPES.has(b.type)) {
      errors.push(`${where}: unknown block type "${b.type}". Allowed: ${[...BLOCK_TYPES].join(', ')}.`)
      return
    }
    b.id = claimId(b.id, where, () => genId(b.type.slice(0, 3)))

    switch (b.type) {
      case 'header': {
        if (i !== 0) errors.push(`${where}: the header must be the first block, and there must be only one.`)
        if (!isStr(b.title) || !b.title.trim()) errors.push(`${where}: "title" is required.`)
        if (!isStr(b.topic)) b.topic = ''
        for (const k of ['showName', 'showDate', 'showClass'] as const) if (typeof b[k] !== 'boolean') b[k] = true
        if (!['foundation', 'higher', 'both'].includes(b.tier)) errors.push(`${where}: "tier" must be "foundation", "higher" or "both".`)
        if (b.exam !== undefined) {
          if (!isObj(b.exam) || !Array.isArray(b.exam.instructions) || !Array.isArray(b.exam.information)) {
            errors.push(`${where}: "exam" must have "instructions" and "information" arrays (or be left out).`)
          }
        }
        break
      }
      case 'instructions':
        if (!Array.isArray(b.items) || !b.items.every(isStr)) errors.push(`${where}: "items" must be an array of strings.`)
        break
      case 'information':
        if (!isStr(b.heading)) b.heading = ''
        if (!isStr(b.content) || !strip(b.content)) errors.push(`${where}: "content" is required (HTML, one <p> per fact).`)
        break
      case 'worked_example':
        if (!isStr(b.title)) b.title = 'Worked example'
        if (!Array.isArray(b.steps) || !b.steps.length || !b.steps.every(isStr)) errors.push(`${where}: "steps" must be a non-empty array of strings.`)
        break
      case 'question': {
        lintText(b.stem, `${where} stem`, warnings)
        if (!isStr(b.stem)) b.stem = ''
        if (!Array.isArray(b.parts)) b.parts = []
        for (const k of ['attachedDataId', 'attachedDataIds'] as const) if (b[k] === undefined) b[k] = null
        if (b.parts.length) {
          if (!strip(b.stem)) warnings.push(`${where}: multi-part question has an empty stem; give the shared context there.`)
          if (b.marks || b.lines) warnings.push(`${where}: a multi-part question's own marks and lines are ignored; set them on the parts. (Set to 0.)`)
          b.marks = 0; b.lines = 0
          if (!isStr(b.markScheme)) b.markScheme = ''
          if (!isStr(b.numericalAnswer)) b.numericalAnswer = ''
          b.parts.forEach((p: Obj, pi: number) => {
            const pw = `${where} parts[${pi}]`
            if (!isObj(p)) { errors.push(`${pw}: must be an object.`); return }
            p.id = claimId(p.id, pw, () => genId('part'))
            const expected = String.fromCharCode(97 + pi)
            if (!isStr(p.label) || !p.label.trim()) p.label = expected
            if (!isStr(p.stem) || !strip(p.stem)) errors.push(`${pw}: "stem" is required.`)
            lintText(p.stem, `${pw} stem`, warnings, true)
            if (!isNum(p.marks) || p.marks < 0) errors.push(`${pw}: "marks" must be a number of 0 or more.`)
            if (!isNum(p.lines) || p.lines < 0) errors.push(`${pw}: "lines" must be a number of 0 or more.`)
            if (isNum(p.marks) && p.marks > 0 && (!isStr(p.markScheme) || !strip(p.markScheme))) warnings.push(`${pw}: no mark scheme.`)
            if (!isStr(p.numericalAnswer)) p.numericalAnswer = ''
            if (p.numericalAnswer && !/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(p.numericalAnswer.trim())) warnings.push(`${pw}: numericalAnswer "${p.numericalAnswer}" should be a bare number with no units.`)
            for (const k of ['attachedDataId', 'attachedDataIds'] as const) if (p[k] === undefined) p[k] = null
          })
        } else {
          if (!strip(b.stem)) errors.push(`${where}: "stem" is required.`)
          if (!isNum(b.marks) || b.marks < 0) errors.push(`${where}: "marks" must be a number of 0 or more.`)
          if (!isNum(b.lines) || b.lines < 0) errors.push(`${where}: "lines" must be a number of 0 or more.`)
          if (isNum(b.marks) && b.marks > 0 && (!isStr(b.markScheme) || !strip(b.markScheme))) warnings.push(`${where}: no mark scheme.`)
          if (!isStr(b.numericalAnswer)) b.numericalAnswer = ''
          if (b.numericalAnswer && !/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(b.numericalAnswer.trim())) warnings.push(`${where}: numericalAnswer "${b.numericalAnswer}" should be a bare number with no units.`)
        }
        break
      }
      case 'multiple_choice': {
        lintText(b.stem, `${where} stem`, warnings)
        if (!isStr(b.stem) || !strip(b.stem)) errors.push(`${where}: "stem" is required.`)
        if (!Array.isArray(b.options) || b.options.length < 2 || b.options.length > 6 || !b.options.every(isStr)) {
          errors.push(`${where}: "options" must be 2–6 strings.`)
          break
        }
        const n = b.options.length
        if (!Number.isInteger(b.correctIndex) || b.correctIndex < 0 || b.correctIndex >= n) errors.push(`${where}: "correctIndex" must be 0–${n - 1} (zero-based).`)
        if (b.correctIndices !== undefined && (!Array.isArray(b.correctIndices) || !b.correctIndices.every((x: unknown) => Number.isInteger(x) && (x as number) >= 0 && (x as number) < n))) {
          errors.push(`${where}: "correctIndices" must be zero-based option indices.`)
        }
        if (!isNum(b.marks)) b.marks = 1
        if (!isStr(b.markScheme)) b.markScheme = ''
        break
      }
      case 'cloze':
        if (!isStr(b.heading)) b.heading = 'Fill in the blanks.'
        if (!isStr(b.text) || clozeBlanks(b.text) === 0) errors.push(`${where}: "text" must mark each blank with [square brackets].`)
        else if (/<[a-z][^>]*>/i.test(b.text)) errors.push(`${where}: "text" must be plain text (no HTML).`)
        if (typeof b.showWordBank !== 'boolean') b.showWordBank = true
        break
      case 'match_them_up':
        if (!isStr(b.heading)) b.heading = 'Match each term to its definition.'
        if (!Array.isArray(b.items) || b.items.length < 2) { errors.push(`${where}: "items" needs at least 2 pairs.`); break }
        b.items.forEach((it: Obj, ii: number) => {
          const iw = `${where} items[${ii}]`
          if (!isObj(it)) { errors.push(`${iw}: must be an object.`); return }
          it.id = claimId(it.id, iw, () => genId('item'))
          if (!isStr(it.left) || !strip(it.left) || !isStr(it.right) || !strip(it.right)) errors.push(`${iw}: needs a non-empty "left" and "right".`)
        })
        break
      case 'order_steps':
        if (!isStr(b.heading)) b.heading = 'Put these steps in the correct order.'
        if (!Array.isArray(b.steps) || b.steps.length < 2 || !b.steps.every(isStr)) errors.push(`${where}: "steps" must be at least 2 strings, in the correct order.`)
        break
      case 'spacer':
        if (!['small', 'medium', 'large'].includes(b.size)) b.size = 'medium'
        break
      case 'numerical_answers':
        if (!isStr(b.heading)) b.heading = 'Numerical answers'
        break
      case 'figure': {
        if (!isStr(b.caption)) b.caption = ''
        if (!['small', 'medium', 'large'].includes(b.size)) b.size = 'medium'
        if (b.imageData !== undefined || b.imageUrl !== undefined) {
          warnings.push(`${where}: imageData/imageUrl are removed; supply a "diagram" or a "diagramRequest" instead.`)
          delete b.imageData; delete b.imageUrl
        }
        if (b.diagram !== undefined) {
          const d = b.diagram
          if (!isObj(d) || !isStr(d.template)) { errors.push(`${where}: "diagram.template" must be an SVG string.`); break }
          const problems = svgProblems(d.template)
          for (const p of problems) errors.push(`${where}: diagram SVG ${p}.`)
          if (!Array.isArray(d.variables)) d.variables = []
          const keys = [...new Set(Array.from(d.template.matchAll(PLACEHOLDER_RE), m => m[1]))]
          const varKeys = d.variables.filter(isObj).map((v: Obj) => v.key)
          for (const k of keys) if (!varKeys.includes(k)) errors.push(`${where}: diagram uses {{${k}}} but has no variable with key "${k}".`)
          for (const k of varKeys) if (!keys.includes(k)) warnings.push(`${where}: diagram variable "${k}" isn't used in the SVG (removed).`)
          d.variables = d.variables
            .filter((v: Obj) => isObj(v) && keys.includes(v.key))
            .map((v: Obj) => ({ key: v.key, label: isStr(v.label) && v.label ? v.label : v.key, value: String(v.value ?? ''), unit: isStr(v.unit) ? v.unit : '' }))
          delete d.libraryId   // only the site sets this, when the diagram is shared to the library
          if (b.diagramRequest) { warnings.push(`${where}: has both a diagram and a diagramRequest; the request was dropped.`); delete b.diagramRequest }
        } else if (!isStr(b.diagramRequest) || !b.diagramRequest.trim()) {
          errors.push(`${where}: a figure needs either a "diagram" (SVG) or a "diagramRequest" (a description for the site to draw).`)
        }
        break
      }
      case 'data': {
        if (!isStr(b.heading)) b.heading = ''
        if (!['table', 'graph', 'bar'].includes(b.display)) errors.push(`${where}: "display" must be "table", "graph" or "bar".`)
        if (!Array.isArray(b.columns) || !b.columns.length || !b.columns.every((c: unknown) => isObj(c) && isStr((c as Obj).label))) {
          errors.push(`${where}: "columns" must be a non-empty array of { "label", "unit" }.`)
          break
        }
        b.columns = b.columns.map((c: Obj) => ({ label: c.label, unit: isStr(c.unit) ? c.unit : '' }))
        if (!Array.isArray(b.rows)) b.rows = []
        b.rows = b.rows.map((r: unknown) => Array.isArray(r) ? r.map(x => (x === null || x === undefined) ? '' : String(x)) : r)
        b.rows.forEach((r: unknown, ri: number) => {
          if (!Array.isArray(r) || r.length !== b.columns.length) errors.push(`${where}: rows[${ri}] must have ${b.columns.length} values, one per column.`)
        })
        if (!Array.isArray(b.hiddenCells)) b.hiddenCells = []
        for (const cell of b.hiddenCells) {
          const m = isStr(cell) && /^(\d+),(\d+)$/.exec(cell)
          if (!m || +m[1] >= b.rows.length || +m[2] >= b.columns.length) errors.push(`${where}: hiddenCells entry "${cell}" must be "row,col" inside the table.`)
        }
        const g = isObj(b.graph) ? b.graph : {}
        b.graph = {
          xCol: Number.isInteger(g.xCol) ? g.xCol : 0,
          yCol: Number.isInteger(g.yCol) ? g.yCol : Math.min(1, b.columns.length - 1),
          showXLabel: g.showXLabel !== false, showYLabel: g.showYLabel !== false,
          showXScale: g.showXScale !== false, showYScale: g.showYScale !== false,
          omitRows: Array.isArray(g.omitRows) ? g.omitRows : [],
          fitType: ['none', 'linear', 'curve'].includes(g.fitType) ? g.fitType : 'none',
          showFitLine: g.showFitLine === true,
          linkedDataId: isStr(g.linkedDataId) && g.linkedDataId ? g.linkedDataId : null,
        }
        if (b.graph.xCol >= b.columns.length || b.graph.yCol >= b.columns.length) errors.push(`${where}: graph xCol/yCol must be column indices 0–${b.columns.length - 1}.`)
        if ((b.display === 'graph' || b.display === 'bar') && !b.graph.linkedDataId && b.rows.length === 0) errors.push(`${where}: a ${b.display} needs its own rows or a graph.linkedDataId pointing at a table.`)
        if (b.graph.linkedDataId && b.rows.length) { warnings.push(`${where}: a linked graph must not repeat the data; its rows were cleared.`); b.rows = [] }
        break
      }
    }
  })

  // ── Pass 2: cross-references ────────────────────────────────────────────────
  const byId = new Map<string, Obj>()
  blocks.forEach(b => { if (isObj(b) && isStr(b.id)) byId.set(b.id, b) })
  const attachedData = new Set<string>()
  const attachedFigures = new Set<string>()

  const checkDataRefs = (o: Obj, where: string) => {
    const refs: string[] = []
    if (o.attachedDataId) refs.push(o.attachedDataId)
    if (Array.isArray(o.attachedDataIds)) refs.push(...o.attachedDataIds)
    else if (o.attachedDataIds !== null && o.attachedDataIds !== undefined) errors.push(`${where}: "attachedDataIds" must be an array or null.`)
    for (const r of refs) {
      const target = byId.get(r)
      if (!target) errors.push(`${where}: attaches data "${r}", but no block has that id.`)
      else if (target.type !== 'data') errors.push(`${where}: attaches "${r}", which is a ${target.type} block, not a data block.`)
      else attachedData.add(r)
    }
  }
  const checkFigureRef = (o: Obj, where: string) => {
    if (!o.attachedFigureId) return
    const target = byId.get(o.attachedFigureId)
    if (!target) errors.push(`${where}: attachedFigureId "${o.attachedFigureId}" doesn't match any block.`)
    else if (target.type !== 'figure') errors.push(`${where}: attachedFigureId "${o.attachedFigureId}" is a ${target.type} block, not a figure.`)
    else attachedFigures.add(o.attachedFigureId)
  }

  blocks.forEach((b, i) => {
    if (!isObj(b)) return
    const where = label(i, b)
    if (b.type === 'question') {
      checkDataRefs(b, where); checkFigureRef(b, where)
      ;(b.parts ?? []).forEach((p: Obj, pi: number) => { if (isObj(p)) { checkDataRefs(p, `${where} parts[${pi}]`); checkFigureRef(p, `${where} parts[${pi}]`) } })
    } else if (FIGURE_HOSTS.has(b.type)) {
      checkFigureRef(b, where)
    }
    if (b.type === 'data' && b.graph?.linkedDataId) {
      const src = byId.get(b.graph.linkedDataId)
      if (!src) errors.push(`${where}: graph.linkedDataId "${b.graph.linkedDataId}" doesn't match any block.`)
      else if (src.type !== 'data' || src.display !== 'table') errors.push(`${where}: graph.linkedDataId must point at a data block with display "table".`)
      else {
        const same = Array.isArray(src.columns) && src.columns.length === b.columns.length &&
          src.columns.every((c: Obj, ci: number) => c.label === b.columns[ci].label)
        if (!same) errors.push(`${where}: a linked graph's "columns" must be an exact copy of table "${src.id}"'s columns.`)
        const n = Array.isArray(src.rows) ? src.rows.length : 0
        for (const r of b.graph.omitRows) if (!Number.isInteger(r) || r < 0 || r >= n) errors.push(`${where}: omitRows entry ${r} is outside table "${src.id}" (rows 0–${n - 1}).`)
      }
    } else if (b.type === 'data') {
      for (const r of b.graph?.omitRows ?? []) if (!Number.isInteger(r) || r < 0 || r >= b.rows.length) errors.push(`${where}: omitRows entry ${r} is outside the table (rows 0–${b.rows.length - 1}).`)
    }
  })

  blocks.forEach((b, i) => {
    if (!isObj(b)) return
    if (b.type === 'data' && !attachedData.has(b.id)) errors.push(`${label(i, b)}: every data block must be attached to a question or part (attachedDataId / attachedDataIds).`)
    if (b.type === 'figure' && !attachedFigures.has(b.id)) warnings.push(`${label(i, b)}: figure isn't attached to any question; it will print on its own.`)
  })

  // ── Pass 3: taxonomy ────────────────────────────────────────────────────────
  const header = isObj(blocks[0]) && blocks[0].type === 'header' ? blocks[0] : null
  if (!header) errors.push('blocks[0]: the first block must be the header.')
  let specTitle = ''
  if (header) {
    const course = isStr(header.qualification) ? findCourse(header.qualification) : undefined
    if (!course) {
      errors.push(`header: "qualification" must be a course id from the site's taxonomy (call list_my_courses or search_spec); got "${header.qualification ?? ''}".`)
    } else if (!isStr(header.examBoard) || !findBoard(course.id, header.examBoard)) {
      errors.push(`header: "${course.id}" isn't offered for exam board "${header.examBoard ?? ''}". Boards: ${course.boards.map(b => b.board).join(', ')}.`)
    } else if (!isStr(header.specPoint) || !header.specPoint.trim()) {
      errors.push('header: "specPoint" is required, so the sheet is filed under the right spec point.')
    } else {
      const spec = findSpec(course.id, header.examBoard, header.specPoint.trim())
      if (!spec) {
        const near = searchSpec(header.specPoint, { qualification: course.id, examBoard: header.examBoard, limit: 5 })
          .concat(searchSpec(`${header.title ?? ''} ${header.topic ?? ''}`, { qualification: course.id, examBoard: header.examBoard, limit: 5 }))
        const uniq = [...new Map(near.map(n => [n.ref, n])).values()].slice(0, 6)
        errors.push(`header: specPoint "${header.specPoint}" isn't in ${header.examBoard} ${course.label}. ` +
          (uniq.length ? `Closest: ${uniq.map(n => `${n.ref} (${n.title})`).join('; ')}.` : 'Use search_spec to find the right ref.'))
      } else {
        header.specPoint = spec.ref
        specTitle = spec.title
        if (spec.kind === 'topic') warnings.push(`header: specPoint "${spec.ref}" is a whole topic; a specific point ref files the sheet more precisely.`)
      }
    }
    const gcse = isStr(header.qualification) && header.qualification.startsWith('gcse-')
    if (!gcse && (header.tier === 'foundation' || header.tier === 'higher')) warnings.push('header: tiers only apply to GCSE; use "both" for KS3, A level and IB.')
  }

  // ── Pass 4: whole-sheet sense checks ────────────────────────────────────────
  const numbered = blocks.filter(b => isObj(b) && NUMBERED.has(b.type))
  if (!numbered.length) warnings.push('The worksheet has no questions or activities.')
  const hasNumerical = blocks.some(b => isObj(b) && b.type === 'question' &&
    ((b.numericalAnswer && b.numericalAnswer.trim()) || (b.parts ?? []).some((p: Obj) => p?.numericalAnswer?.trim?.())))
  if (hasNumerical && !blocks.some(b => isObj(b) && b.type === 'numerical_answers')) warnings.push('The sheet has numerical answers but no numerical_answers block at the end.')
  const diagramCount = blocks.filter(b => isObj(b) && b.type === 'figure').length
  if (diagramCount > 4) warnings.push(`${diagramCount} figures; keep to 4 or fewer per sheet.`)

  const worksheet: CheckedWorksheet = { id, blocks }
  if (input.showLines === false) worksheet.showLines = false

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    worksheet,
    summary: {
      title: header && isStr(header.title) ? header.title : '',
      topic: header && isStr(header.topic) ? header.topic : '',
      qualification: header?.qualification ?? '',
      examBoard: header?.examBoard ?? '',
      tier: header?.tier ?? '',
      specPoint: header?.specPoint ?? '',
      specTitle,
      totalMarks: blocks.reduce((s, b) => s + (isObj(b) ? blockMarks(b) : 0), 0),
      questionCount: numbered.length,
      blockCount: blocks.length,
      diagramCount,
    },
  }
}
