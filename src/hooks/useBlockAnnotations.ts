import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import type { BlockAnnotation } from '../types/annotations'

type RawRow = Record<string, unknown>

function rowToAnnotation(row: RawRow): BlockAnnotation {
  return {
    id: row.id as string,
    worksheet_id: row.worksheet_id as string,
    block_id: row.block_id as string,
    block_type: row.block_type as string,
    original_block: row.original_block ?? null,
    final_block: row.final_block,
    annotation: (row.annotation as string) || '',
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export function useBlockAnnotations(worksheetId: string | null, profileId: string | null) {
  const [annotations, setAnnotations] = useState<BlockAnnotation[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!worksheetId || !isConfigured) return
    setLoading(true)
    const { data } = await supabase
      .from('block_annotations')
      .select('*')
      .eq('worksheet_id', worksheetId)
      .order('created_at', { ascending: true })
    if (data) setAnnotations((data as RawRow[]).map(rowToAnnotation))
    setLoading(false)
  }, [worksheetId])

  useEffect(() => { load() }, [load])

  async function save(
    blockId: string,
    blockType: string,
    finalBlock: unknown,
    annotation: string,
    originalBlock?: unknown
  ): Promise<BlockAnnotation> {
    if (!worksheetId || !profileId) throw new Error('Missing worksheetId or profileId')

    const { data: existing } = await supabase
      .from('block_annotations')
      .select('id')
      .eq('worksheet_id', worksheetId)
      .eq('block_id', blockId)
      .maybeSingle()

    let row: RawRow
    if (existing) {
      const { data, error } = await supabase
        .from('block_annotations')
        .update({ annotation, final_block: finalBlock, updated_at: new Date().toISOString() })
        .eq('id', (existing as RawRow).id as string)
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      row = data as RawRow
    } else {
      const { data, error } = await supabase
        .from('block_annotations')
        .insert({
          worksheet_id: worksheetId,
          profile_id: profileId,
          block_id: blockId,
          block_type: blockType,
          final_block: finalBlock,
          original_block: originalBlock ?? null,
          annotation,
        })
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      row = data as RawRow
    }

    const saved = rowToAnnotation(row)
    setAnnotations(prev => {
      const next = prev.filter(a => a.block_id !== blockId)
      return [...next, saved].sort((a, b) => a.created_at.localeCompare(b.created_at))
    })
    return saved
  }

  return { annotations, loading, reload: load, save }
}
