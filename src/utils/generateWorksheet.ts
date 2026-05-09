import { supabase, isConfigured } from '../lib/supabase'
import type { Worksheet, Block } from '../types/worksheet'

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-worksheet`
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

async function callEdge(body: object): Promise<string> {
  if (!isConfigured) throw new Error('Supabase is not configured.')

  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  })

  const json = await res.json() as { result?: string; error?: string }
  if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`)
  return json.result!
}

export async function generateWorksheet(params: {
  topic: string
  examBoard: string
  tier: string
  qualification?: string
  specPoint?: string
  worksheetType: 'maths' | 'knowledge' | 'practical'
  extraNotes?: string
}): Promise<Worksheet> {
  const raw = await callEdge({ mode: 'worksheet', ...params })
  const parsed = JSON.parse(raw) as Worksheet
  if (!parsed.id || !Array.isArray(parsed.blocks)) throw new Error('Invalid worksheet returned by AI.')
  return parsed
}

export async function generateBlock(params: {
  blockType: string
  context?: string
  request: string
}): Promise<Block> {
  const raw = await callEdge({ mode: 'block', ...params })
  const parsed = JSON.parse(raw) as Block
  if (!parsed.type) throw new Error('Invalid block returned by AI.')
  return { ...parsed, id: crypto.randomUUID() }
}

export async function editWorksheetWithAI(params: {
  worksheet: Worksheet
  request: string
}): Promise<Worksheet> {
  const raw = await callEdge({ mode: 'edit', ...params })
  const parsed = JSON.parse(raw) as Worksheet
  if (!parsed.id || !Array.isArray(parsed.blocks)) throw new Error('Invalid worksheet returned by AI.')
  return parsed
}
