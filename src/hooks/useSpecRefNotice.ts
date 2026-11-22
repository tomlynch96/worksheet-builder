import { useCallback, useEffect, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { getSpecTopics } from '../data/qualifications'
import type { Profile } from '../types/profile'

// Everything the "A Level specs were updated" notice needs: what happened to this teacher's
// content (from the migration log), what still needs a human decision, and the actions
// (acknowledge, undo / re-apply, choose a tag, report a problem).

export const ALEVEL = 'alevel-physics'
export type ChangeTable = 'worksheets' | 'scheme_topics' | 'diagrams'

export interface SpecRefChange {
  key: string
  tbl: ChangeTable
  rowId: string
  title: string
  board: string
  oldRef: string | null
  newRef: string | null        // null: the ref was cleared (an old topic that is now several)
  oldTitle?: string
  /** 'applied' = still on the new tag; 'undone' = back on the old one; 'edited' = changed again since */
  state: 'applied' | 'undone' | 'edited'
}

export interface NeedsReview {
  id: string
  title: string
  board: string
  specPoint: string
}

interface LogRow { id: number; tbl: ChangeTable; row_id: string; col: string; old_value: unknown; new_value: unknown; reverted_at: string | null }
interface MapRow { exam_board: string; kind: 'point' | 'topic'; old_ref: string; new_ref: string | null; old_title: string | null }

const asText = (v: unknown): string | null => (typeof v === 'string' ? v : null)
const norm = (v: unknown) => JSON.stringify(v ?? null)

export type ChangeError = 'changed_since' | 'failed'

interface NoticeData { batch: string | null; acked: boolean; changes: SpecRefChange[]; needsReview: NeedsReview[]; loaded: boolean }
const EMPTY: NoticeData = { batch: null, acked: true, changes: [], needsReview: [], loaded: false }

/** Reads everything the notice needs. Pure: the hook below applies the result to state. */
async function fetchNotice(profile: Profile): Promise<NoticeData> {
    if (!isConfigured) return EMPTY
    const cfg = await supabase.from('app_config').select('value').eq('key', 'spec_ref_notice').maybeSingle()
    const b = (cfg.data?.value as string | undefined)?.trim() || null
    if (!b) return { ...EMPTY, loaded: true }

    const [ack, log, map, sheets] = await Promise.all([
      supabase.from('spec_ref_acks').select('batch').eq('profile_id', profile.id).eq('batch', b).maybeSingle(),
      supabase.from('spec_ref_migration_log').select('id, tbl, row_id, col, old_value, new_value, reverted_at').eq('batch', b),
      supabase.from('spec_ref_map').select('exam_board, kind, old_ref, new_ref, old_title').eq('qualification_id', ALEVEL),
      supabase.from('worksheets').select('id, title, exam_board, spec_point').eq('profile_id', profile.id).eq('qualification_id', ALEVEL),
    ])

    const logRows = (log.data ?? []) as LogRow[]
    const mapRows = (map.data ?? []) as MapRow[]
    const sheetRows = (sheets.data ?? []) as { id: string; title: string; exam_board: string; spec_point: string | null }[]
    const sheetById = new Map(sheetRows.map(s => [s.id, s]))
    const titleFor = (kind: 'point' | 'topic', board: string, ref: string | null) =>
      ref ? mapRows.find(m => m.kind === kind && m.exam_board === board && m.old_ref === ref)?.old_title ?? undefined : undefined

    // Titles for the non-worksheet rows
    const stIds = [...new Set(logRows.filter(r => r.tbl === 'scheme_topics').map(r => r.row_id))]
    const dgIds = [...new Set(logRows.filter(r => r.tbl === 'diagrams').map(r => r.row_id))]
    const [sts, dgs] = await Promise.all([
      stIds.length ? supabase.from('scheme_topics').select('id, topic_label, topic_ref, schemes(exam_board)').in('id', stIds) : Promise.resolve({ data: [] as unknown[] }),
      dgIds.length ? supabase.from('diagrams').select('id, title, exam_board, spec_points').in('id', dgIds) : Promise.resolve({ data: [] as unknown[] }),
    ])
    const stRows = new Map(((sts.data ?? []) as { id: string; topic_label: string | null; topic_ref: string | null; schemes: { exam_board: string } | { exam_board: string }[] | null }[]).map(r => [r.id, r]))
    const dgRows = new Map(((dgs.data ?? []) as { id: string; title: string; exam_board: string; spec_points: string[] }[]).map(r => [r.id, r]))

    const grouped = new Map<string, LogRow[]>()
    for (const r of logRows) { const k = `${r.tbl}:${r.row_id}`; grouped.set(k, [...(grouped.get(k) ?? []), r]) }

    const out: SpecRefChange[] = []
    for (const [key, rows] of grouped) {
      const first = rows[0]
      const allUndone = rows.every(r => r.reverted_at)
      if (first.tbl === 'worksheets') {
        const sheet = sheetById.get(first.row_id); if (!sheet) continue
        const col = rows.find(r => r.col === 'spec_point') ?? first
        const oldRef = asText(col.old_value), newRef = asText(col.new_value)
        const state = allUndone ? (sheet.spec_point === oldRef ? 'undone' : 'edited')
                                : (sheet.spec_point === newRef ? 'applied' : 'edited')
        out.push({ key, tbl: 'worksheets', rowId: first.row_id, title: sheet.title || 'Untitled worksheet', board: sheet.exam_board, oldRef, newRef, oldTitle: titleFor('point', sheet.exam_board, oldRef), state })
      } else if (first.tbl === 'scheme_topics') {
        const st = stRows.get(first.row_id); if (!st) continue
        const board = Array.isArray(st.schemes) ? st.schemes[0]?.exam_board : st.schemes?.exam_board
        const oldRef = asText(first.old_value), newRef = asText(first.new_value)
        const state = allUndone ? (st.topic_ref === oldRef ? 'undone' : 'edited') : (st.topic_ref === newRef ? 'applied' : 'edited')
        out.push({ key, tbl: 'scheme_topics', rowId: first.row_id, title: `Scheme topic: ${st.topic_label ?? 'Untitled'}`, board: board ?? '', oldRef, newRef, oldTitle: titleFor('topic', board ?? '', oldRef), state })
      } else {
        const dg = dgRows.get(first.row_id); if (!dg) continue
        const oldTags = (first.old_value as string[] | null) ?? [], newTags = (first.new_value as string[] | null) ?? []
        const state = allUndone ? (norm(dg.spec_points) === norm(oldTags) ? 'undone' : 'edited') : (norm(dg.spec_points) === norm(newTags) ? 'applied' : 'edited')
        out.push({ key, tbl: 'diagrams', rowId: first.row_id, title: `Diagram: ${dg.title || 'Untitled'}`, board: dg.exam_board ?? '', oldRef: oldTags.join(', ') || null, newRef: newTags.join(', ') || null, state })
      }
    }
    out.sort((a, b) => a.tbl.localeCompare(b.tbl) || a.title.localeCompare(b.title))

    // Worksheets still tagged with a ref the new spec data does not have (e.g. no equivalent point)
    const changedIds = new Set(out.filter(c => c.tbl === 'worksheets').map(c => c.rowId))
    const review: NeedsReview[] = []
    for (const s of sheetRows) {
      if (!s.spec_point || changedIds.has(s.id)) continue
      const known = getSpecTopics(ALEVEL, s.exam_board)?.some(t => t.points.some(p => p.ref === s.spec_point))
      if (!known) review.push({ id: s.id, title: s.title || 'Untitled worksheet', board: s.exam_board, specPoint: s.spec_point })
    }
    return { batch: b, acked: !!ack.data, changes: out, needsReview: review, loaded: true }
}

export function useSpecRefNotice(profile: Profile | null) {
  const [data, setData] = useState<NoticeData>(EMPTY)
  const [reloadKey, setReloadKey] = useState(0)
  const [open, setOpen] = useState(false)
  const [ackedNow, setAckedNow] = useState(false)

  const hasALevelCourse = !!profile?.user_courses?.some(c => c.qualification_id === ALEVEL)

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    fetchNotice(profile).then(d => { if (!cancelled) setData(d) })
    return () => { cancelled = true }
  }, [profile, reloadKey])
  const reload = useCallback(() => setReloadKey(k => k + 1), [])

  const { batch, changes, needsReview } = data
  const acked = data.acked || ackedNow
  const loading = !data.loaded

  const acknowledge = useCallback(async () => {
    if (!profile || !batch) return
    await supabase.from('spec_ref_acks').upsert({ profile_id: profile.id, batch })
    setAckedNow(true)
    setOpen(false)
  }, [profile, batch])

  const setApplied = useCallback(async (c: SpecRefChange, apply: boolean): Promise<ChangeError | null> => {
    const { error } = await supabase.rpc('spec_ref_set_applied', { p_tbl: c.tbl, p_row_id: c.rowId, p_apply: apply })
    if (error) return error.message.includes('spec_ref_changed_since') ? 'changed_since' : 'failed'
    reload()
    return null
  }, [reload])

  const retag = useCallback(async (worksheetId: string, newRef: string): Promise<boolean> => {
    const { data, error } = await supabase.from('worksheets').select('blocks').eq('id', worksheetId).single()
    if (error || !data) return false
    const blocks = (data.blocks as { type: string; specPoint?: string }[]).map(b => b.type === 'header' ? { ...b, specPoint: newRef } : b)
    const res = await supabase.from('worksheets').update({ spec_point: newRef, blocks }).eq('id', worksheetId)
    if (res.error) return false
    reload()
    return true
  }, [reload])

  const visible = !!batch && !acked && (changes.length > 0 || needsReview.length > 0 || hasALevelCourse)

  return { loading, batch, visible, open, setOpen, changes, needsReview, hasALevelCourse, acknowledge, setApplied, retag, reload }
}
