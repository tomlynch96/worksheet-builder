import type { Worksheet, Block, QuestionBlock, MatchThemUpBlock, MatchItem, QuestionPart } from '../types/worksheet'

const API_URL = '/api/generate-worksheet'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const toUUID = (id: string | undefined) => (id && UUID_RE.test(id)) ? id : crypto.randomUUID()

async function callAPI(body: object): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json() as { result?: string; error?: string }
  if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`)
  return json.result!
}

// Ensure blocks from AI have correct IDs and required fields on nested items
function sanitiseBlock(block: Block): Block {
  const id = toUUID(block.id)
  const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

  if (block.type === 'question') {
    const q = block as QuestionBlock & { attachedDataIds?: string[] | null }
    const attachedDataIds = Array.isArray(q.attachedDataIds) && q.attachedDataIds.length > 0
      ? q.attachedDataIds : undefined
    return {
      ...q,
      id,
      attachedDataId: q.attachedDataId ?? undefined,
      attachedDataIds,
      parts: (q.parts ?? []).map((p, i) => {
        const pp = p as typeof p & { attachedDataIds?: string[] | null }
        const partDataIds = Array.isArray(pp.attachedDataIds) && pp.attachedDataIds.length > 0
          ? pp.attachedDataIds : undefined
        return {
          ...pp,
          id: pp.id || crypto.randomUUID(),
          label: pp.label || labels[i] || String(i + 1),
          attachedDataId: pp.attachedDataId ?? undefined,
          attachedDataIds: partDataIds,
        }
      }),
    }
  }

  if (block.type === 'match_them_up') {
    const m = block as MatchThemUpBlock
    return {
      ...m,
      id,
      items: (m.items ?? []).map((item: MatchItem) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        left: item.left ?? '',
        right: item.right ?? '',
      })),
    }
  }

  return { ...block, id }
}

function sanitiseWorksheet(ws: Worksheet): Worksheet {
  return { ...ws, id: toUUID(ws.id), blocks: ws.blocks.map(sanitiseBlock) }
}

export interface OakContext {
  lessonTitle: string
  learningPoints: string[]
  keywords: Array<{ keyword: string; description: string }>
  misconceptions: Array<{ misconception: string; response: string }>
  images?: string[]   // Oak question image URLs to pass as vision context
}

export async function generateWorksheet(params: {
  topic: string
  examBoard: string
  tier: string
  qualification?: string
  specPoint?: string
  worksheetType: 'maths' | 'knowledge' | 'practical'
  extraNotes?: string
  difficulty?: number
  equations?: string[]
  teachingPhilosophy?: string
  oakContext?: OakContext
}): Promise<Worksheet> {
  const raw = await callAPI({ mode: 'worksheet', ...params })
  const parsed = JSON.parse(raw) as Worksheet
  if (!parsed.id || !Array.isArray(parsed.blocks)) throw new Error('Invalid worksheet returned by AI.')
  const sanitised = sanitiseWorksheet(parsed)
  // Ensure spec metadata is always present in the header block
  const blocks = sanitised.blocks.map(b => {
    if (b.type === 'header') {
      const h = b as { qualification?: string; specPoint?: string }
      return { ...b, qualification: h.qualification || params.qualification, specPoint: h.specPoint || params.specPoint }
    }
    return b
  })
  return { ...sanitised, blocks }
}

export async function generateBlock(params: {
  blockType: string
  context?: string
  request: string
  currentBlock?: Block
}): Promise<{ block: Block; attachedBlocks: Block[] }> {
  const raw = await callAPI({ mode: 'block', ...params })
  const parsed = JSON.parse(raw)

  // The AI may return an array [dataBlock, questionBlock] when a data block is needed
  if (Array.isArray(parsed)) {
    if (parsed.length < 2) throw new Error('Invalid block array returned by AI.')
    const attachedBlocks = parsed.slice(0, -1).map(b => sanitiseBlock({ ...b, id: crypto.randomUUID() }))
    const primaryId = crypto.randomUUID()
    const primary = parsed[parsed.length - 1] as Block
    // Wire up attachedDataId using the new sanitised data block id
    if (attachedBlocks[0]?.type === 'data' && primary.type === 'question') {
      (primary as unknown as Record<string, unknown>).attachedDataId = attachedBlocks[0].id
    }
    const block = sanitiseBlock({ ...primary, id: primaryId })
    return { block, attachedBlocks }
  }

  if (!parsed.type) throw new Error('Invalid block returned by AI.')
  return { block: sanitiseBlock({ ...parsed, id: crypto.randomUUID() }), attachedBlocks: [] }
}

export async function generateVariation(block: Block, context: string): Promise<Block> {
  const raw = await callAPI({ mode: 'vary', block, context })
  const parsed = JSON.parse(raw) as Block
  if (!parsed.type) throw new Error('Invalid block returned by AI.')
  return sanitiseBlock({ ...parsed, id: crypto.randomUUID() })
}

export async function generateWorkedExample(block: Block, context: string): Promise<Block> {
  // For multi-part questions, only demonstrate part a — simpler and more useful as a model answer
  let blockForWE = block
  if (block.type === 'question') {
    const q = block as QuestionBlock
    if (q.parts.length > 1) {
      blockForWE = { ...q, parts: q.parts.slice(0, 1) }
    }
  }
  const raw = await callAPI({
    mode: 'block',
    blockType: 'worked_example',
    context,
    request: `Generate a worked example demonstrating how to answer a question like this. Use similar but slightly different numbers or values so pupils cannot simply copy the answer directly: ${JSON.stringify(blockForWE)}`,
  })
  const parsed = JSON.parse(raw) as Block
  if (!parsed.type) throw new Error('Invalid block returned by AI.')
  return sanitiseBlock({ ...parsed, id: crypto.randomUUID() })
}

export async function generateExtraPart(block: QuestionBlock, context: string): Promise<{ parts: QuestionPart[] }> {
  const raw = await callAPI({ mode: 'add_part', block, context })
  const parsed = JSON.parse(raw) as QuestionBlock
  if (!parsed.type || !Array.isArray(parsed.parts)) throw new Error('Invalid response from AI.')
  const sanitised = sanitiseBlock({ ...parsed, id: block.id }) as QuestionBlock
  return { parts: sanitised.parts }
}

export async function editWorksheetWithAI(params: {
  worksheet: Worksheet
  request: string
}): Promise<Worksheet> {
  const raw = await callAPI({ mode: 'edit', ...params })
  const parsed = JSON.parse(raw) as Worksheet
  if (!parsed.id || !Array.isArray(parsed.blocks)) throw new Error('Invalid worksheet returned by AI.')
  return sanitiseWorksheet(parsed)
}
