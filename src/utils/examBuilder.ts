import type { Block, ExamBoard, HeaderBlock, Tier, Worksheet } from '../types/worksheet'
import { sanitiseWorksheet } from './generateWorksheet'
import { DEFAULT_EXAM_INFORMATION, DEFAULT_EXAM_INSTRUCTIONS } from './marks'

// ── Exemplar pages ────────────────────────────────────────────────────────

export interface PageImage {
  dataUrl: string   // JPEG at reading resolution, used for crops/thumbnails
  width: number
  height: number
}

const PAGE_WIDTH = 1200       // local render width (crops come from this)
const SPLIT_WIDTH = 820       // width sent to the AI when splitting
const MAX_PAGES = 30
// Vercel rejects request bodies over 4.5 MB; keep well under it
const MAX_BODY_CHARS = 3_800_000

export const EXEMPLAR_ACCEPT = 'application/pdf,image/png,image/jpeg,image/webp'

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL('image/jpeg', quality)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = () => reject(new Error('Could not read image.'))
    im.src = src
  })
}

function whiteCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w))
  canvas.height = Math.max(1, Math.round(h))
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return { canvas, ctx }
}

async function renderPdf(file: File, maxPages: number): Promise<{ pages: PageImage[]; total: number }> {
  const pdfjs = await import('pdfjs-dist')
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  const doc = await task.promise
  const pages: PageImage[] = []
  try {
    for (let i = 1; i <= Math.min(doc.numPages, maxPages); i++) {
      const page = await doc.getPage(i)
      const base = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: PAGE_WIDTH / base.width })
      const { canvas, ctx } = whiteCanvas(viewport.width, viewport.height)
      await page.render({ canvas, canvasContext: ctx, viewport }).promise
      pages.push({ dataUrl: canvasToJpeg(canvas, 0.85), width: canvas.width, height: canvas.height })
      page.cleanup()
    }
    return { pages, total: doc.numPages }
  } finally {
    await task.destroy()
  }
}

async function renderImage(file: File): Promise<PageImage> {
  const url = URL.createObjectURL(file)
  try {
    const im = await loadImage(url)
    const scale = Math.min(1, PAGE_WIDTH / im.naturalWidth)
    const { canvas, ctx } = whiteCanvas(im.naturalWidth * scale, im.naturalHeight * scale)
    ctx.drawImage(im, 0, 0, canvas.width, canvas.height)
    return { dataUrl: canvasToJpeg(canvas, 0.85), width: canvas.width, height: canvas.height }
  } finally {
    URL.revokeObjectURL(url)
  }
}

// A PDF, or one or more page photos/scans, rendered to page images.
export async function renderExemplarPages(files: File[]): Promise<{ pages: PageImage[]; truncated: boolean }> {
  const pages: PageImage[] = []
  let truncated = false
  for (const f of files) {
    const room = MAX_PAGES - pages.length
    if (room <= 0) { truncated = true; break }
    if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
      const { pages: rendered, total } = await renderPdf(f, room)
      pages.push(...rendered)
      if (total > rendered.length) truncated = true
    } else if (f.type.startsWith('image/')) {
      pages.push(await renderImage(f))
    } else {
      throw new Error(`${f.name} is not a PDF or image.`)
    }
  }
  return { pages, truncated }
}

export const MAX_EXEMPLAR_PAGES = MAX_PAGES

async function resize(dataUrl: string, width: number, quality: number): Promise<string> {
  const im = await loadImage(dataUrl)
  const scale = Math.min(1, width / im.naturalWidth)
  const { canvas, ctx } = whiteCanvas(im.naturalWidth * scale, im.naturalHeight * scale)
  ctx.drawImage(im, 0, 0, canvas.width, canvas.height)
  return canvasToJpeg(canvas, quality)
}

// Downscale until the whole set fits in one request body
async function fitImages(images: string[], width: number): Promise<string[]> {
  let w = width
  let q = 0.6
  for (let attempt = 0; attempt < 4; attempt++) {
    const out = await Promise.all(images.map(im => resize(im, w, q)))
    if (out.reduce((s, x) => s + x.length, 0) < MAX_BODY_CHARS) return out
    w = Math.round(w * 0.8)
    q = Math.max(0.4, q - 0.08)
  }
  throw new Error('These pages are too large to send. Try uploading fewer pages.')
}

