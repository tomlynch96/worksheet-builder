import { useState, useRef, useEffect, useCallback } from 'react'
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
const WEEKS_PER_ROW = 6

// ── Question extraction for recall ───────────────────────────────────────────

// Block types that count as "questions" for recall purposes
const RECALL_TYPES = new Set(['question', 'multiple_choice', 'cloze', 'match_them_up', 'order_steps'])

interface ExtractedItem { worksheetId: string; block: Block; marks: number; attachedBlocks: Block[] }

function extractItems(wsId: string, ws: Worksheet): ExtractedItem[] {
  const blockById = new Map(ws.blocks.map(b => [b.id, b]))
  const out: ExtractedItem[] = []

  for (const block of ws.blocks) {
    if (!RECALL_TYPES.has(block.type)) continue

    // Collect any data blocks attached to this question so they render inline
    const attached: Block[] = []
    const q = block as QuestionBlock & { attachedDataId?: string; attachedDataIds?: string[] }
    const dataIds: string[] = q.attachedDataIds?.length
      ? q.attachedDataIds
      : q.attachedDataId ? [q.attachedDataId] : []
    for (const id of dataIds) {
      const found = blockById.get(id)
      if (found) attached.push(found)
    }
    // Also check part-level attachments
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

// ── Topic picker (parent topic level, not individual points) ─────────────────

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

  const priorTopics = topics.filter(t => t.week_start < atWeek)
  const wsIds = [...new Set(priorTopics.flatMap(t => (t.worksheets ?? []).map(w => w.worksheet_id)))]

  function lastRecalledWeek(wsId: string) {
    return previousCheckins
      .filter(c => c.at_week < atWeek && c.source_worksheet_ids.includes(wsId))
      .reduce((max, c) => Math.max(max, c.at_week), 0)
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

    for (const ws of scored) {
      if (total >= marksTarget) break
      const items = extractItems(ws.wsId, ws.entry!.worksheet)
      for (const item of items) {
        if (total + item.marks > marksTarget + 2) continue
        selected.push(item)
        total += item.marks
        if (total >= marksTarget) break
      }
    }

    const wsId = crypto.randomUUID()
    const header = { id: crypto.randomUUID(), type: 'header', title: `Recall Check-In — Week ${atWeek}`, topic: 'Mixed topics', examBoard: 'AQA', tier: 'mixed', showName: true, showDate: true, showClass: true }
    const instructions = { id: crypto.randomUUID(), type: 'instructions', items: ['Answer all questions.', 'Show your working.', 'Marks are shown in brackets.'] }

    const contentBlocks: Block[] = []
    for (const item of selected) {
      // Re-ID the question block
      const newQId = crypto.randomUUID()
      const idRemap = new Map<string, string>([[item.block.id, newQId]])

      // Re-ID and include attached data blocks (once each)
      const newAttached: Block[] = []
      for (const ab of item.attachedBlocks) {
        if (usedDataIds.has(ab.id)) {
          // Already included — point to existing new ID
          idRemap.set(ab.id, idRemap.get(ab.id) ?? ab.id)
          continue
        }
        const newId = crypto.randomUUID()
        idRemap.set(ab.id, newId)
        usedDataIds.add(ab.id)
        newAttached.push({ ...ab, id: newId })
      }

      // Fix cross-references in the question block
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
      // Pass the full worksheet object so EditorPage opens it directly
      onSaved(wsId, { id: wsId, blocks: blocks as unknown as Worksheet['blocks'] })
    } else {
      setBuilding(false)
    }
  }

  return (
    <div className="recall-backdrop" onClick={onClose}>
      <div className="recall-modal" onClick={e => e.stopPropagation()}>
        <div className="recall-head">
          <h3 className="recall-title">Generate recall check-in</h3>
          <button className="recall-close" onClick={onClose}>✕</button>
        </div>
        <p className="recall-desc">Pulls questions from worksheets in weeks before week {atWeek}, prioritising topics not recently recalled.</p>
        <div className="recall-stat-row">
          <span className="recall-stat-label">Worksheets available</span>
          <span className="recall-stat-val">{wsIds.length}</span>
        </div>
        <div className="recall-sources">
          {scored.slice(0, 8).map(ws => (
            <div key={ws.wsId} className="recall-source">
              <span className="recall-source-title">{ws.entry!.title}</span>
              <span className="recall-source-meta">{ws.lastRecalledWeek === 0 ? 'Never recalled' : `Last recalled wk ${ws.lastRecalledWeek}`}</span>
            </div>
          ))}
          {scored.length > 8 && <p className="recall-more">+ {scored.length - 8} more</p>}
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
  const { topics, checkins, loading, addTopic, moveTopic, resizeTopic, removeTopic, addWorksheet, removeWorksheet, saveCheckin, reload } = useSchemeDetail(schemeId ?? null)
  const { entries: allEntries } = useSupabaseWorksheets(profile?.id ?? null)
  const navigate = useNavigate()

  const scheme = schemes.find(s => s.id === schemeId)
  const browsableQuals = scheme?.browsable_qualifications?.length
    ? scheme.browsable_qualifications
    : scheme ? [{ qualification_id: scheme.qualification_id, exam_board: scheme.exam_board }] : []

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [pickerWeek, setPickerWeek] = useState<number | null>(null)
  const [recallWeek, setRecallWeek] = useState<number | null>(null)
  const [wsPickerTopicId, setWsPickerTopicId] = useState<string | null>(null)
  const [wsPickerQuery, setWsPickerQuery] = useState('')

  // Drag-to-move
  const [dragTopicId, setDragTopicId] = useState<string | null>(null)

  // Drag-to-resize: track which topic is being resized, and what week the cursor is over
  const [resizing, setResizing] = useState<{ id: string; currentEnd: number } | null>(null)
  const resizingRef = useRef(resizing)
  useEffect(() => { resizingRef.current = resizing }, [resizing])

  const commitResize = useCallback(async () => {
    const r = resizingRef.current
    if (r) {
      await resizeTopic(r.id, r.currentEnd)
      setResizing(null)
    }
  }, [resizeTopic])

  useEffect(() => {
    document.addEventListener('mouseup', commitResize)
    return () => document.removeEventListener('mouseup', commitResize)
  }, [commitResize])

  if (!scheme && !loading) return (
    <div className="scheme-editor-shell">
      <Topbar />
      <div className="scheme-editor-empty">Scheme not found. <button onClick={() => navigate('/schemes')}>Back to schemes</button></div>
    </div>
  )

  const topicsForWeek = (week: number) =>
    topics.filter(t => t.week_start <= week && week <= t.week_end).sort((a, b) => a.position - b.position)

  const checkinForWeek = (week: number) => checkins.find(c => c.at_week === week)

  const existingRefs = new Set(topics.map(t => t.topic_ref).filter(Boolean) as string[])

  async function handleTopicPick(weekNumber: number, ref: string | null, label: string) {
    await addTopic(weekNumber, weekNumber, ref, label, topicsForWeek(weekNumber).length)
    setPickerWeek(null)
  }

  async function handleDrop(toWeek: number) {
    if (!dragTopicId) return
    await moveTopic(dragTopicId, toWeek)
    setDragTopicId(null)
  }

  // Build the set of valid spec_point refs for the currently-picked topic
  const wsPickerTopic = wsPickerTopicId ? topics.find(t => t.id === wsPickerTopicId) : null
  const wsPickerAllowedRefs = (() => {
    if (!wsPickerTopic?.topic_ref) return null  // no filter if topic has no ref
    const refs = new Set<string>([wsPickerTopic.topic_ref])
    for (const q of browsableQuals) {
      const specTopics = getSpecTopics(q.qualification_id, q.exam_board)
      const parent = specTopics?.find(t => t.ref === wsPickerTopic.topic_ref)
      if (parent) parent.points.forEach(p => refs.add(p.ref))
    }
    return refs
  })()

  const wsForPicker = allEntries.filter(e => {
    const matchesAnyQual = browsableQuals.some(q =>
      e.qualification_id === q.qualification_id && e.exam_board === q.exam_board
    )
    if (!matchesAnyQual) return false
    // Filter to worksheets tagged within this topic's spec points (if topic has a ref)
    if (wsPickerAllowedRefs && e.spec_point && !wsPickerAllowedRefs.has(e.spec_point)) return false
    if (wsPickerQuery) {
      const q = wsPickerQuery.toLowerCase()
      return (e.title + ' ' + e.topic + ' ' + (e.spec_point ?? '')).toLowerCase().includes(q)
    }
    return true
  })

  // Build rows of weeks
  const rows: number[][] = []
  for (let w = 1; w <= TOTAL_WEEKS; w += WEEKS_PER_ROW)
    rows.push(Array.from({ length: Math.min(WEEKS_PER_ROW, TOTAL_WEEKS - w + 1) }, (_, i) => w + i))

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
                    {(topic.worksheets ?? []).map((stw, idx) => (
                      <div key={stw.id} className="scheme-week-ws">
                        <span className="scheme-week-ws-num">{idx + 1}</span>
                        <span className="scheme-week-ws-title">{stw.title || 'Untitled'}</span>
                        <button className="scheme-week-ws-remove" onClick={() => removeWorksheet(topic.id, stw.id)}>✕</button>
                      </div>
                    ))}
                    <button className="scheme-add-ws-btn" onClick={() => setWsPickerTopicId(topic.id)}>+ Add worksheet</button>
                  </div>
                </div>
              ))}

              <div className="scheme-week-actions">
                <button className="scheme-add-topic-btn" onClick={() => setPickerWeek(selectedWeek)}>+ Add topic</button>
                <button className="scheme-recall-btn" onClick={() => setRecallWeek(selectedWeek)} disabled={selectedWeek <= 1}>
                  ⚡ Generate recall check-in
                </button>
              </div>
              {checkinForWeek(selectedWeek) && <div className="scheme-checkin-badge">✅ Recall check-in generated</div>}
            </div>
          ) : (
            <p className="scheme-sidebar-hint">Click any week to manage topics and worksheets, or drag a topic chip to move it.</p>
          )}
        </aside>

        {/* ── Calendar ── */}
        <div className={`scheme-calendar${resizing ? ' scheme-calendar--resizing' : ''}`}>
          {rows.map((rowWeeks, rowIdx) => (
            <div key={rowIdx} className="scheme-week-row">
              {rowWeeks.map(week => {
                const weekTopics = topicsForWeek(week)
                const hasCheckin = !!checkinForWeek(week)
                const isSelected = selectedWeek === week

                return (
                  <div
                    key={week}
                    className={`scheme-week-cell${isSelected ? ' scheme-week-cell--selected' : ''}${hasCheckin ? ' scheme-week-cell--checkin' : ''}`}
                    onClick={() => setSelectedWeek(week === selectedWeek ? null : week)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleDrop(week)}
                    onMouseEnter={() => {
                      if (resizing) setResizing(prev => prev ? { ...prev, currentEnd: Math.max(prev.currentEnd, week) } : null)
                    }}
                  >
                    <div className="scheme-week-header">
                      <span className="scheme-week-num">Wk {week}</span>
                      {hasCheckin && <span className="scheme-checkin-dot" title="Recall check-in">⚡</span>}
                    </div>

                    <div className="scheme-week-chips">
                      {weekTopics.map(topic => {
                        const isStart = topic.week_start === week
                        const isResizingThis = resizing?.id === topic.id
                        const displayEnd = isResizingThis ? resizing!.currentEnd : topic.week_end
                        const effectiveEnd = Math.max(displayEnd, topic.week_start)
                        const chipIsEnd = effectiveEnd === week

                        return (
                          <div
                            key={topic.id}
                            className={[
                              'scheme-topic-chip',
                              isStart ? 'chip--start' : '',
                              chipIsEnd ? 'chip--end' : '',
                              !isStart && !chipIsEnd ? 'chip--middle' : '',
                              isResizingThis ? 'chip--resizing' : '',
                            ].filter(Boolean).join(' ')}
                            draggable={isStart}
                            onDragStart={e => { if (isStart) { e.stopPropagation(); setDragTopicId(topic.id) } else e.preventDefault() }}
                            onClick={e => e.stopPropagation()}
                            title={topic.topic_label ?? topic.topic_ref ?? ''}
                          >
                            {isStart && (
                              <>
                                {topic.topic_ref && <span className="chip-ref">{topic.topic_ref}</span>}
                                <span className="chip-label">{topic.topic_label ?? topic.topic_ref}</span>
                                {(topic.worksheets?.length ?? 0) > 0 && (
                                  <span className="chip-ws-count">{topic.worksheets!.length}</span>
                                )}
                              </>
                            )}
                            {!isStart && <span className="chip-continuation" />}
                            {chipIsEnd && (
                              <span
                                className="chip-resize-handle"
                                title="Drag to extend"
                                onMouseDown={e => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setResizing({ id: topic.id, currentEnd: topic.week_end })
                                }}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <button
                      className="scheme-week-add-btn"
                      onClick={e => { e.stopPropagation(); setPickerWeek(week); setSelectedWeek(week) }}
                      title="Add topic to this week"
                    >+</button>
                  </div>
                )
              })}
            </div>
          ))}
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
        <div className="picker-backdrop" onClick={() => { setWsPickerTopicId(null); setWsPickerQuery('') }}>
          <div className="ws-picker" onClick={e => e.stopPropagation()}>
            <div className="ws-picker-head">
              <span className="ws-picker-title">Add worksheet</span>
              <button className="ws-picker-close" onClick={() => { setWsPickerTopicId(null); setWsPickerQuery('') }}>✕</button>
            </div>
            <input className="ws-picker-search" placeholder="Search by title or topic…" value={wsPickerQuery} onChange={e => setWsPickerQuery(e.target.value)} autoFocus />
            <div className="ws-picker-list">
              {wsForPicker.length === 0 ? (
                <p className="ws-picker-empty">No matching worksheets for the selected courses.</p>
              ) : wsForPicker.map(e => {
                const topicObj = topics.find(t => t.id === wsPickerTopicId)
                const alreadyAdded = (topicObj?.worksheets ?? []).some(w => w.worksheet_id === e.id)
                return (
                  <button key={e.id} className={`ws-picker-item${alreadyAdded ? ' ws-picker-item--added' : ''}`} disabled={alreadyAdded}
                    onClick={async () => { await addWorksheet(wsPickerTopicId, e.id, e.title, e.topic); setWsPickerTopicId(null); setWsPickerQuery('') }}>
                    <span className="ws-picker-item-title">{e.title}</span>
                    <span className="ws-picker-item-meta">{e.topic}</span>
                    {alreadyAdded && <span className="ws-picker-added-badge">Added</span>}
                  </button>
                )
              })}
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
