import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Topbar } from '../components/layout/Topbar'
import { useProfileContext } from '../context/ProfileContext'
import { useSchemes, useSchemeDetail } from '../hooks/useSchemes'
import { useSupabaseWorksheets } from '../hooks/useSupabaseWorksheets'
import { getSpecTopics } from '../data/qualifications'
import type { SchemeTopic } from '../types/scheme'
import type { Worksheet, Block, QuestionBlock } from '../types/worksheet'
import './SchemeEditorPage.css'

const TOTAL_WEEKS = 39
const WEEK_HEIGHT = 52      // px per week row
const LABEL_WIDTH = 56      // px for the week-number column
const TOPIC_WIDTH = 500     // px per topic column
const TOPIC_GAP = 10        // px between topic columns
const RECALL_COL_WIDTH = 56 // px for the recall timeline column

const TOPIC_COLORS = [
  '#4338ca', // indigo
  '#047857', // emerald
  '#b45309', // amber
  '#b91c1c', // red
  '#6d28d9', // violet
  '#0e7490', // cyan
  '#9d174d', // pink
  '#4d7c0f', // lime
  '#c2410c', // orange
  '#1d4ed8', // blue
  '#7e22ce', // purple
  '#15803d', // green
]

function computeTopicColumns(topics: SchemeTopic[]): Map<string, number> {
  const cols = new Map<string, number>()
  const sorted = [...topics].sort((a, b) => a.week_start - b.week_start || a.id.localeCompare(b.id))
  for (const topic of sorted) {
    const used = new Set<number>()
    for (const [otherId, col] of cols) {
      const other = sorted.find(t => t.id === otherId)!
      if (other.week_start <= topic.week_end && other.week_end >= topic.week_start) used.add(col)
    }
    let col = 0
    while (used.has(col)) col++
    cols.set(topic.id, col)
  }
  return cols
}

// ── Question extraction for recall ───────────────────────────────────────────

const RECALL_TYPES = new Set(['question', 'multiple_choice', 'cloze', 'match_them_up', 'order_steps'])

interface ExtractedItem { worksheetId: string; block: Block; marks: number; attachedBlocks: Block[] }

function extractItems(wsId: string, ws: Worksheet): ExtractedItem[] {
  const blockById = new Map(ws.blocks.map(b => [b.id, b]))
  const out: ExtractedItem[] = []

  for (const block of ws.blocks) {
    if (!RECALL_TYPES.has(block.type)) continue

    const attached: Block[] = []
    const q = block as QuestionBlock & { attachedDataId?: string; attachedDataIds?: string[] }
    const dataIds: string[] = q.attachedDataIds?.length
      ? q.attachedDataIds
      : q.attachedDataId ? [q.attachedDataId] : []
    for (const id of dataIds) {
      const found = blockById.get(id)
      if (found) attached.push(found)
    }
    for (const part of (q as QuestionBlock).parts ?? []) {
      const pq = part as typeof part & { attachedDataId?: string; attachedDataIds?: string[] }
      const partIds = pq.attachedDataIds?.length ? pq.attachedDataIds : pq.attachedDataId ? [pq.attachedDataId] : []
      for (const id of partIds) {
        const found = blockById.get(id)
        if (found && !attached.find(a => a.id === id)) attached.push(found)
      }
    }

    const marks = block.type === 'question'
      ? ((block as QuestionBlock).marks || (block as QuestionBlock).parts.reduce((s, p) => s + (p.marks ?? 1), 0) || 1)
      : (block as { marks?: number }).marks ?? 1

    out.push({ worksheetId: wsId, block, marks, attachedBlocks: attached })
  }
  return out
}

// ── Topic picker ─────────────────────────────────────────────────────────────

interface TopicPickerProps {
  browsableQuals: { qualification_id: string; exam_board: string }[]
  existingRefs: Set<string>
  onPick: (ref: string | null, label: string) => void
  onClose: () => void
}