// ── Splitting a paper into questions ──────────────────────────────────────

export interface QuestionSegment { page: number; top: number; bottom: number }

export interface ExemplarQuestion {
  key: string
  exemplarId: string
  number: string
  marks: number
  summary: string
  hasDiagram: boolean
  segments: QuestionSegment[]
  crops: string[]       // one image per segment
}

export interface Exemplar {
  id: string
  name: string
  paperTitle: string
  pages: PageImage[]
  questions: ExemplarQuestion[]
}

async function postExam(body: object): Promise<unknown> {
  const res = await fetch('/api/generate-exam', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({})) as { result?: unknown; error?: string }
  if (!res.ok || json.error) {
    if (res.status === 413) throw new Error('The upload was too large. Try fewer pages.')
    throw new Error(json.error ?? `HTTP ${res.status}`)
  }
  return json.result
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0))

export async function cropSegment(page: PageImage, seg: QuestionSegment): Promise<string> {
  const im = await loadImage(page.dataUrl)
  // A little padding so the question number and last answer line are not clipped
  const top = Math.max(0, clamp01(seg.top) - 0.01)
  const bottom = Math.min(1, Math.max(clamp01(seg.bottom), top + 0.03) + 0.01)
  const sy = Math.round(top * im.naturalHeight)
  const sh = Math.max(1, Math.round((bottom - top) * im.naturalHeight))
  const { canvas, ctx } = whiteCanvas(im.naturalWidth, sh)
  ctx.drawImage(im, 0, sy, im.naturalWidth, sh, 0, 0, im.naturalWidth, sh)
  return canvasToJpeg(canvas, 0.8)
}

export async function splitExemplar(name: string, pages: PageImage[]): Promise<Exemplar> {
  const small = await fitImages(pages.map(p => p.dataUrl), SPLIT_WIDTH)
  const result = await postExam({ mode: 'split', fileName: name, pages: small.map(s => s.split(',')[1]) }) as {
    paperTitle?: string
    questions?: Array<{ number?: string; marks?: number; summary?: string; hasDiagram?: boolean; segments?: QuestionSegment[] }>
  }
  const id = crypto.randomUUID()
  const questions: ExemplarQuestion[] = []
  for (const q of result.questions ?? []) {
    const segments = (q.segments ?? []).filter(s => Number.isInteger(s.page) && s.page >= 0 && s.page < pages.length)
    if (segments.length === 0) continue
    const crops = await Promise.all(segments.map(s => cropSegment(pages[s.page], s)))
    questions.push({
      key: crypto.randomUUID(),
      exemplarId: id,
      number: String(q.number ?? questions.length + 1),
      marks: Math.max(0, Math.round(Number(q.marks) || 0)),
      summary: q.summary ?? '',
      hasDiagram: !!q.hasDiagram,
      segments,
      crops,
    })
  }
  if (questions.length === 0) throw new Error('No questions were found in this paper. Check it is an exam paper and try again.')
  return { id, name, paperTitle: result.paperTitle ?? '', pages, questions }
}

// ── Generating the exam ───────────────────────────────────────────────────

export interface ExamSettings {
  title: string
  topic: string
  examBoard: ExamBoard
  tier: Tier
  qualification?: string
  specPoint?: string
  paperName?: string
  durationMinutes?: number
}

export function buildExamHeader(s: ExamSettings, targetMarks?: number): HeaderBlock {
  return {
    id: crypto.randomUUID(),
    type: 'header',
    title: s.title,
    topic: s.topic,
    examBoard: s.examBoard,
    tier: s.tier,
    showName: true,
    showDate: true,
    showClass: true,
    qualification: s.qualification,
    specPoint: s.specPoint,
    exam: {
      paperName: s.paperName,
      durationMinutes: s.durationMinutes,
      instructions: [...DEFAULT_EXAM_INSTRUCTIONS],
      information: [...DEFAULT_EXAM_INFORMATION],
      targetMarks,
    },
  }
}

