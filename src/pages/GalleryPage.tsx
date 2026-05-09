import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/layout/Topbar'
import { NewSheetWizard } from '../components/NewSheetWizard'
import { useProfileContext } from '../context/ProfileContext'
import { useSupabaseWorksheets, type WorksheetEntry } from '../hooks/useSupabaseWorksheets'
import { offeringLabel, getSpecTopics } from '../data/qualifications'
import { PRESETS } from '../data/presets'
import type { Worksheet } from '../types/worksheet'
import './GalleryPage.css'

const BOARD_COLORS: Record<string, string> = {
  AQA: '#1e3a5f', OCR: '#1d4ed8', Edexcel: '#7c2d12', WJEC: '#166534',
}
const BLOCK_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  question:        { label: 'Q',    color: '#16a34a' },
  multiple_choice: { label: 'MC',   color: '#0891b2' },
  worked_example:  { label: 'WE',   color: '#c2410c' },
  information:     { label: 'Info', color: '#b45309' },
  match_them_up:   { label: 'Match',color: '#7c3aed' },
  cloze:           { label: 'Cloze',color: '#db2777' },
  order_steps:     { label: 'Order',color: '#4338ca' },
  figure:          { label: 'Fig',  color: '#475569' },
  data:            { label: 'Data', color: '#0d9488' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function MiniPage({ worksheet, boardColor }: { worksheet: Worksheet; boardColor: string }) {
  return (
    <div className="gallery-minipage">
      {worksheet.blocks.slice(0, 18).map((block, i) => (
        <div key={i} className="gallery-miniblock" style={{
          background: block.type === 'header'
            ? boardColor
            : (BLOCK_TYPE_LABELS[block.type]?.color ?? '#9ca3af') + '33',
          height: block.type === 'header' ? 10 : block.type === 'spacer' ? 4 : 6,
          width: block.type === 'header' ? '100%' : block.type === 'spacer' ? '40%' : undefined,
        }} />
      ))}
    </div>
  )
}

function BlockChip({ type }: { type: string }) {
  const meta = BLOCK_TYPE_LABELS[type]
  if (!meta) return null
  return (
    <span className="gallery-chip" style={{ background: meta.color + '22', color: meta.color, borderColor: meta.color + '55' }}>
      {meta.label}
    </span>
  )
}

function WorksheetCard({ entry, onOpen, onDelete }: {
  entry: WorksheetEntry
  onOpen: (w: Worksheet) => void
  onDelete: (id: string) => void
}) {
  const color = BOARD_COLORS[entry.exam_board] ?? '#374151'
  const tierLabel = entry.tier === 'higher' ? 'Higher' : entry.tier === 'foundation' ? 'Foundation' : ''
  const blockTypes = entry.worksheet.blocks.map(b => b.type).filter(t => t !== 'header' && t !== 'instructions')

  return (
    <div className="gallery-card">
      <div className="gallery-card-header" style={{ background: color }}>
        <div className="gallery-card-badges">
          {entry.exam_board && <span className="gallery-badge gallery-badge--board">{entry.exam_board}</span>}
          {tierLabel && <span className="gallery-badge gallery-badge--tier">{tierLabel}</span>}
        </div>
        <div className="gallery-card-title">{entry.title || 'Untitled'}</div>
        {entry.topic && <div className="gallery-card-topic">{entry.topic}</div>}
      </div>
      <div className="gallery-card-preview">
        <MiniPage worksheet={entry.worksheet} boardColor={color} />
      </div>
      <div className="gallery-card-chips">
        {Array.from(new Set(blockTypes)).map(t => <BlockChip key={t} type={t} />)}
      </div>
      <div className="gallery-card-meta">
        <span>{entry.question_count} question{entry.question_count !== 1 ? 's' : ''} · {entry.block_count} blocks</span>
        <span className="gallery-card-date">{formatDate(entry.updated_at)}</span>
      </div>
      <div className="gallery-card-actions">
        <button className="gallery-btn gallery-btn--open" onClick={() => onOpen(entry.worksheet)}>Open in Editor</button>
        <button className="gallery-btn gallery-btn--delete" onClick={() => onDelete(entry.id)}>Delete</button>
      </div>
    </div>
  )
}

function TemplateCard({ idx, onLoad }: { idx: number; onLoad: (idx: number) => void }) {
  const preset = PRESETS[idx]
  const worksheet = preset.worksheet
  const header = worksheet.blocks.find(b => b.type === 'header') as { examBoard?: string; tier?: string } | undefined
  const examBoard = header?.examBoard ?? ''
  const tier = header?.tier ?? ''
  const color = BOARD_COLORS[examBoard] ?? '#374151'
  const tierLabel = tier === 'higher' ? 'Higher' : tier === 'foundation' ? 'Foundation' : ''
  const blockTypes = worksheet.blocks.map(b => b.type).filter(t => t !== 'header' && t !== 'instructions')
  const qCount = worksheet.blocks.filter(b => ['question','multiple_choice','cloze','match_them_up','order_steps'].includes(b.type)).length

  return (
    <div className="gallery-card gallery-card--template">
      <div className="gallery-card-header" style={{ background: color }}>
        <div className="gallery-card-badges">
          {examBoard && <span className="gallery-badge gallery-badge--board">{examBoard}</span>}
          {tierLabel && <span className="gallery-badge gallery-badge--tier">{tierLabel}</span>}
          <span className="gallery-badge gallery-badge--tpl">Template</span>
        </div>
        <div className="gallery-card-title">{preset.label}</div>
        <div className="gallery-card-topic">{preset.description}</div>
      </div>
      <div className="gallery-card-preview">
        <MiniPage worksheet={worksheet} boardColor={color} />
      </div>
      <div className="gallery-card-chips">
        {Array.from(new Set(blockTypes)).map(t => <BlockChip key={t} type={t} />)}
      </div>
      <div className="gallery-card-meta">
        <span>{qCount} question{qCount !== 1 ? 's' : ''} · {worksheet.blocks.length} blocks</span>
      </div>
      <div className="gallery-card-actions">
        <button className="gallery-btn gallery-btn--load" onClick={() => onLoad(idx)}>Load template</button>
      </div>
    </div>
  )
}

// Group entries by (exam_board + qualification_id) then by topic from spec data
interface Group {
  key: string
  label: string
  subGroups: { topicTitle: string; entries: WorksheetEntry[] }[]
  ungrouped: WorksheetEntry[]
}

function groupEntries(entries: WorksheetEntry[]): { groups: Group[]; unassigned: WorksheetEntry[] } {
  const unassigned: WorksheetEntry[] = []
  const groupMap = new Map<string, WorksheetEntry[]>()

  for (const e of entries) {
    if (!e.qualification_id || !e.exam_board) { unassigned.push(e); continue }
    const key = `${e.exam_board}:${e.qualification_id}`
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(e)
  }

  const groups: Group[] = []
  for (const [key, grpEntries] of groupMap.entries()) {
    const [board, qualId] = key.split(':')
    const label = offeringLabel(qualId, board)
    const topics = getSpecTopics(qualId, board)

    const subGroupMap = new Map<string, WorksheetEntry[]>()
    const ungrouped: WorksheetEntry[] = []

    for (const e of grpEntries) {
      if (!e.spec_point || !topics) { ungrouped.push(e); continue }
      const topic = topics.find(t => t.points.some(p => p.ref === e.spec_point))
      if (!topic) { ungrouped.push(e); continue }
      if (!subGroupMap.has(topic.ref)) subGroupMap.set(topic.ref, [])
      subGroupMap.get(topic.ref)!.push(e)
    }

    const subGroups = Array.from(subGroupMap.entries())
      .map(([ref, sg]) => ({
        topicTitle: topics?.find(t => t.ref === ref)?.title ?? ref,
        entries: sg,
      }))

    groups.push({ key, label, subGroups, ungrouped })
  }

  return { groups, unassigned }
}

export function GalleryPage() {
  const { profile } = useProfileContext()
  const navigate = useNavigate()
  const { entries, loading, remove } = useSupabaseWorksheets(profile?.id ?? null)
  const [showWizard, setShowWizard] = useState(false)

  function handleOpen(worksheet: Worksheet) {
    navigate('/editor', { state: { worksheet } })
  }

  function handleLoadPreset(idx: number) {
    navigate('/editor', { state: { preset: idx } })
  }

  function handleWizardConfirm(result: {
    qualification_id: string
    exam_board: string
    spec_point: string
    topic_title: string
  }) {
    setShowWizard(false)
    const params = new URLSearchParams({
      qual: result.qualification_id,
      board: result.exam_board,
      spec: result.spec_point,
      topic: result.topic_title,
    })
    navigate(`/editor?${params.toString()}`)
  }

  const { groups, unassigned } = groupEntries(entries)
  const hasAny = entries.length > 0

  return (
    <div className="gallery-layout">
      <Topbar actions={
        <button className="btn-topbar" onClick={() => setShowWizard(true)}>
          + New Worksheet
        </button>
      } />

      <div className="gallery-page">
        {/* Templates */}
        <section className="gallery-section">
          <div className="gallery-section-hdr">
            <h2 className="gallery-section-title">Templates</h2>
            <p className="gallery-section-sub">Start from a ready-made worksheet.</p>
          </div>
          <div className="gallery-grid gallery-grid--templates">
            {PRESETS.map((_, i) => <TemplateCard key={i} idx={i} onLoad={handleLoadPreset} />)}
          </div>
        </section>

        <hr className="gallery-divider" />

        {/* My worksheets */}
        <section className="gallery-section">
          <div className="gallery-section-hdr">
            <h2 className="gallery-section-title">My Worksheets</h2>
            {!loading && (
              <p className="gallery-section-sub">
                {hasAny ? `${entries.length} saved worksheet${entries.length !== 1 ? 's' : ''}` : 'No saved worksheets yet.'}
              </p>
            )}
          </div>

          {loading ? (
            <div className="gallery-loading">Loading…</div>
          ) : !hasAny ? (
            <div className="gallery-empty">
              <div className="gallery-empty-icon">📄</div>
              <p>Save a worksheet from the editor to see it here.</p>
            </div>
          ) : (
            <div className="gallery-grouped">
              {/* Grouped by course + topic */}
              {groups.map(group => (
                <div key={group.key} className="gallery-group">
                  <h3 className="gallery-group-title">{group.label}</h3>

                  {group.subGroups.map(sg => (
                    <div key={sg.topicTitle} className="gallery-subgroup">
                      <div className="gallery-subgroup-title">{sg.topicTitle}</div>
                      <div className="gallery-grid">
                        {sg.entries.map(e => (
                          <WorksheetCard key={e.id} entry={e} onOpen={handleOpen} onDelete={remove} />
                        ))}
                      </div>
                    </div>
                  ))}

                  {group.ungrouped.length > 0 && (
                    <div className="gallery-subgroup">
                      {group.subGroups.length > 0 && <div className="gallery-subgroup-title">Other</div>}
                      <div className="gallery-grid">
                        {group.ungrouped.map(e => (
                          <WorksheetCard key={e.id} entry={e} onOpen={handleOpen} onDelete={remove} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Unassigned (no qualification) */}
              {unassigned.length > 0 && (
                <div className="gallery-group">
                  <h3 className="gallery-group-title">Unassigned</h3>
                  <div className="gallery-grid">
                    {unassigned.map(e => (
                      <WorksheetCard key={e.id} entry={e} onOpen={handleOpen} onDelete={remove} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {showWizard && (
        <NewSheetWizard
          onConfirm={handleWizardConfirm}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  )
}
