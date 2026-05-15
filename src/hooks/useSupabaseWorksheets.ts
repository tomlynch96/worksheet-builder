import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import type { Worksheet, HeaderBlock } from '../types/worksheet'

export interface WorksheetEntry {
  id: string
  title: string
  topic: string
  qualification_id: string | null
  spec_point: string | null
  exam_board: string
  tier: string
  block_count: number
  question_count: number
  created_at: string
  updated_at: string
  worksheet: Worksheet
}

const QUESTION_TYPES = new Set(['question', 'multiple_choice', 'cloze', 'match_them_up', 'order_steps'])

function rowToEntry(row: Record<string, unknown>): WorksheetEntry {
  const blocks = (row.blocks as unknown[]) ?? []
  return {
    id: row.id as string,
    title: (row.title as string) || 'Untitled',
    topic: (row.topic as string) || '',
    qualification_id: (row.qualification_id as string) || null,
    spec_point: (row.spec_point as string) || null,
    exam_board: (row.exam_board as string) || 'AQA',
    tier: (row.tier as string) || 'higher',
    block_count: blocks.length,
    question_count: blocks.filter((b: unknown) => QUESTION_TYPES.has((b as { type: string }).type)).length,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    worksheet: { id: row.id as string, blocks: row.blocks as Worksheet['blocks'] },
  }
}

export function useSupabaseWorksheets(profileId: string | null) {
  const [entries, setEntries] = useState<WorksheetEntry[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!profileId || !isConfigured) return
    setLoading(true)
    const { data } = await supabase
      .from('worksheets')
      .select('*')
      .eq('profile_id', profileId)
      .order('updated_at', { ascending: false })

    if (data) setEntries(data.map(r => rowToEntry(r as Record<string, unknown>)))
    setLoading(false)
  }, [profileId])

  useEffect(() => { load() }, [load])

  async function save(worksheet: Worksheet) {
    if (!profileId || !isConfigured) return
    const header = worksheet.blocks.find(b => b.type === 'header') as HeaderBlock | undefined
    const row = {
      id: worksheet.id,
      profile_id: profileId,
      title: header?.title || '',
      topic: header?.topic || '',
      qualification_id: header?.qualification || null,
      spec_point: header?.specPoint || null,
      exam_board: header?.examBoard || 'AQA',
      tier: header?.tier || 'higher',
      blocks: worksheet.blocks,
    }

    const { data, error } = await supabase.from('worksheets').upsert(row).select().single()
    if (error) throw new Error(error.message)
    if (data) {
      const entry = rowToEntry(data as Record<string, unknown>)
      setEntries(prev => [entry, ...prev.filter(e => e.id !== entry.id)])
    }
  }

  async function remove(id: string) {
    if (!profileId || !isConfigured) return
    await supabase.from('worksheets').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  return { entries, loading, save, remove, reload: load }
}