function TopicPicker({ browsableQuals, existingRefs, onPick, onClose }: TopicPickerProps) {
  const [freeText, setFreeText] = useState('')
  const [activeQualIdx, setActiveQualIdx] = useState(0)

  const { qualification_id, exam_board } = browsableQuals[activeQualIdx] ?? browsableQuals[0] ?? {}
  const specTopics = qualification_id ? getSpecTopics(qualification_id, exam_board) : null

  return (
    <div className="topic-picker">
      <div className="topic-picker-head">
        <span className="topic-picker-title">Add topic</span>
        <button className="topic-picker-close" onClick={onClose}>✕</button>
      </div>

      {browsableQuals.length > 1 && (
        <div className="topic-picker-tabs">
          {browsableQuals.map((q, i) => (
            <button
              key={`${q.qualification_id}:${q.exam_board}`}
              className={`topic-picker-tab${i === activeQualIdx ? ' topic-picker-tab--active' : ''}`}
              onClick={() => setActiveQualIdx(i)}
            >
              {q.exam_board} {q.qualification_id.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      )}

      {specTopics ? (
        <div className="topic-picker-list">
          {specTopics.map(topic => {
            const used = existingRefs.has(topic.ref)
            return (
              <button
                key={topic.ref}
                className={`topic-picker-item${used ? ' topic-picker-item--used' : ''}`}
                onClick={() => onPick(topic.ref, `${topic.ref} ${topic.title}`)}
              >
                <span className="topic-picker-ref">{topic.ref}</span>
                <span className="topic-picker-label">{topic.title}</span>
                <span className="topic-picker-count">{topic.points.length} lessons</span>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="topic-picker-no-spec">No spec data — type a topic name below.</p>
      )}

      <div className="topic-picker-free">
        <input
          className="topic-picker-input"
          placeholder="Or type a custom topic…"
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && freeText.trim()) onPick(null, freeText.trim()) }}
        />
        <button
          className="topic-picker-add"
          disabled={!freeText.trim()}
          onClick={() => { if (freeText.trim()) onPick(null, freeText.trim()) }}
        >Add</button>
      </div>
    </div>
  )
}

// ── Recall modal ─────────────────────────────────────────────────────────────

interface RecallModalProps {
  schemeId: string
  profileId: string
  atWeek: number
  topics: SchemeTopic[]
  allEntries: import('../hooks/useSupabaseWorksheets').WorksheetEntry[]
  previousCheckins: import('../types/scheme').RecallCheckin[]
  onSaved: (wsId: string, worksheet: Worksheet) => void
  onClose: () => void
  onCheckinSaved: (c: Omit<import('../types/scheme').RecallCheckin, 'id' | 'created_at'>) => Promise<import('../types/scheme').RecallCheckin | null>
}

function RecallModal({ schemeId, profileId, atWeek, topics, allEntries, previousCheckins, onSaved, onClose, onCheckinSaved }: RecallModalProps) {
  const [marksTarget, setMarksTarget] = useState(20)
  const [building, setBuilding] = useState(false)

  // Current topic = topic that spans atWeek (being taught now)
  const currentTopic = topics.find(t => t.week_start <= atWeek && t.week_end >= atWeek)
  const currentSheets = currentTopic?.worksheets ?? []
  // Default: include all worksheets from current topic
  const [cutoffIdx, setCutoffIdx] = useState(currentSheets.length - 1)

  // Past topics = fully finished before atWeek
  const pastTopics = topics.filter(t => t.week_end < atWeek)
  // Include current topic's worksheets up to cutoff
  const currentIncludedIds = currentSheets.slice(0, cutoffIdx + 1).map(w => w.worksheet_id)
  const pastWsIds = [...new Set(pastTopics.flatMap(t => (t.worksheets ?? []).map(w => w.worksheet_id)))]
  const wsIds = [...new Set([...pastWsIds, ...currentIncludedIds])]

  function lastRecalledWeek(wsId: string) {
    return previousCheckins
      .filter(c => c.at_week < atWeek && c.source_worksheet_ids.includes(wsId))
      .reduce((max, c) => Math.max(max, c.at_week), 0)
  }

  function recallCount(wsId: string) {
    return previousCheckins.filter(c => c.at_week < atWeek && c.source_worksheet_ids.includes(wsId)).length
  }

  const scored = wsIds
    .map(wsId => ({ wsId, entry: allEntries.find(e => e.id === wsId), lastRecalledWeek: lastRecalledWeek(wsId) }))
    .filter(w => w.entry)
    .sort((a, b) => a.lastRecalledWeek - b.lastRecalledWeek)

  async function buildRecall() {
    setBuilding(true)
    const selected: ExtractedItem[] = []
    const usedDataIds = new Set<string>()
    let total = 0

    const existingCheckin = previousCheckins.find(c => c.at_week === atWeek)
    if (existingCheckin) {
      if (existingCheckin.worksheet_id) {
        await supabase.from('worksheets').delete().eq('id', existingCheckin.worksheet_id)
      }
      await supabase.from('recall_checkins').delete().eq('id', existingCheckin.id)
    }

    const pools = scored.map(ws => {
      const items = extractItems(ws.wsId, ws.entry!.worksheet)
      const offset = recallCount(ws.wsId) % Math.max(items.length, 1)
      const rotated = [...items.slice(offset), ...items.slice(0, offset)]
      return { wsId: ws.wsId, items: rotated }
    }).filter(p => p.items.length > 0)

    const maxPasses = Math.max(...pools.map(p => p.items.length), 1)
    outer: for (let pass = 0; pass < maxPasses; pass++) {
      for (const pool of pools) {
        if (total >= marksTarget) break outer
        if (pass >= pool.items.length) continue
        const item = pool.items[pass]
        if (total + item.marks > marksTarget + 3) continue
        selected.push(item)
        total += item.marks
      }
    }

    const wsId = crypto.randomUUID()
    const header = { id: crypto.randomUUID(), type: 'header', title: `Recall Check-In — Week ${atWeek}`, topic: 'Mixed topics', examBoard: 'AQA', tier: 'mixed', showName: true, showDate: true, showClass: true }
    const instructions = { id: crypto.randomUUID(), type: 'instructions', items: ['Answer all questions.', 'Show your working.', 'Marks are shown in brackets.'] }

    const contentBlocks: Block[] = []
    for (const item of selected) {
      const newQId = crypto.randomUUID()
      const idRemap = new Map<string, string>([[item.block.id, newQId]])

      const newAttached: Block[] = []
      for (const ab of item.attachedBlocks) {
        if (usedDataIds.has(ab.id)) {
          idRemap.set(ab.id, idRemap.get(ab.id) ?? ab.id)
          continue
        }
        const newId = crypto.randomUUID()
        idRemap.set(ab.id, newId)
        usedDataIds.add(ab.id)
        newAttached.push({ ...ab, id: newId })
      }

      const rawQ = item.block as QuestionBlock & { attachedDataId?: string; attachedDataIds?: string[] }
      const fixedQ = {
        ...rawQ,
        id: newQId,
        attachedDataId: rawQ.attachedDataId ? (idRemap.get(rawQ.attachedDataId) ?? rawQ.attachedDataId) : rawQ.attachedDataId,
        attachedDataIds: rawQ.attachedDataIds?.map(id => idRemap.get(id) ?? id),
      }

      contentBlocks.push(...newAttached, fixedQ as unknown as Block)
    }

    const blocks = [header, instructions, ...contentBlocks]
    const { data, error } = await supabase
      .from('worksheets')
      .insert({ id: wsId, profile_id: profileId, title: `Recall Check-In — Week ${atWeek}`, topic: 'Recall check-in', exam_board: 'Mixed', tier: 'mixed', is_recall: true, blocks })
      .select()
      .single()

    if (data && !error) {
      await onCheckinSaved({
        scheme_id: schemeId,
        profile_id: profileId,
        at_week: atWeek,
        marks_target: marksTarget,
        worksheet_id: wsId,
        source_worksheet_ids: [...new Set(selected.map(item => item.worksheetId))],
      })
      setBuilding(false)
      onSaved(wsId, { id: wsId, blocks: blocks as unknown as Worksheet['blocks'] })
    } else {
      setBuilding(false)
    }
  }

  return (
    <div className="recall-backdrop" onClick={onClose}>
      <div className="recall-modal" onClick={e => e.stopPropagation()}>
        <div className="recall-head">
          <h3 className="recall-title">Generate recall check-in — Week {atWeek}</h3>
          <button className="recall-close" onClick={onClose}>✕</button>
        </div>
        <p className="recall-desc">Pulls questions from worksheets taught before this week, prioritising lessons not recently recalled.</p>

        {currentTopic && currentSheets.length > 0 && (
          <div className="recall-cutoff">
            <p className="recall-cutoff-label">Include from <strong>{currentTopic.topic_label ?? currentTopic.topic_ref}</strong> up to:</p>
            <div className="recall-cutoff-list">
              {currentSheets.map((stw, i) => (
                <button
                  key={stw.id}
                  className={`recall-cutoff-item${i <= cutoffIdx ? ' recall-cutoff-item--on' : ''}`}
                  onClick={() => setCutoffIdx(i === cutoffIdx ? i - 1 : i)}
                >
                  <span className="recall-cutoff-num">{i + 1}</span>
                  <span className="recall-cutoff-title">{stw.title || 'Untitled'}</span>
                  {i <= cutoffIdx ? <span className="recall-cutoff-check">✓</span> : <span className="recall-cutoff-check recall-cutoff-check--off">–</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="recall-stat-row">
          <span className="recall-stat-label">Worksheets available</span>
          <span className="recall-stat-val">{wsIds.length}</span>
        </div>
        <div className="recall-sources">
          {scored.slice(0, 6).map(ws => (
            <div key={ws.wsId} className="recall-source">
              <span className="recall-source-title">{ws.entry!.title}</span>
              <span className="recall-source-meta">{ws.lastRecalledWeek === 0 ? 'Never recalled' : `Last wk ${ws.lastRecalledWeek}`}</span>
            </div>
          ))}
          {scored.length > 6 && <p className="recall-more">+ {scored.length - 6} more</p>}
        </div>
        <div className="recall-marks-row">
          <label className="recall-marks-label">Target marks: <strong>{marksTarget}</strong></label>
          <input type="range" min={5} max={60} step={5} value={marksTarget} onChange={e => setMarksTarget(Number(e.target.value))} className="recall-slider" />
          <div className="recall-slider-ends"><span>5</span><span>60</span></div>
        </div>
        <button className="recall-generate-btn" disabled={building || wsIds.length === 0} onClick={buildRecall}>
          {building ? 'Building…' : `Generate ~${marksTarget}-mark check-in`}
        </button>
        {wsIds.length === 0 && <p className="recall-warn">Add worksheets to earlier weeks first.</p>}
      </div>
    </div>
  )
}

// ── Main editor ──────────────────────────────────────────────────────────────

export function SchemeEditorPage() {
  const { id: schemeId } = useParams<{ id: string }>()
  const { profile } = useProfileContext()
  const { schemes } = useSchemes(profile?.id ?? null)
  const { topics, checkins, loading, addTopic, moveTopic, resizeTopic, removeTopic, addWorksheet, removeWorksheet, reorderWorksheets, saveCheckin, reload } = useSchemeDetail(schemeId ?? null)
  const { entries: allEntries } = useSupabaseWorksheets(profile?.id ?? null)
  const navigate = useNavigate()

  if (profile && !profile.is_admin) { navigate('/', { replace: true }); return null }

  const scheme = schemes.find(s => s.id === schemeId)
  const browsableQuals = scheme?.browsable_qualifications?.length
    ? scheme.browsable_qualifications
    : scheme ? [{ qualification_id: scheme.qualification_id, exam_board: scheme.exam_board }] : []

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [pickerWeek, setPickerWeek] = useState<number | null>(null)
  const [recallWeek, setRecallWeek] = useState<number | null>(null)
  const [wsPickerTopicId, setWsPickerTopicId] = useState<string | null>(null)
  const [wsPickerQuery, setWsPickerQuery] = useState('')
  const [wsPickerSelected, setWsPickerSelected] = useState<Set<string>>(new Set())
  const [dragWs, setDragWs] = useState<{ topicId: string; fromIdx: number; overIdx: number } | null>(null)

  // Local topic position overrides while drag is in progress (for live preview)
  const [topicOverrides, setTopicOverrides] = useState<Map<string, { week_start: number; week_end: number }>>(new Map())
  const dragRef = useRef<{ id: string; origStart: number; origEnd: number; startY: number } | null>(null)
  const resizeRef = useRef<{ id: string; origStart: number; origEnd: number; startY: number } | null>(null)

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (dragRef.current) {
        const { id, origStart, origEnd, startY } = dragRef.current
        const delta = Math.round((e.clientY - startY) / WEEK_HEIGHT)
        const newStart = Math.max(1, origStart + delta)
        const newEnd = Math.min(TOTAL_WEEKS, newStart + (origEnd - origStart))
        setTopicOverrides(prev => new Map(prev).set(id, { week_start: newStart, week_end: newEnd }))
      }
      if (resizeRef.current) {
        const { id, origStart, origEnd, startY } = resizeRef.current
        const delta = Math.round((e.clientY - startY) / WEEK_HEIGHT)
        const newEnd = Math.max(origStart, Math.min(TOTAL_WEEKS, origEnd + delta))
        setTopicOverrides(prev => new Map(prev).set(id, { week_start: origStart, week_end: newEnd }))
      }
    }
    async function onMouseUp(e: MouseEvent) {
      if (dragRef.current) {
        const { id, origStart, startY } = dragRef.current
        dragRef.current = null
        setTopicOverrides(prev => { const m = new Map(prev); m.delete(id); return m })
        const delta = Math.round((e.clientY - startY) / WEEK_HEIGHT)
        const newStart = Math.max(1, origStart + delta)
        if (newStart !== origStart) await moveTopic(id, newStart)
      }
      if (resizeRef.current) {
        const { id, origStart, origEnd, startY } = resizeRef.current
        resizeRef.current = null
        setTopicOverrides(prev => { const m = new Map(prev); m.delete(id); return m })
        const delta = Math.round((e.clientY - startY) / WEEK_HEIGHT)
        const newEnd = Math.max(origStart, Math.min(TOTAL_WEEKS, origEnd + delta))
        if (newEnd !== origEnd) await resizeTopic(id, newEnd)
      }
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [moveTopic, resizeTopic])

  function startTopicDrag(e: React.MouseEvent, topic: SchemeTopic) {
    e.preventDefault()
    dragRef.current = { id: topic.id, origStart: topic.week_start, origEnd: topic.week_end, startY: e.clientY }
  }

  function startTopicResize(e: React.MouseEvent, topic: SchemeTopic) {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { id: topic.id, origStart: topic.week_start, origEnd: topic.week_end, startY: e.clientY }
  }

  const displayTopics = useMemo(() =>
    topics.map(t => {
      const ov = topicOverrides.get(t.id)
      return ov ? { ...t, ...ov } : t
    }), [topics, topicOverrides])

  const topicColumns = useMemo(() => computeTopicColumns(displayTopics), [displayTopics])

  if (!scheme && !loading) return (
    <div className="scheme-editor-shell">
      <Topbar />
      <div className="scheme-editor-empty">Scheme not found. <button onClick={() => navigate('/schemes')}>Back to schemes</button></div>
    </div>
  )

  async function openRecall(worksheetId: string) {
    const { data } = await supabase.from('worksheets').select('*').eq('id', worksheetId).single()
    if (!data) return
    navigate('/editor', { state: { worksheet: { id: data.id, blocks: data.blocks } } })
  }

  async function openWorksheet(worksheetId: string) {
    const { data } = await supabase.from('worksheets').select('*').eq('id', worksheetId).single()
    if (!data) return
    navigate('/editor', { state: { worksheet: { id: data.id as string, blocks: data.blocks as Worksheet['blocks'] } } })
  }

  const topicsForWeek = (week: number) =>
    displayTopics.filter(t => t.week_start <= week && week <= t.week_end).sort((a, b) => a.position - b.position)

  const checkinForWeek = (week: number) => checkins.find(c => c.at_week === week)

  const existingRefs = new Set(topics.map(t => t.topic_ref).filter(Boolean) as string[])

  async function handleTopicPick(weekNumber: number, ref: string | null, label: string) {
    await addTopic(weekNumber, weekNumber, ref, label, topicsForWeek(weekNumber).length)
    setPickerWeek(null)
  }

  function closeWsPicker() { setWsPickerTopicId(null); setWsPickerQuery(''); setWsPickerSelected(new Set()) }

  const wsPickerTopic = wsPickerTopicId ? topics.find(t => t.id === wsPickerTopicId) : null
  const wsPickerAllowedRefs = (() => {
    if (!wsPickerTopic?.topic_ref) return null
    const refs = new Set<string>([wsPickerTopic.topic_ref])
    for (const q of browsableQuals) {
      const specTopics = getSpecTopics(q.qualification_id, q.exam_board)
      const parent = specTopics?.find(t => t.ref === wsPickerTopic.topic_ref)
      if (parent) parent.points.forEach(p => refs.add(p.ref))
    }
    return refs
  })()

  async function addSelectedWorksheets() {
    if (!wsPickerTopicId) return
    const toAdd = wsForPicker.filter(e => wsPickerSelected.has(e.id))
    for (const e of toAdd) await addWorksheet(wsPickerTopicId, e.id, e.title, e.topic)
    closeWsPicker()
  }

  const wsForPicker = allEntries.filter(e => {
    const matchesAnyQual = browsableQuals.some(q =>
      e.qualification_id === q.qualification_id && e.exam_board === q.exam_board
    )
    if (!matchesAnyQual) return false
    if (wsPickerAllowedRefs && e.spec_point && !wsPickerAllowedRefs.has(e.spec_point)) return false
    if (wsPickerQuery) {
      const q = wsPickerQuery.toLowerCase()
      return (e.title + ' ' + e.topic + ' ' + (e.spec_point ?? '')).toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="scheme-editor-shell">
      <Topbar />
      <div className="scheme-editor-body">

        {/* ── Sidebar ── */}
        <aside className="scheme-sidebar">
          <button className="scheme-back-btn" onClick={() => navigate('/schemes')}>← Schemes</button>
          {scheme && (
            <>
              <h2 className="scheme-sidebar-name">{scheme.name}</h2>
              <p className="scheme-sidebar-meta">{scheme.academic_year}</p>
            </>
          )}

          {selectedWeek !== null ? (
            <div className="scheme-week-panel">
              <div className="scheme-week-panel-head">
                <h3 className="scheme-week-panel-title">Week {selectedWeek}</h3>
                <button className="scheme-week-panel-close" onClick={() => setSelectedWeek(null)}>✕</button>
              </div>

              {topicsForWeek(selectedWeek).map(topic => (
                <div key={topic.id} className="scheme-week-topic">
                  <div className="scheme-week-topic-head">
                    <span className="scheme-week-topic-label">{topic.topic_label ?? topic.topic_ref}</span>
                    <span className="scheme-week-topic-span">wk {topic.week_start}{topic.week_end !== topic.week_start ? `–${topic.week_end}` : ''}</span>
                    <button className="scheme-week-topic-remove" onClick={() => removeTopic(topic.id)}>✕</button>
                  </div>
                  <div className="scheme-week-wss">
                    {(topic.worksheets ?? []).map((stw, idx) => {
                      const isOver = dragWs?.topicId === topic.id && dragWs.overIdx === idx && dragWs.fromIdx !== idx
                      return (
                        <div
                          key={stw.id}
                          className={['scheme-week-ws', isOver ? 'scheme-week-ws--over' : ''].filter(Boolean).join(' ')}
                          draggable
                          onDragStart={() => setDragWs({ topicId: topic.id, fromIdx: idx, overIdx: idx })}
                          onDragEnter={() => { if (dragWs?.topicId === topic.id) setDragWs(d => d ? { ...d, overIdx: idx } : null) }}
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => {
                            if (!dragWs || dragWs.topicId !== topic.id || dragWs.fromIdx === dragWs.overIdx) { setDragWs(null); return }
                            const sheets = [...(topic.worksheets ?? [])]
                            const [moved] = sheets.splice(dragWs.fromIdx, 1)
                            sheets.splice(dragWs.overIdx, 0, moved)
                            reorderWorksheets(topic.id, sheets.map(w => w.id))
                            setDragWs(null)
                          }}
                          onDragEnd={() => setDragWs(null)}
                        >
                          <span className="scheme-week-ws-drag">⠿</span>
                          <span className="scheme-week-ws-num">{idx + 1}</span>
                          <span className="scheme-week-ws-title">{stw.title || 'Untitled'}</span>
                          <button className="scheme-week-ws-remove" onClick={() => removeWorksheet(topic.id, stw.id)}>✕</button>
                        </div>
                      )
                    })}
                    <div className="scheme-topic-actions">
                      <button className="scheme-add-ws-btn" onClick={() => setWsPickerTopicId(topic.id)}>+ Add worksheet</button>
                      {(topic.worksheets ?? []).length > 0 && (
                        <button
                          className="scheme-booklet-btn"
                          onClick={() => navigate('/booklet', {
                            state: {
                              preloadIds: (topic.worksheets ?? []).map(w => w.worksheet_id),
                              title: topic.topic_label ?? topic.topic_ref ?? 'Topic Booklet',
                            }
                          })}
                        >📄 Make Booklet</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="scheme-week-actions">
                <button className="scheme-add-topic-btn" onClick={() => setPickerWeek(selectedWeek)}>+ Add topic</button>
              </div>
              {(() => { const ci = checkinForWeek(selectedWeek!); return ci?.worksheet_id ? (
                <button className="scheme-checkin-badge" onClick={() => openRecall(ci.worksheet_id!)}>
                  ✅ Recall check-in generated — view →
                </button>
              ) : null })()}
            </div>
          ) : (
            <p className="scheme-sidebar-hint">Click any week to manage topics and worksheets. Use the ⚡ column on the right to generate recall check-ins.</p>
          )}
        </aside>

        {/* ── Vertical calendar ── */}
        <div className="scheme-calendar-v">
          {/* Sticky column header */}
          <div className="scheme-cal-head">
            <span className="scheme-cal-head-label" style={{ width: LABEL_WIDTH }} />
            <span className="scheme-cal-head-topics">Topics</span>
            <span className="scheme-cal-head-recall" style={{ width: RECALL_COL_WIDTH }}>⚡ Recall</span>
          </div>
          <div className="scheme-v-inner" style={{ minHeight: TOTAL_WEEKS * WEEK_HEIGHT }}>

            {/* Week row backgrounds (wireframe) */}
            {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(week => {
              const isSelected = selectedWeek === week
              return (
                <div
                  key={week}
                  className={['scheme-vweek-row', isSelected ? 'scheme-vweek-row--selected' : ''].filter(Boolean).join(' ')}
                  style={{ height: WEEK_HEIGHT }}
                  onClick={() => setSelectedWeek(week === selectedWeek ? null : week)}
                >
                  <span className="scheme-vweek-num">Wk {week}</span>
                  <button
                    className="scheme-vweek-add"
                    onClick={e => { e.stopPropagation(); setPickerWeek(week); setSelectedWeek(week) }}
                    title="Add topic"
                  >+</button>
                </div>
              )
            })}

            {/* Topic tiles — absolutely positioned */}
            {displayTopics.map((topic, idx) => {
              const col = topicColumns.get(topic.id) ?? 0
              const top = (topic.week_start - 1) * WEEK_HEIGHT + 2
              const height = Math.max((topic.week_end - topic.week_start + 1) * WEEK_HEIGHT - 4, 32)
              const color = TOPIC_COLORS[idx % TOPIC_COLORS.length]
              return (
                <div
                  key={topic.id}
                  className="scheme-vtopic"
                  style={{
                    top,
                    left: LABEL_WIDTH + col * (TOPIC_WIDTH + TOPIC_GAP),
                    width: TOPIC_WIDTH,
                    height,
                    background: color,
                  }}
                  onMouseDown={e => startTopicDrag(e, topic)}
                  onClick={e => { e.stopPropagation(); setSelectedWeek(topic.week_start) }}
                >
                  <div className="scheme-vtopic-header">
                    {topic.topic_ref && <span className="scheme-vtopic-ref">{topic.topic_ref}</span>}
                    <span className="scheme-vtopic-label">{topic.topic_label ?? topic.topic_ref}</span>
                  </div>
                  {(topic.worksheets ?? []).length > 0 && (
                    <div className="scheme-vtopic-sheets">
                      {(topic.worksheets ?? []).map((stw, i) => (
                        <button
                          key={stw.id}
                          className="scheme-vtopic-sheet"
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => { e.stopPropagation(); openWorksheet(stw.worksheet_id) }}
                          title={stw.title || 'Untitled'}
                        >
                          <span className="scheme-vtopic-sheet-num">{i + 1}</span>
                          <span className="scheme-vtopic-sheet-title">{stw.title || 'Untitled'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div
                    className="scheme-vtopic-resize"
                    title="Drag to extend"
                    onMouseDown={e => startTopicResize(e, topic)}
                  />
                </div>
              )
            })}

            {/* ── Recall timeline column ── */}
            <div className="scheme-recall-col" style={{ width: RECALL_COL_WIDTH }}>
              <div className="scheme-recall-track" />
              {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(week => {
                const ci = checkinForWeek(week)
                return (
                  <div
                    key={week}
                    className={['scheme-recall-cell', ci ? 'scheme-recall-cell--done' : ''].filter(Boolean).join(' ')}
                    style={{ height: WEEK_HEIGHT }}
                    title={ci ? `Recall check-in — week ${week}` : `Generate recall — week ${week}`}
                    onClick={() => ci?.worksheet_id ? openRecall(ci.worksheet_id) : setRecallWeek(week)}
                  >
                    {ci ? (
                      <div className="scheme-recall-dot" />
                    ) : (
                      <span className="scheme-recall-add">⚡</span>
                    )}
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      </div>

      {/* ── Topic picker ── */}
      {pickerWeek !== null && (
        <div className="picker-backdrop" onClick={() => setPickerWeek(null)}>
          <div onClick={e => e.stopPropagation()}>
            <TopicPicker
              browsableQuals={browsableQuals}
              existingRefs={existingRefs}
              onPick={(ref, label) => handleTopicPick(pickerWeek, ref, label)}
              onClose={() => setPickerWeek(null)}
            />
          </div>
        </div>
      )}

      {/* ── Worksheet picker ── */}
      {wsPickerTopicId && (
        <div className="picker-backdrop" onClick={closeWsPicker}>
          <div className="ws-picker" onClick={e => e.stopPropagation()}>
            <div className="ws-picker-head">
              <span className="ws-picker-title">Add worksheets</span>
              <button className="ws-picker-close" onClick={closeWsPicker}>✕</button>
            </div>
            <input className="ws-picker-search" placeholder="Search by title or topic…" value={wsPickerQuery} onChange={e => setWsPickerQuery(e.target.value)} autoFocus />
            <div className="ws-picker-list">
              {wsForPicker.length === 0 ? (
                <p className="ws-picker-empty">No matching worksheets for the selected courses.</p>
              ) : wsForPicker.map(e => {
                const topicObj = topics.find(t => t.id === wsPickerTopicId)
                const alreadyAdded = (topicObj?.worksheets ?? []).some(w => w.worksheet_id === e.id)
                const isSelected = wsPickerSelected.has(e.id)
                return (
                  <button
                    key={e.id}
                    className={['ws-picker-item', alreadyAdded ? 'ws-picker-item--added' : '', isSelected ? 'ws-picker-item--selected' : ''].filter(Boolean).join(' ')}
                    disabled={alreadyAdded}
                    onClick={() => {
                      if (alreadyAdded) return
                      setWsPickerSelected(prev => {
                        const next = new Set(prev)
                        next.has(e.id) ? next.delete(e.id) : next.add(e.id)
                        return next
                      })
                    }}
                  >
                    <input type="checkbox" className="ws-picker-checkbox" checked={alreadyAdded || isSelected} readOnly tabIndex={-1} />
                    <span className="ws-picker-item-body">
                      <span className="ws-picker-item-title">{e.title}</span>
                      <span className="ws-picker-item-meta">{e.topic}</span>
                    </span>
                    {alreadyAdded && <span className="ws-picker-added-badge">Added</span>}
                  </button>
                )
              })}
            </div>
            <div className="ws-picker-footer">
              <button
                className="ws-picker-confirm-btn"
                disabled={wsPickerSelected.size === 0}
                onClick={addSelectedWorksheets}
              >
                {wsPickerSelected.size === 0 ? 'Select worksheets above' : `Add ${wsPickerSelected.size} worksheet${wsPickerSelected.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recall modal ── */}
      {recallWeek !== null && scheme && profile && (
        <RecallModal
          schemeId={scheme.id}
          profileId={profile.id}
          atWeek={recallWeek}
          topics={topics}
          allEntries={allEntries}
          previousCheckins={checkins}
          onCheckinSaved={saveCheckin}
          onSaved={(_, worksheet) => { reload(); setRecallWeek(null); navigate('/editor', { state: { worksheet } }) }}
          onClose={() => setRecallWeek(null)}
        />
      )}
    </div>
  )
}
