import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '../components/layout/Topbar'
import { useProfileContext } from '../context/ProfileContext'
import { supabase, isConfigured } from '../lib/supabase'
import './InsightsPage.css'

// ── Annotation-based insights ─────────────────────────────────────────────

interface BlockAnnotationRow {
  block_type: string
  annotation: string
  worksheets: { topic: string; exam_board: string; tier: string } | null
}

interface ProfileInsightRow {
  id: string
  insight_text: string
  annotation_count: number
  generated_at: string
}

function useAnnotationInsights(profileId: string | null) {
  const [blockAnnotations, setBlockAnnotations] = useState<BlockAnnotationRow[]>([])
  const [worksheetAnnotations, setWorksheetAnnotations] = useState<
    { topic: string; exam_board: string; rating: number | null; annotation: string }[]
  >([])
  const [latestInsight, setLatestInsight] = useState<ProfileInsightRow | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [loadingAnnotations, setLoadingAnnotations] = useState(false)

  const loadAnnotations = useCallback(async () => {
    if (!profileId || !isConfigured) return
    setLoadingAnnotations(true)
    const [blockRes, sheetRes, insightRes] = await Promise.all([
      supabase
        .from('block_annotations')
        .select('block_type, annotation, worksheets(topic, exam_board, tier)')
        .eq('profile_id', profileId)
        .neq('annotation', '')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('worksheets')
        .select('topic, exam_board, tier, rating, annotation')
        .eq('profile_id', profileId)
        .not('annotation', 'is', null)
        .neq('annotation', '')
        .limit(50),
      supabase
        .from('profile_insights')
        .select('id, insight_text, annotation_count, generated_at')
        .eq('profile_id', profileId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    setBlockAnnotations((blockRes.data ?? []) as BlockAnnotationRow[])
    setWorksheetAnnotations(
      (sheetRes.data ?? []) as { topic: string; exam_board: string; rating: number | null; annotation: string }[]
    )
    setLatestInsight(insightRes.data as ProfileInsightRow | null)
    setLoadingAnnotations(false)
  }, [profileId])

  useEffect(() => { loadAnnotations() }, [loadAnnotations])

  async function generate() {
    if (!profileId || !isConfigured) return
    setGenerating(true)
    setGenError('')
    try {
      const res = await fetch('/api/generate-profile-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockAnnotations: blockAnnotations.map(b => ({
            block_type: b.block_type,
            annotation: b.annotation,
            topic: (b.worksheets as { topic: string } | null)?.topic ?? '',
            exam_board: (b.worksheets as { exam_board: string } | null)?.exam_board ?? '',
            tier: (b.worksheets as { tier: string } | null)?.tier ?? '',
          })),
          worksheetAnnotations,
        }),
      })
      const json = await res.json() as { insight?: string; error?: string }
      if (!res.ok || !json.insight) throw new Error(json.error ?? 'Generation failed')
      const total = blockAnnotations.length + worksheetAnnotations.length
      const { data } = await supabase
        .from('profile_insights')
        .insert({ profile_id: profileId, insight_text: json.insight, annotation_count: total })
        .select()
        .single()
      if (data) setLatestInsight(data as ProfileInsightRow)
    } catch (err) {
      setGenError(String(err))
    } finally {
      setGenerating(false)
    }
  }

  return {
    blockAnnotations, worksheetAnnotations, latestInsight,
    generating, genError, loadingAnnotations, generate,
    totalAnnotations: blockAnnotations.length + worksheetAnnotations.length,
  }
}

// ── Block type frequency breakdown ────────────────────────────────────────

function topBlockTypes(annotations: BlockAnnotationRow[]) {
  const counts: Record<string, number> = {}
  for (const a of annotations) counts[a.block_type] = (counts[a.block_type] ?? 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6)
}

// ── Edit stats (existing) ─────────────────────────────────────────────────


interface EditRow {
  worksheet_id: string
  topic: string
  exam_board: string
  worksheet_type: string
  blocks_added: number
  blocks_removed: number
  blocks_modified: number
  block_types_added: string[]
  block_types_removed: string[]
  block_types_modified: string[]
  questions_added: number
  questions_removed: number
  marks_raised: number
  marks_lowered: number
  stems_edited: number
  original_block_count: number
  final_block_count: number
  last_updated: string
}

function pct(n: number, total: number) {
  if (!total) return '—'
  return `${Math.round((n / total) * 100)}%`
}

function avg(rows: EditRow[], key: keyof EditRow) {
  if (!rows.length) return '—'
  const sum = rows.reduce((a, r) => a + (r[key] as number), 0)
  return (sum / rows.length).toFixed(1)
}

