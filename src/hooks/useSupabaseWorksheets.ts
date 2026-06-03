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
  rating: number | null
  annotation: string | null
  is_public: boolean
  attribution: 'anonymous' | 'named' | undefined
  publish_opt_out: boolean
  published_at: string | null
  author_name?: string  // populated when fetching public library
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
    rating: (row.rating as number) ?? null,
    annotation: (row.annotation as string) ?? null,
    is_public: (row.is_public as boolean) ?? false,
    attribution: (row.attribution as 'anonymous' | 'named') ?? undefined,
    publish_opt_out: (row.publish_opt_out as boolean) ?? false,
    published_at: (row.published_at as string) ?? null,
    author_name: (row.author_name as string) ?? undefined,
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

  async function save(worksheet: Worksheet, aiMeta?: { worksheetType: string; originalBlocks: import('../types/worksheet').Block[] }) {
    if (!profileId || !isConfigured) return
    const header = worksheet.blocks.find(b => b.type === 'header') as HeaderBlock | undefined
    const row: Record<string, unknown> = {
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

    // On the first save of an AI-generated worksheet, record the original blocks
    if (aiMeta) {
      row.ai_generated = true
      row.worksheet_type = aiMeta.worksheetType
      // Only set original_blocks if not already saved (use ignoreDuplicates via onConflict update)
    }

    const { data, error } = await supabase
      .from('worksheets')
      .upsert(row, {
        onConflict: 'id',
        // Don't overwrite original_blocks on subsequent saves
        ignoreDuplicates: false,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)

    // Store original_blocks only if this worksheet has never been saved before
    if (aiMeta && data && !(data as Record<string, unknown>).original_blocks) {
      await supabase
        .from('worksheets')
        .update({ original_blocks: aiMeta.originalBlocks })
        .eq('id', worksheet.id)
        .is('original_blocks', null)
    }

    if (data) {
      const entry = rowToEntry(data as Record<string, unknown>)
      setEntries(prev => [entry, ...prev.filter(e => e.id !== entry.id)])
    }
  }

  async function annotate(id: string, rating: number | null, annotation: string) {
    if (!isConfigured) return
    await supabase
      .from('worksheets')
      .update({ rating, annotation })
      .eq('id', id)
    setEntries(prev => prev.map(e => e.id === id ? { ...e, rating, annotation } : e))
  }

  async function publish(id: string, attribution: 'anonymous' | 'named' | 'opt_out') {
    if (!isConfigured) return
    if (attribution === 'opt_out') {
      await supabase.from('worksheets').update({ publish_opt_out: true }).eq('id', id)
      setEntries(prev => prev.map(e => e.id === id ? { ...e, publish_opt_out: true } : e))
    } else {
      await supabase.from('worksheets').update({
        is_public: true,
        published_at: new Date().toISOString(),
        attribution,
      }).eq('id', id)
      setEntries(prev => prev.map(e => e.id === id ? { ...e, is_public: true, attribution } : e))
    }
  }

  async function unpublish(id: string) {
    if (!isConfigured) return
    await supabase.from('worksheets').update({
      is_public: false,
      published_at: null,
      attribution: null,
    }).eq('id', id)
    setEntries(prev => prev.map(e => e.id === id ? { ...e, is_public: false, attribution: undefined, published_at: null } : e))
  }

  const fetchPublic = useCallback(async (opts: {
    qualification_id?: string
    exam_board?: string
    spec_point?: string
    query?: string
  }): Promise<WorksheetEntry[]> => {
    if (!isConfigured) return []
    let q = supabase
      .from('worksheets')
      .select('*, profiles(name)')
      .eq('is_public', true)
      .order('published_at', { ascending: false })
      .limit(100)

    if (opts.qualification_id) q = q.eq('qualification_id', opts.qualification_id)
    if (opts.exam_board) q = q.eq('exam_board', opts.exam_board)
    if (opts.spec_point) q = q.eq('spec_point', opts.spec_point)
    if (opts.query) q = q.or(`title.ilike.%${opts.query}%,topic.ilike.%${opts.query}%,spec_point.ilike.%${opts.query}%`)

    const { data } = await q
    if (!data) return []
    return (data as Record<string, unknown>[]).map(row => {
      const profileData = row.profiles as { name: string } | null
      return {
        ...rowToEntry(row),
        author_name: row.attribution === 'named' ? (profileData?.name ?? 'Teacher') : undefined,
      }
    })
  }, [])

  async function copyToMyLibrary(publicWorksheetId: string): Promise<WorksheetEntry | null> {
    if (!profileId || !isConfigured) return null
    const { data: src } = await supabase
      .from('worksheets')
      .select('*')
      .eq('id', publicWorksheetId)
      .single()
    if (!src) return null
    const newId = crypto.randomUUID()
    const copy = {
      ...(src as Record<string, unknown>),
      id: newId,
      profile_id: profileId,
      is_public: false,
      publish_opt_out: false,
      published_at: null,
      rating: null,
      annotation: null,
      original_blocks: (src as Record<string, unknown>).blocks,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from('worksheets').insert(copy).select().single()
    if (error || !data) return null
    const entry = rowToEntry(data as Record<string, unknown>)
    setEntries(prev => [entry, ...prev])
    return entry
  }

  async function remove(id: string) {
    if (!profileId || !isConfigured) return
    await supabase.from('worksheets').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  return { entries, loading, save, annotate, publish, unpublish, fetchPublic, copyToMyLibrary, remove, reload: load }
}
