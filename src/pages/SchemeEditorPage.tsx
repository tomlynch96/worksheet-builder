import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Topbar } from '../components/layout/Topbar'
import { useProfileContext } from '../context/ProfileContext'
import { useSchemes } from '../hooks/useSchemes'
import { useSchemeDetail } from '../hooks/useSchemes'
import { useSupabaseWorksheets } from '../hooks/useSupabaseWorksheets'
import { getSpecTopics } from '../data/qualifications'
import type { SchemeTopic, SchemeTopicWorksheet } from '../types/scheme'
import type { Worksheet, Block, QuestionBlock } from '../types/worksheet'
import './SchemeEditorPage.css'

// ── Academic year helpers ────────────────────────────────────────────────────

const TERMS = [
  { label: 'Autumn 1', weeks: [1, 7] },
  { label: 'Autumn 2', weeks: [8, 14] },
  { label: 'Spring 1', weeks: [15, 21] },
  { label: 'Spring 2', weeks: [22, 28] },
  { label: 'Summer 1', weeks: [29, 34] },
  { label: 'Summer 2', weeks: [35, 39] },
]
const TOTAL_WEEKS = 39

function allWeeks() {
  return Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1)
}

// ── Recall question extraction ───────────────────────────────────────────────

interface ExtractedQuestion {
  worksheetId: string
  worksheetTitle: string
  block: Block
  marks: number
}

function extractQuestions(worksheetId: string, title: string, worksheet: Worksheet): ExtractedQuestion[] {
  const QUESTION_TYPES = new Set(['question', 'multiple_choice'])
  const out: ExtractedQuestion[] = []
  for (const block of worksheet.blocks) {
    if (!QUESTION_TYPES.has(block.type)) continue
    if (block.type === 'question') {
      const q = block as QuestionBlock
      if (q.parts.length > 0) {
        for (const part of q.parts) {
          out.push({ worksheetId, worksheetTitle: title, block: { ...q, parts: [part] } as unknown as Block, marks: part.marks ?? 1 })
        }
      } else {
        out.push({ worksheetId, worksheetTitle: title, block, marks: q.marks ?? 1 })
      }
    } else {
      const marks = (block as { marks?: number }).marks ?? 1
      out.push({ worksheetId, worksheetTitle: title, block, marks })
    }
  }
  return out
}

// ── Components ───────────────────────────────────────────────────────────────

interface TopicPickerProps {
  qualId: string
  examBoard: string
  weekNumber: number
  existing: SchemeTopic[]
  onPick: (topicRef: string | null, topicLabel: string) => void
  onClose: () => void
}