function countTypes(rows: EditRow[], key: 'block_types_added' | 'block_types_removed' | 'block_types_modified') {
  const counts: Record<string, number> = {}
  for (const row of rows) {
    for (const t of row[key] ?? []) {
      counts[t] = (counts[t] ?? 0) + 1
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

const TYPE_LABELS: Record<string, string> = {
  maths: 'Maths', knowledge: 'Knowledge', practical: 'Practical',
}

export function InsightsPage() {
  const { profile } = useProfileContext()
  const [rows, setRows] = useState<EditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const ann = useAnnotationInsights(profile?.id ?? null)

  useEffect(() => {
    if (!profile || !isConfigured) { setLoading(false); return }
    supabase
      .from('worksheet_edits')
      .select('*')
      .eq('profile_id', profile.id)
      .order('last_updated', { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as EditRow[])
        setLoading(false)
      })
  }, [profile])

  const filtered = filter === 'all' ? rows : rows.filter(r => r.worksheet_type === filter)
  const edited = filtered.filter(r => r.blocks_added + r.blocks_removed + r.blocks_modified > 0)
  const worksheetTypes = [...new Set(rows.map(r => r.worksheet_type).filter(Boolean))]

  const removedTypes = countTypes(filtered, 'block_types_removed')
  const addedTypes   = countTypes(filtered, 'block_types_added')
  const modifiedTypes = countTypes(filtered, 'block_types_modified')

  return (
    <div className="insights-layout">
      <Topbar />
      <main className="insights-main">
        <div className="insights-header">
          <h1 className="insights-title">Edit Insights</h1>
          <p className="insights-subtitle">
            How your AI-generated worksheets are being refined — patterns that inform better generation.
          </p>
          <div className="insights-filters">
            <button
              className={`insights-filter${filter === 'all' ? ' insights-filter--on' : ''}`}
              onClick={() => setFilter('all')}
            >All types</button>
            {worksheetTypes.map(t => (
              <button
                key={t}
                className={`insights-filter${filter === t ? ' insights-filter--on' : ''}`}
                onClick={() => setFilter(t)}
              >{TYPE_LABELS[t] ?? t}</button>
            ))}
          </div>
        </div>

        {/* ── AI insights from annotations ── */}
        <section className="insights-ai-section">
          <div className="insights-ai-header">
            <div>
              <h2 className="insights-ai-title">AI insights</h2>
              <p className="insights-ai-subtitle">
                {ann.loadingAnnotations
                  ? 'Loading your annotations…'
                  : ann.totalAnnotations > 0
                    ? `Based on ${ann.totalAnnotations} annotation${ann.totalAnnotations !== 1 ? 's' : ''} across your worksheets`
                    : 'No annotations yet — annotate worksheets from the editor or gallery to build up insights.'}
              </p>
            </div>
            {ann.totalAnnotations > 0 && (
              <button
                className="insights-ai-generate-btn"
                onClick={ann.generate}
                disabled={ann.generating}
              >
                {ann.generating
                  ? <><span className="insights-ai-spinner" /> Analysing…</>
                  : ann.latestInsight ? '↺ Regenerate' : '✦ Generate insights'}
              </button>
            )}
          </div>

          {ann.genError && <p className="insights-ai-error">{ann.genError}</p>}

          {ann.latestInsight ? (
            <div className="insights-ai-result">
              <div className="insights-ai-result-meta">
                Generated {new Date(ann.latestInsight.generated_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })} · from {ann.latestInsight.annotation_count} annotation{ann.latestInsight.annotation_count !== 1 ? 's' : ''}
              </div>
              <div className="insights-ai-result-text">
                {ann.latestInsight.insight_text.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          ) : !ann.loadingAnnotations && ann.totalAnnotations === 0 ? null : (
            !ann.latestInsight && !ann.generating && ann.totalAnnotations > 0 && (
              <p className="insights-ai-prompt">
                Click "Generate insights" to get Claude's analysis of your teaching patterns.
              </p>
            )
          )}

          {/* Annotation breakdown */}
          {ann.blockAnnotations.length > 0 && (
            <div className="insights-ann-breakdown">
              <h3 className="insights-ann-breakdown-title">Most annotated block types</h3>
              <div className="insights-ann-chips">
                {topBlockTypes(ann.blockAnnotations).map(([type, count]) => (
                  <span key={type} className="insights-ann-chip">
                    <span className="insights-ann-chip-type">{type.replace(/_/g, ' ')}</span>
                    <span className="insights-ann-chip-count">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <hr className="insights-divider" />

        {/* ── Edit statistics ── */}
        {loading ? (
          <div className="insights-empty">Loading edit statistics…</div>
        ) : rows.length === 0 ? (
          <div className="insights-empty">
            No edit tracking data yet. Generate a worksheet with AI, make some edits, and come back here.
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="insights-cards">
              <div className="insights-card">
                <div className="insights-card-value">{filtered.length}</div>
                <div className="insights-card-label">AI worksheets tracked</div>
              </div>
              <div className="insights-card">
                <div className="insights-card-value">{edited.length}</div>
                <div className="insights-card-label">worksheets edited</div>
              </div>
              <div className="insights-card">
                <div className="insights-card-value">{pct(edited.length, filtered.length)}</div>
                <div className="insights-card-label">edit rate</div>
              </div>
              <div className="insights-card">
                <div className="insights-card-value">{avg(edited, 'blocks_modified')}</div>
                <div className="insights-card-label">avg blocks modified</div>
              </div>
              <div className="insights-card">
                <div className="insights-card-value">{avg(edited, 'stems_edited')}</div>
                <div className="insights-card-label">avg question stems changed</div>
              </div>
              <div className="insights-card">
                <div className="insights-card-value">{avg(edited, 'questions_added')}</div>
                <div className="insights-card-label">avg questions added</div>
              </div>
            </div>

            {/* Block type breakdown */}
            <div className="insights-section-row">
              <section className="insights-section">
                <h2 className="insights-section-title">Most removed block types</h2>
                {removedTypes.length === 0
                  ? <p className="insights-none">No blocks removed yet</p>
                  : removedTypes.slice(0, 8).map(([type, count]) => (
                    <div key={type} className="insights-bar-row">
                      <span className="insights-bar-label">{type.replace(/_/g, ' ')}</span>
                      <div className="insights-bar-track">
                        <div
                          className="insights-bar-fill insights-bar-fill--removed"
                          style={{ width: `${(count / removedTypes[0][1]) * 100}%` }}
                        />
                      </div>
                      <span className="insights-bar-count">{count}</span>
                    </div>
                  ))}
              </section>

              <section className="insights-section">
                <h2 className="insights-section-title">Most added block types</h2>
                {addedTypes.length === 0
                  ? <p className="insights-none">No blocks added yet</p>
                  : addedTypes.slice(0, 8).map(([type, count]) => (
                    <div key={type} className="insights-bar-row">
                      <span className="insights-bar-label">{type.replace(/_/g, ' ')}</span>
                      <div className="insights-bar-track">
                        <div
                          className="insights-bar-fill insights-bar-fill--added"
                          style={{ width: `${(count / addedTypes[0][1]) * 100}%` }}
                        />
                      </div>
                      <span className="insights-bar-count">{count}</span>
                    </div>
                  ))}
              </section>

              <section className="insights-section">
                <h2 className="insights-section-title">Most modified block types</h2>
                {modifiedTypes.length === 0
                  ? <p className="insights-none">No blocks modified yet</p>
                  : modifiedTypes.slice(0, 8).map(([type, count]) => (
                    <div key={type} className="insights-bar-row">
                      <span className="insights-bar-label">{type.replace(/_/g, ' ')}</span>
                      <div className="insights-bar-track">
                        <div
                          className="insights-bar-fill insights-bar-fill--modified"
                          style={{ width: `${(count / modifiedTypes[0][1]) * 100}%` }}
                        />
                      </div>
                      <span className="insights-bar-count">{count}</span>
                    </div>
                  ))}
              </section>
            </div>

            {/* Mark scheme accuracy */}
            {edited.some(r => r.marks_raised + r.marks_lowered > 0) && (
              <section className="insights-section insights-section--full">
                <h2 className="insights-section-title">Mark adjustments</h2>
                <div className="insights-cards insights-cards--sm">
                  <div className="insights-card insights-card--green">
                    <div className="insights-card-value">
                      {edited.reduce((a, r) => a + r.marks_raised, 0)}
                    </div>
                    <div className="insights-card-label">marks raised across all worksheets</div>
                  </div>
                  <div className="insights-card insights-card--red">
                    <div className="insights-card-value">
                      {edited.reduce((a, r) => a + r.marks_lowered, 0)}
                    </div>
                    <div className="insights-card-label">marks lowered across all worksheets</div>
                  </div>
                </div>
              </section>
            )}

            {/* Recent edits table */}
            <section className="insights-section insights-section--full">
              <h2 className="insights-section-title">Recent worksheets</h2>
              <div className="insights-table-wrap">
                <table className="insights-table">
                  <thead>
                    <tr>
                      <th>Topic</th>
                      <th>Type</th>
                      <th>Board</th>
                      <th>+blocks</th>
                      <th>−blocks</th>
                      <th>~blocks</th>
                      <th>stems edited</th>
                      <th>marks ↑</th>
                      <th>marks ↓</th>
                      <th>last saved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 20).map(row => (
                      <tr key={row.worksheet_id}>
                        <td className="insights-td-topic">{row.topic || '—'}</td>
                        <td>{TYPE_LABELS[row.worksheet_type] ?? row.worksheet_type ?? '—'}</td>
                        <td>{row.exam_board || '—'}</td>
                        <td className="insights-td-num">{row.blocks_added || '—'}</td>
                        <td className="insights-td-num">{row.blocks_removed || '—'}</td>
                        <td className="insights-td-num">{row.blocks_modified || '—'}</td>
                        <td className="insights-td-num">{row.stems_edited || '—'}</td>
                        <td className="insights-td-num">{row.marks_raised || '—'}</td>
                        <td className="insights-td-num">{row.marks_lowered || '—'}</td>
                        <td className="insights-td-date">
                          {new Date(row.last_updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
