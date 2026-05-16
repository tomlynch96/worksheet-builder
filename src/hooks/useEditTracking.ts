import { useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import type { Block, Worksheet, QuestionBlock, HeaderBlock } from '../types/worksheet'

interface EditDiff {
  blocksAdded: number
  blocksRemoved: number
  blocksModified: number
  blockTypesAdded: string[]
  blockTypesRemoved: string[]
  blockTypesModified: string[]
  questionsAdded: number
  questionsRemoved: number
  marksRaised: number
  marksLowered: number
  stemsEdited: number
}

function diffBlocks(original: Block[], current: Block[]): EditDiff {
  const origMap = new Map(original.map(b => [b.id, b]))
  const currMap = new Map(current.map(b => [b.id, b]))

  const added = current.filter(b => !origMap.has(b.id))
  const removed = original.filter(b => !currMap.has(b.id))
  const modified = current.filter(b => {
    if (!origMap.has(b.id)) return false
    return JSON.stringify(b) !== JSON.stringify(origMap.get(b.id))
  })

  let marksRaised = 0
  let marksLowered = 0
  let stemsEdited = 0

  for (const block of modified) {
    if (block.type !== 'question') continue
    const curr = block as QuestionBlock
    const orig = origMap.get(block.id) as QuestionBlock
    if (curr.stem !== orig.stem) stemsEdited++
    const markDelta = (curr.marks ?? 0) - (orig.marks ?? 0)
    if (markDelta > 0) marksRaised++
    if (markDelta < 0) marksLowered++
    // Also check parts
    for (const part of curr.parts ?? []) {
      const origPart = orig.parts?.find(p => p.id === part.id)
      if (!origPart) continue
      if (part.stem !== origPart.stem) stemsEdited++
      const partDelta = (part.marks ?? 0) - (origPart.marks ?? 0)
      if (partDelta > 0) marksRaised++
      if (partDelta < 0) marksLowered++
    }
  }

  return {
    blocksAdded: added.length,
    blocksRemoved: removed.length,
    blocksModified: modified.length,
    blockTypesAdded: [...new Set(added.map(b => b.type))],
    blockTypesRemoved: [...new Set(removed.map(b => b.type))],
    blockTypesModified: [...new Set(modified.map(b => b.type))],
    questionsAdded: added.filter(b => b.type === 'question').length,
    questionsRemoved: removed.filter(b => b.type === 'question').length,
    marksRaised,
    marksLowered,
    stemsEdited,
  }
}

export function useEditTracking(profileId: string | null) {
  const trackEdit = useCallback(async (
    worksheet: Worksheet,
    originalBlocks: Block[],
    worksheetType: string,
  ) => {
    if (!profileId || !isConfigured || originalBlocks.length === 0) return

    const diff = diffBlocks(originalBlocks, worksheet.blocks)
    const header = worksheet.blocks.find(b => b.type === 'header') as HeaderBlock | undefined

    const row = {
      worksheet_id: worksheet.id,
      profile_id: profileId,
      topic: header?.topic ?? '',
      exam_board: header?.examBoard ?? '',
      worksheet_type: worksheetType,
      blocks_added: diff.blocksAdded,
      blocks_removed: diff.blocksRemoved,
      blocks_modified: diff.blocksModified,
      block_types_added: diff.blockTypesAdded,
      block_types_removed: diff.blockTypesRemoved,
      block_types_modified: diff.blockTypesModified,
      questions_added: diff.questionsAdded,
      questions_removed: diff.questionsRemoved,
      marks_raised: diff.marksRaised,
      marks_lowered: diff.marksLowered,
      stems_edited: diff.stemsEdited,
      original_block_count: originalBlocks.length,
      final_block_count: worksheet.blocks.length,
      last_updated: new Date().toISOString(),
    }

    await supabase.from('worksheet_edits').upsert(row, { onConflict: 'worksheet_id' })
  }, [profileId])

  return { trackEdit }
}