function TopicPicker({ qualId, examBoard, weekNumber: _weekNumber, existing, onPick, onClose }: TopicPickerProps) {
  const specTopics = getSpecTopics(qualId, examBoard)
  const [freeText, setFreeText] = useState('')
  const usedRefs = new Set(existing.map(t => t.topic_ref).filter(Boolean))

  return (
    <div className="topic-picker">
      <div className="topic-picker-head">
        <span className="topic-picker-title">Pick a topic</span>
        <button className="topic-picker-close" onClick={onClose}>✕</button>
      </div>
      {specTopics ? (
        <div className="topic-picker-list">
          {specTopics.flatMap(topic =>
            topic.points.map(pt => (
              <button
                key={pt.ref}
                className={`topic-picker-item${usedRefs.has(pt.ref) ? ' topic-picker-item--used' : ''}`}
                onClick={() => onPick(pt.ref, `${pt.ref} ${pt.title}`)}
              >
                <span className="topic-picker-ref">{pt.ref}</span>
                <span className="topic-picker-label">{pt.title}</span>
              </button>
            ))
          )}
        </div>
      ) : (
        <p className="topic-picker-no-spec">No spec data available — type a topic name below.</p>
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
        >
          Add
        </button>
      </div>
    </div>
  )
}

interface RecallModalProps {
  schemeId: string
  profileId: string
  atWeek: number
  topics: SchemeTopic[]
  allEntries: import('../hooks/useSupabaseWorksheets').WorksheetEntry[]
  previousCheckins: import('../types/scheme').RecallCheckin[]
  onSaved: (worksheetId: string) => void
  onClose: () => void
  onCheckinSaved: (checkin: Omit<import('../types/scheme').RecallCheckin, 'id' | 'created_at'>) => Promise<import('../types/scheme').RecallCheckin | null>
}

function RecallModal({ schemeId, profileId, atWeek, topics, allEntries, previousCheckins, onSaved, onClose, onCheckinSaved }: RecallModalProps) {
  const [marksTarget, setMarksTarget] = useState(20)
  const [building, setBuilding] = useState(false)

  // Collect worksheets from all weeks before atWeek
  const relevantTopics = topics.filter(t => t.week_number < atWeek)
  const wsIdSet = new Set<string>()
  for (const t of relevantTopics) {
    for (const w of t.worksheets ?? []) wsIdSet.add(w.worksheet_id)
  }
  const relevantWsIds = [...wsIdSet]

  // Score each worksheet: higher score = more overdue (hasn't been recalled recently)
  function getLastRecalledWeek(wsId: string): number {
    let last = 0
    for (const ci of previousCheckins) {
      if (ci.source_worksheet_ids.includes(wsId) && ci.at_week < atWeek) {
        if (ci.at_week > last) last = ci.at_week
      }
    }
    return last
  }

  const scored = relevantWsIds
    .map(wsId => {
      const entry = allEntries.find(e => e.id === wsId)
      return { wsId, title: entry?.title ?? 'Untitled', lastRecalledWeek: getLastRecalledWeek(wsId), entry }
    })
    .sort((a, b) => a.lastRecalledWeek - b.lastRecalledWeek) // never recalled first

  async function buildRecall() {
    setBuilding(true)
    // Pick questions greedily from highest-priority worksheets first
    const selected: ExtractedQuestion[] = []
    let totalMarks = 0

    for (const ws of scored) {
      if (totalMarks >= marksTarget) break
      if (!ws.entry) continue
      const questions = extractQuestions(ws.wsId, ws.title, ws.entry.worksheet)
      for (const q of questions) {
        if (totalMarks + q.marks > marksTarget + 2) continue // don't go >2 over
        selected.push(q)
        totalMarks += q.marks
        if (totalMarks >= marksTarget) break
      }
    }

    // Build a recall worksheet from selected questions
    const wsId = crypto.randomUUID()
    const blocks = [
      {
        id: crypto.randomUUID(),
        type: 'header',
        title: `Recall Check-In — Week ${atWeek}`,
        topic: 'Mixed topics',
        examBoard: 'AQA',
        tier: 'mixed',
        showName: true, showDate: true, showClass: true,
      },
      {
        id: crypto.randomUUID(),
        type: 'instructions',
        items: ['Answer all questions.', 'Show your working.', 'Marks are shown in brackets.'],
      },
      ...selected.map(q => ({ ...q.block, id: crypto.randomUUID() })),
    ]

    const sourceIds = [...new Set(selected.map(q => q.worksheetId))]
    const { data } = await supabase.from('worksheets').insert({
      id: wsId,
      profile_id: profileId,
      title: `Recall Check-In — Week ${atWeek}`,
      topic: 'Recall check-in',
      exam_board: 'Mixed',
      tier: 'mixed',
      blocks,
    }).select().single()

    if (data) {
      await onCheckinSaved({
        scheme_id: schemeId,
        profile_id: profileId,
        at_week: atWeek,
        marks_target: marksTarget,
        worksheet_id: wsId,
        source_worksheet_ids: sourceIds,
      })
      setBuilding(false)
      onSaved(wsId)
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
        <p className="recall-desc">
          Pulls questions from worksheets in weeks 1–{atWeek - 1}, prioritising topics not recently recalled.
        </p>

        <div className="recall-stat-row">
          <span className="recall-stat-label">Worksheets available</span>
          <span className="recall-stat-val">{relevantWsIds.length}</span>
        </div>

        <div className="recall-sources">
          {scored.slice(0, 8).map(ws => (
            <div key={ws.wsId} className="recall-source">
              <span className="recall-source-title">{ws.title}</span>
              <span className="recall-source-meta">
                {ws.lastRecalledWeek === 0 ? 'Never recalled' : `Last recalled wk ${ws.lastRecalledWeek}`}
              </span>
            </div>
          ))}
          {scored.length > 8 && <p className="recall-more">+ {scored.length - 8} more</p>}
        </div>

        <div className="recall-marks-row">
          <label className="recall-marks-label">Target marks: <strong>{marksTarget}</strong></label>
          <input
            type="range"
            min={5} max={60} step={5}
            value={marksTarget}
            onChange={e => setMarksTarget(Number(e.target.value))}
            className="recall-slider"
          />
          <div className="recall-slider-ends"><span>5</span><span>60</span></div>
        </div>

        <button
          className="recall-generate-btn"
          disabled={building || relevantWsIds.length === 0}
          onClick={buildRecall}
        >
          {building ? 'Building…' : `Generate ~${marksTarget}-mark check-in`}
        </button>

        {relevantWsIds.length === 0 && (
          <p className="recall-warn">Add worksheets to earlier weeks first.</p>
        )}
      </div>
    </div>
  )
}

// ── Main editor ──────────────────────────────────────────────────────────────

export function SchemeEditorPage() {
  const { id: schemeId } = useParams<{ id: string }>()
  const { profile } = useProfileContext()
  const { schemes } = useSchemes(profile?.id ?? null)
  const { topics, checkins, loading, upsertTopic, moveTopic, removeTopic, addWorksheet, removeWorksheet, saveCheckin, reload } = useSchemeDetail(schemeId ?? null)
  const { entries: allEntries } = useSupabaseWorksheets(profile?.id ?? null)
  const navigate = useNavigate()

  const scheme = schemes.find(s => s.id === schemeId)

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [pickerWeek, setPickerWeek] = useState<number | null>(null)
  const [recallWeek, setRecallWeek] = useState<number | null>(null)
  const [wsPickerTopicId, setWsPickerTopicId] = useState<string | null>(null)
  const [wsPickerQuery, setWsPickerQuery] = useState('')
  const [dragTopicId, setDragTopicId] = useState<string | null>(null)
  const dragOverWeek = useRef<number | null>(null)

  if (!scheme && !loading) {
    return (
      <div className="scheme-editor-shell">
        <Topbar />
        <div className="scheme-editor-empty">Scheme not found. <button onClick={() => navigate('/schemes')}>Back to schemes</button></div>
      </div>
    )
  }

  const topicsForWeek = (week: number) => topics.filter(t => t.week_number === week).sort((a, b) => a.position - b.position)
  const checkinForWeek = (week: number) => checkins.find(c => c.at_week === week)

  async function handleTopicPick(weekNumber: number, topicRef: string | null, topicLabel: string) {
    await upsertTopic(weekNumber, topicRef, topicLabel, topicsForWeek(weekNumber).length)
    setPickerWeek(null)
  }

  async function handleDrop(toWeek: number) {
    if (!dragTopicId || dragTopicId === String(toWeek)) return
    await moveTopic(dragTopicId, toWeek)
    setDragTopicId(null)
    dragOverWeek.current = null
  }

  const wsForPicker = allEntries.filter(e => {
    if (e.qualification_id !== scheme?.qualification_id) return false
    if (e.exam_board !== scheme?.exam_board) return false
    if (wsPickerQuery) {
      const q = wsPickerQuery.toLowerCase()
      return (e.title + ' ' + e.topic).toLowerCase().includes(q)
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

          {selectedWeek !== null && (
            <div className="scheme-week-panel">
              <div className="scheme-week-panel-head">
                <h3 className="scheme-week-panel-title">Week {selectedWeek}</h3>
                <button className="scheme-week-panel-close" onClick={() => setSelectedWeek(null)}>✕</button>
              </div>

              {topicsForWeek(selectedWeek).map(topic => (
                <div key={topic.id} className="scheme-week-topic">
                  <div className="scheme-week-topic-head">
                    <span className="scheme-week-topic-label">{topic.topic_label ?? topic.topic_ref}</span>
                    <button className="scheme-week-topic-remove" onClick={() => removeTopic(topic.id)}>✕</button>
                  </div>

                  {/* Worksheets for this topic */}
                  <div className="scheme-week-wss">
                    {(topic.worksheets ?? []).map((stw, idx) => (
                      <div key={stw.id} className="scheme-week-ws">
                        <span className="scheme-week-ws-num">{idx + 1}</span>
                        <span className="scheme-week-ws-title">{stw.title || 'Untitled'}</span>
                        <button className="scheme-week-ws-remove" onClick={() => removeWorksheet(topic.id, stw.id)}>✕</button>
                      </div>
                    ))}
                    <button className="scheme-add-ws-btn" onClick={() => setWsPickerTopicId(topic.id)}>
                      + Add worksheet
                    </button>
                  </div>
                </div>
              ))}

              <div className="scheme-week-actions">
                <button className="scheme-add-topic-btn" onClick={() => setPickerWeek(selectedWeek)}>
                  + Add topic
                </button>
                <button
                  className="scheme-recall-btn"
                  onClick={() => setRecallWeek(selectedWeek)}
                  disabled={selectedWeek <= 1}
                >
                  Generate recall check-in
                </button>
              </div>

              {checkinForWeek(selectedWeek) && (
                <div className="scheme-checkin-badge">
                  ✅ Recall check-in generated
                </div>
              )}
            </div>
          )}

          {selectedWeek === null && (
            <p className="scheme-sidebar-hint">Click a week on the calendar to manage its topics and worksheets.</p>
          )}
        </aside>

        {/* ── Calendar grid ── */}
        <div className="scheme-calendar">
          {TERMS.map(term => {
            const termWeeks = allWeeks().slice(term.weeks[0] - 1, term.weeks[1])
            return (
              <div key={term.label} className="scheme-term">
                <h3 className="scheme-term-label">{term.label}</h3>
                <div className="scheme-term-grid">
                  {termWeeks.map(week => {
                    const weekTopics = topicsForWeek(week)
                    const hasCheckin = !!checkinForWeek(week)
                    const isSelected = selectedWeek === week
                    return (
                      <div
                        key={week}
                        className={`scheme-week-cell${isSelected ? ' scheme-week-cell--selected' : ''}${hasCheckin ? ' scheme-week-cell--checkin' : ''}`}
                        onClick={() => setSelectedWeek(week === selectedWeek ? null : week)}
                        onDragOver={e => { e.preventDefault(); dragOverWeek.current = week }}
                        onDrop={() => handleDrop(week)}
                      >
                        <span className="scheme-week-num">Wk {week}</span>

                        {weekTopics.map(t => (
                          <div
                            key={t.id}
                            className="scheme-week-topic-chip"
                            draggable
                            onDragStart={e => { e.stopPropagation(); setDragTopicId(t.id) }}
                            onClick={e => e.stopPropagation()}
                            title={t.topic_label ?? t.topic_ref ?? ''}
                          >
                            {t.topic_ref && <span className="chip-ref">{t.topic_ref}</span>}
                            <span className="chip-label">{t.topic_label ?? t.topic_ref}</span>
                            {(t.worksheets?.length ?? 0) > 0 && (
                              <span className="chip-ws-count">{t.worksheets!.length}</span>
                            )}
                          </div>
                        ))}

                        {hasCheckin && <span className="scheme-checkin-dot" title="Recall check-in">⚡</span>}

                        <button
                          className="scheme-week-add-btn"
                          onClick={e => { e.stopPropagation(); setPickerWeek(week); setSelectedWeek(week) }}
                          title="Add topic"
                        >
                          +
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Topic picker overlay ── */}
      {pickerWeek !== null && scheme && (
        <div className="picker-backdrop" onClick={() => setPickerWeek(null)}>
          <div onClick={e => e.stopPropagation()}>
            <TopicPicker
              qualId={scheme.qualification_id}
              examBoard={scheme.exam_board}
              weekNumber={pickerWeek}
              existing={topicsForWeek(pickerWeek)}
              onPick={(ref, label) => handleTopicPick(pickerWeek, ref, label)}
              onClose={() => setPickerWeek(null)}
            />
          </div>
        </div>
      )}

      {/* ── Worksheet picker overlay ── */}
      {wsPickerTopicId && (
        <div className="picker-backdrop" onClick={() => { setWsPickerTopicId(null); setWsPickerQuery('') }}>
          <div className="ws-picker" onClick={e => e.stopPropagation()}>
            <div className="ws-picker-head">
              <span className="ws-picker-title">Add worksheet</span>
              <button className="ws-picker-close" onClick={() => { setWsPickerTopicId(null); setWsPickerQuery('') }}>✕</button>
            </div>
            <input
              className="ws-picker-search"
              placeholder="Search by title or topic…"
              value={wsPickerQuery}
              onChange={e => setWsPickerQuery(e.target.value)}
              autoFocus
            />
            <div className="ws-picker-list">
              {wsForPicker.length === 0 ? (
                <p className="ws-picker-empty">No matching worksheets for this course.</p>
              ) : wsForPicker.map(e => {
                const topicForId = topics.find(t => t.id === wsPickerTopicId)
                const alreadyAdded = (topicForId?.worksheets ?? []).some(w => w.worksheet_id === e.id)
                return (
                  <button
                    key={e.id}
                    className={`ws-picker-item${alreadyAdded ? ' ws-picker-item--added' : ''}`}
                    disabled={alreadyAdded}
                    onClick={async () => {
                      await addWorksheet(wsPickerTopicId, e.id, e.title, e.topic)
                      setWsPickerTopicId(null); setWsPickerQuery('')
                    }}
                  >
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

      {/* ── Recall check-in modal ── */}
      {recallWeek !== null && scheme && profile && (
        <RecallModal
          schemeId={scheme.id}
          profileId={profile.id}
          atWeek={recallWeek}
          topics={topics}
          allEntries={allEntries}
          previousCheckins={checkins}
          onCheckinSaved={saveCheckin}
          onSaved={(wsId) => {
            reload()
            setRecallWeek(null)
            navigate(`/editor`, { state: { worksheetId: wsId } })
          }}
          onClose={() => setRecallWeek(null)}
        />
      )}
    </div>
  )
}
