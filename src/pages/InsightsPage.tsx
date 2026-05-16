import { useState, useEffect } from 'react'
import { Topbar } from '../components/layout/Topbar'
import { useProfileContext } from '../context/ProfileContext'
import { supabase, isConfigured } from '../lib/supabase'
import './InsightsPage.css'

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

        {loading ? (
          <div className="insights-empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="insights-empty">
            No data yet. Generate a worksheet with AI, make some edits, and come back here.
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