export async function generateExamFromExemplars(params: {
  settings: ExamSettings
  questions: ExemplarQuestion[]
  sources: Record<string, string>   // exemplarId → display name
  targetMarks: number
  extraNotes?: string
}): Promise<Worksheet> {
  const { settings, questions, sources, targetMarks } = params
  const allCrops = questions.flatMap(q => q.crops.slice(0, 3))
  const fitted = await fitImages(allCrops, 1000)
  let k = 0
  const payload = questions.map(q => {
    const images = q.crops.slice(0, 3).map(() => fitted[k++].split(',')[1])
    return { source: sources[q.exemplarId] ?? 'Exemplar', number: q.number, marks: q.marks, summary: q.summary, images }
  })
  const raw = await postExam({
    mode: 'generate',
    questions: payload,
    targetMarks,
    title: settings.title,
    examBoard: settings.examBoard,
    tier: settings.tier,
    qualification: settings.qualification,
    topic: settings.topic,
    specPoint: settings.specPoint,
    extraNotes: params.extraNotes,
  }) as string
  const parsed = JSON.parse(raw) as Worksheet
  const clean = sanitiseWorksheet({ id: crypto.randomUUID(), blocks: parsed.blocks ?? [] })
  const body = clean.blocks.filter(b => b.type !== 'header' && b.type !== 'instructions')
  return { id: clean.id, blocks: [buildExamHeader(settings, targetMarks), ...body] }
}

// ── Copying questions from existing worksheets ────────────────────────────

type Attachable = { attachedDataId?: string | null; attachedDataIds?: string[] | null; attachedFigureId?: string | null }

function attachmentIds(b: Attachable): string[] {
  return [...(b.attachedDataIds ?? []), b.attachedDataId, b.attachedFigureId].filter((x): x is string => !!x)
}

// A question plus the data/figure blocks it shows inline, re-id'd so the copy
// is independent of the source worksheet. Attached blocks come first.
export function copyQuestionWithAttachments(question: Block, sourceBlocks: Block[]): Block[] {
  const q = question as Block & Attachable & { parts?: (Attachable & { id: string })[] }
  const ids = new Set(attachmentIds(q))
  for (const p of q.parts ?? []) attachmentIds(p).forEach(id => ids.add(id))
  // Graphs linked to a table need that table too
  for (const id of [...ids]) {
    const b = sourceBlocks.find(x => x.id === id)
    if (b?.type === 'data' && b.graph?.linkedDataId) ids.add(b.graph.linkedDataId)
  }
  const attached = sourceBlocks.filter(b => ids.has(b.id))
  const map = new Map<string, string>()
  for (const b of [...attached, question]) map.set(b.id, crypto.randomUUID())
  const remap = (id?: string | null) => (id ? map.get(id) ?? id : id)
  const remapAttach = <T extends Attachable>(x: T): T => ({
    ...x,
    attachedDataId: remap(x.attachedDataId) ?? undefined,
    attachedDataIds: x.attachedDataIds?.map(id => map.get(id) ?? id),
    attachedFigureId: remap(x.attachedFigureId) ?? undefined,
  })
  type Loose = Attachable & { id: string; type: string; parts?: (Attachable & { id: string })[]; graph?: { linkedDataId?: string | null } }
  const copy = (b: Block): Block => {
    const c = remapAttach(structuredClone(b) as unknown as Loose)
    c.id = map.get(b.id)!
    if (c.parts) c.parts = c.parts.map(p => ({ ...remapAttach(p), id: crypto.randomUUID() }))
    if (c.type === 'data' && c.graph?.linkedDataId) c.graph = { ...c.graph, linkedDataId: remap(c.graph.linkedDataId) ?? null }
    return c as unknown as Block
  }
  return [...attached.map(copy), copy(question)]
}

export function buildExamFromQuestions(settings: ExamSettings, picks: { block: Block; source: Block[] }[], targetMarks?: number): Worksheet {
  return {
    id: crypto.randomUUID(),
    blocks: [buildExamHeader(settings, targetMarks), ...picks.flatMap(p => copyQuestionWithAttachments(p.block, p.source))],
  }
}
