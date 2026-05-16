import type { Worksheet, Block, QuestionBlock, MatchThemUpBlock, MatchItem } from '../types/worksheet'

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
    const q = block as QuestionBlock
    return {
      ...q,
      id,
      parts: (q.parts ?? []).map((p, i) => ({
        ...p,
        id: p.id || crypto.randomUUID(),
        label: p.label || labels[i] || String(i + 1),
      })),
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
}): Promise<Block> {
  const raw = await callAPI({ mode: 'block', ...params })
  const parsed = JSON.parse(raw) as Block
  if (!parsed.type) throw new Error('Invalid block returned by AI.')
  return sanitiseBlock({ ...parsed, id: crypto.randomUUID() })
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
