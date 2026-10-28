import { supabase, isConfigured } from '../lib/supabase'
import type { Block } from '../types/worksheet'

// What the generator learns about a teacher before writing a new worksheet:
// their best-rated sheets as worked models, their written feedback, and the
// latest Insights analysis of their editing patterns.

export interface WorksheetExemplar {
  title: string
  topic: string
  specPoint?: string
  worksheetType?: string
  rating: number
  annotation?: string
  blocks: unknown[]
}

export interface GenerationGuidance {
  exemplars: WorksheetExemplar[]
  priorAnnotations: Array<{ topic: string; rating: number | null; annotation: string }>
  priorBlockAnnotations: Array<{ block_type: string; topic: string; annotation: string; change_summary?: string; insight?: string }>
  profileInsight?: string
}

interface Target {
  profileId: string
  qualification: string
  examBoard: string
  worksheetType: string
  specPoint?: string
  topic?: string
}

interface RatedRow {
  id: string
  title: string | null
  topic: string | null
  spec_point: string | null
  qualification_id: string | null
  exam_board: string | null
  worksheet_type: string | null
  rating: number | null
  annotation: string | null
  blocks: Block[] | null
}

const MIN_EXEMPLAR_RATING = 4
const EXEMPLAR_CHAR_BUDGET = 60_000

// Images and diagram templates are large and say nothing about worksheet style
function compactBlocks(blocks: Block[]): unknown[] {
  return blocks.map(b => {
    if (b.type !== 'figure') return b
    const { imageData, imageUrl, diagram, ...rest } = b
    return { ...rest, image: imageData || imageUrl || diagram ? '[diagram/image]' : undefined }
  })
}

// "4.5.1.2" vs "4.5.3" share two leading segments
function sharedSpecDepth(a?: string | null, b?: string | null): number {
  if (!a || !b) return 0
  const pa = a.split(/[.\-\s]/), pb = b.split(/[.\-\s]/)
  let n = 0
  while (n < pa.length && n < pb.length && pa[n] === pb[n]) n++
  return n
}

function scoreExemplar(row: RatedRow, t: Target): number {
  let score = (row.rating ?? 0) * 10
  if (row.qualification_id === t.qualification && row.exam_board === t.examBoard) score += 20
  else if (row.exam_board === t.examBoard) score += 8
  // Custom sheets can take any shape, so type match only matters for the fixed types
  if (t.worksheetType !== 'custom' && row.worksheet_type === t.worksheetType) score += 15
  score += Math.min(sharedSpecDepth(row.spec_point, t.specPoint), 3) * 4
  if (row.annotation?.trim()) score += 3
  return score
}

export async function loadGenerationGuidance(t: Target): Promise<GenerationGuidance> {
  const empty: GenerationGuidance = { exemplars: [], priorAnnotations: [], priorBlockAnnotations: [] }
  if (!isConfigured || !t.profileId) return empty

  const [ratedRes, annotatedRes, blockRes, insightRes] = await Promise.all([
    supabase
      .from('worksheets')
      .select('id, title, topic, spec_point, qualification_id, exam_board, worksheet_type, rating, annotation, blocks')
      .eq('profile_id', t.profileId)
      .gte('rating', MIN_EXEMPLAR_RATING)
      .order('rating', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(30),
    supabase
      .from('worksheets')
      .select('topic, qualification_id, exam_board, rating, annotation')
      .eq('profile_id', t.profileId)
      .not('annotation', 'is', null)
      .neq('annotation', '')
      .order('updated_at', { ascending: false })
      .limit(30),
    supabase
      .from('block_annotations')
      .select('block_type, annotation, change_summary, annotation_insights(insight_text), worksheets(topic, qualification_id, exam_board)')
      .eq('profile_id', t.profileId)
      .neq('annotation', '')
      .order('updated_at', { ascending: false })
      .limit(40),
    supabase
      .from('profile_insights')
      .select('insight_text')
      .eq('profile_id', t.profileId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const sameCourse = (r: { qualification_id?: string | null; exam_board?: string | null } | null) =>
    !!r && r.qualification_id === t.qualification && r.exam_board === t.examBoard

  // Exemplars: best match first, as many as fit the budget (max 3)
  const exemplars: WorksheetExemplar[] = []
  let used = 0
  const ranked = ((ratedRes.data ?? []) as RatedRow[])
    .filter(r => (r.blocks?.length ?? 0) >= 4)
    .sort((a, b) => scoreExemplar(b, t) - scoreExemplar(a, t))
  for (const r of ranked) {
    if (exemplars.length >= 3) break
    const blocks = compactBlocks(r.blocks!)
    const size = JSON.stringify(blocks).length
    if (used + size > EXEMPLAR_CHAR_BUDGET) continue
    used += size
    exemplars.push({
      title: r.title || r.topic || 'Untitled',
      topic: r.topic || '',
      specPoint: r.spec_point || undefined,
      worksheetType: r.worksheet_type || undefined,
      rating: r.rating!,
      annotation: r.annotation?.trim() || undefined,
      blocks,
    })
  }

  // Written feedback: same course first, then everything else
  type AnnRow = { topic: string | null; qualification_id: string | null; exam_board: string | null; rating: number | null; annotation: string }
  const annRows = (annotatedRes.data ?? []) as AnnRow[]
  const priorAnnotations = [...annRows.filter(sameCourse), ...annRows.filter(r => !sameCourse(r))]
    .slice(0, 8)
    .map(r => ({ topic: r.topic ?? '', rating: r.rating, annotation: r.annotation }))

  type BlockAnnRow = {
    block_type: string
    annotation: string
    change_summary: string | null
    annotation_insights: { insight_text: string }[] | null
    worksheets: { topic: string; qualification_id: string | null; exam_board: string | null } | null
  }
  const blockRows = (blockRes.data ?? []) as unknown as BlockAnnRow[]
  const priorBlockAnnotations = [...blockRows.filter(b => sameCourse(b.worksheets)), ...blockRows.filter(b => !sameCourse(b.worksheets))]
    .filter(b => b.annotation)
    .slice(0, 15)
    .map(b => ({
      block_type: b.block_type,
      topic: b.worksheets?.topic ?? '',
      annotation: b.annotation,
      change_summary: b.change_summary || undefined,
      insight: b.annotation_insights?.[0]?.insight_text,
    }))

  const profileInsight = (insightRes.data as { insight_text: string } | null)?.insight_text?.trim() || undefined

  return { exemplars, priorAnnotations, priorBlockAnnotations, profileInsight }
}
