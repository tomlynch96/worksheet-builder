import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import type { BlockAnnotation, AnnotationInsight } from '../types/annotations'

type RawRow = Record<string, unknown>

function rowToAnnotation(row: RawRow): BlockAnnotation {
  const insights = row.annotation_insights as RawRow[] | undefined
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
    insight: insights?.[0] ? {
      id: insights[0].id as string,
      block_annotation_id: insights[0].block_annotation_id as string,
      insight_text: insights[0].insight_text as string,
      teacher_rating: (insights[0].teacher_rating as -1 | 1) ?? null,
      teacher_comment: (insights[0].teacher_comment as string) ?? null,
      created_at: insights[0].created_at as string,
    } : undefined,
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
      .select('*, annotation_insights(*)')
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
        .select('*, annotation_insights(*)')
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
        .select('*, annotation_insights(*)')
        .single()
      if (error) throw new Error(error.message)
      row = data as RawRow
    }

    const annotation_ = rowToAnnotation(row)
    setAnnotations(prev => {
      const next = prev.filter(a => a.block_id !== blockId)
      return [...next, annotation_].sort((a, b) => a.created_at.localeCompare(b.created_at))
    })
    return annotation_
  }

  async function saveInsight(blockAnnotationId: string, insightText: string): Promise<AnnotationInsight> {
    const { data, error } = await supabase
      .from('annotation_insights')
      .insert({ block_annotation_id: blockAnnotationId, insight_text: insightText })
      .select()
      .single()
    if (error) throw new Error(error.message)
    const insight = {
      id: (data as RawRow).id as string,
      block_annotation_id: (data as RawRow).block_annotation_id as string,
      insight_text: (data as RawRow).insight_text as string,
      teacher_rating: null,
      teacher_comment: null,
      created_at: (data as RawRow).created_at as string,
    } satisfies AnnotationInsight
    setAnnotations(prev =>
      prev.map(a => a.id === blockAnnotationId ? { ...a, insight } : a)
    )
    return insight
  }

  async function saveInsightRating(insightId: string, rating: -1 | 1, comment: string) {
    await supabase
      .from('annotation_insights')
      .update({ teacher_rating: rating, teacher_comment: comment || null })
      .eq('id', insightId)
    setAnnotations(prev =>
      prev.map(a =>
        a.insight?.id === insightId
          ? { ...a, insight: { ...a.insight!, teacher_rating: rating, teacher_comment: comment || null } }
          : a
      )
    )
  }

  return { annotations, loading, reload: load, save, saveInsight, saveInsightRating }
}
