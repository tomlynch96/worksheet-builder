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

// Build a human-readable summary of what changed between two blocks.
// e.g. "marks 4→2; stem shortened; 1 part removed"
export function describeBlockChange(original: Block, final: Block): string {
  const parts: string[] = []
  if (original.type === 'question' && final.type === 'question') {
    const o = original as QuestionBlock
    const f = final as QuestionBlock
    if ((o.marks ?? 0) !== (f.marks ?? 0)) parts.push(`marks ${o.marks ?? 0}→${f.marks ?? 0}`)
    if (o.stem !== f.stem) {
      parts.push((f.stem?.length ?? 0) > (o.stem?.length ?? 0) ? 'stem expanded' : 'stem shortened')
    }
    const oPartsLen = o.parts?.length ?? 0
    const fPartsLen = f.parts?.length ?? 0
    if (fPartsLen > oPartsLen) parts.push(`${fPartsLen - oPartsLen} part${fPartsLen - oPartsLen > 1 ? 's' : ''} added`)
    if (fPartsLen < oPartsLen) parts.push(`${oPartsLen - fPartsLen} part${oPartsLen - fPartsLen > 1 ? 's' : ''} removed`)
    // Part-level marks
    let marksUp = 0; let marksDown = 0
    for (const fp of f.parts ?? []) {
      const op = o.parts?.find(p => p.id === fp.id)
      if (!op) continue
      const delta = (fp.marks ?? 0) - (op.marks ?? 0)
      if (delta > 0) marksUp += delta
      if (delta < 0) marksDown += Math.abs(delta)
    }
    if (marksUp) parts.push(`+${marksUp} marks across parts`)
    if (marksDown) parts.push(`-${marksDown} marks across parts`)
  } else if (original.type !== final.type) {
    parts.push(`type changed ${original.type}→${final.type}`)
  } else {
    const origStr = JSON.stringify(original)
    const finalStr = JSON.stringify(final)
    if (origStr !== finalStr) {
      parts.push(finalStr.length > origStr.length ? 'content expanded' : 'content shortened')
    }
  }
  return parts.join('; ')
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
