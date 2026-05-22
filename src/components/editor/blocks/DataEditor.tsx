import { useRef } from 'react'
import type { DataBlock, Block } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import './DataEditor.css'

interface Props { block: DataBlock; dispatch: React.Dispatch<WorksheetAction>; blocks: Block[] }

function up(block: DataBlock, dispatch: React.Dispatch<WorksheetAction>, updates: Partial<DataBlock>) {
  dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
}

export function DataEditor({ block, dispatch, blocks }: Props) {
  const { columns, rows, display, graph, heading } = block
  const lastInputRef = useRef<HTMLInputElement | null>(null)
  const otherDataBlocks = blocks.filter(b => b.type === 'data' && b.id !== block.id) as DataBlock[]
  const linkedBlock = otherDataBlocks.find(b => b.id === graph.linkedDataId) ?? null
  const activeColumns = linkedBlock ? linkedBlock.columns : columns
  const activeRows = linkedBlock ? linkedBlock.rows : rows

  function updateCell(r: number, c: number, val: string) {
    const newRows = rows.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? val : cell) : row)
    up(block, dispatch, { rows: newRows })
  }

  function updateColumnLabel(c: number, label: string) {
    const newCols = columns.map((col, ci) => ci === c ? { ...col, label } : col)
    up(block, dispatch, { columns: newCols })
  }

  function updateColumnUnit(c: number, unit: string) {
    const newCols = columns.map((col, ci) => ci === c ? { ...col, unit } : col)
    up(block, dispatch, { columns: newCols })
  }

  function addColumn() {
    const newCols = [...columns, { label: `Column ${columns.length + 1}`, unit: '' }]
    const newRows = rows.map(r => [...r, ''])
    up(block, dispatch, { columns: newCols, rows: newRows })
  }

  function removeColumn(c: number) {
    if (columns.length <= 1) return
    const newCols = columns.filter((_, ci) => ci !== c)
    const newRows = rows.map(r => r.filter((_, ci) => ci !== c))
    const newGraph = {
      ...graph,
      xCol: Math.min(graph.xCol, newCols.length - 1),
      yCol: Math.min(graph.yCol, newCols.length - 1),
    }
    const newHidden = (block.hiddenColumns ?? [])
      .filter(i => i !== c)
      .map(i => i > c ? i - 1 : i)
    up(block, dispatch, { columns: newCols, rows: newRows, graph: newGraph, hiddenColumns: newHidden })
  }

  function toggleHideColumn(c: number) {
    const hidden = block.hiddenColumns ?? []
    const newHidden = hidden.includes(c) ? hidden.filter(i => i !== c) : [...hidden, c]
    up(block, dispatch, { hiddenColumns: newHidden })
  }

  function addRow() {
    up(block, dispatch, { rows: [...rows, columns.map(() => '')] })
  }

  function removeRow(r: number) {
    if (rows.length <= 1) return
    const newRows = rows.filter((_, ri) => ri !== r)
    const newOmit = graph.omitRows.filter(i => i !== r).map(i => i > r ? i - 1 : i)
    up(block, dispatch, { rows: newRows, graph: { ...graph, omitRows: newOmit } })
  }

  function updateGraph(updates: Partial<typeof graph>) {
    up(block, dispatch, { graph: { ...graph, ...updates } })
  }

  function toggleOmitRow(r: number) {
    const newOmit = graph.omitRows.includes(r)
      ? graph.omitRows.filter(i => i !== r)
      : [...graph.omitRows, r]
    updateGraph({ omitRows: newOmit })
  }

  return (
    <div className="de-wrap">
      <div className="de-field">
        <label className="de-label">Heading</label>
        <input
          className="de-input"
          value={heading}
          onChange={e => up(block, dispatch, { heading: e.target.value })}
          placeholder="e.g. Results table"
        />
      </div>

      <div className="de-field">
        <label className="de-label">Display</label>
        <div className="de-toggle">
          {(['table', 'graph', 'bar'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              className={`de-toggle-btn${display === mode ? ' de-toggle-btn--on' : ''}`}
              onClick={() => up(block, dispatch, { display: mode })}
            >{mode === 'table' ? 'Table' : mode === 'graph' ? 'Graph' : 'Bar chart'}</button>
          ))}
        </div>
      </div>

      {otherDataBlocks.length > 0 && (
        <div className="de-field">
          <label className="de-label">Link data from</label>
          <select
            className="de-select"
            value={graph.linkedDataId ?? ''}
            onChange={e => { const v = e.target.value; updateGraph({ linkedDataId: v || null }) }}
          >
            <option value="">— own data —</option>
            {otherDataBlocks.map(b => (
              <option key={b.id} value={b.id}>{b.heading || `Data block (${b.id.slice(0, 6)})`}</option>
            ))}
          </select>
          {linkedBlock && <p className="de-hint">Showing data from "{linkedBlock.heading}". This block's own rows are ignored.</p>}
        </div>
      )}

      {/* Column headers — only editable when using own data */}
      {!linkedBlock && (
        <>
          <div className="de-section-label">Columns</div>
          <div className="de-cols">
            {activeColumns.map((col, c) => (
              <div key={c} className="de-col-editor">
                <input className="de-input de-col-label-input" value={col.label} onChange={e => updateColumnLabel(c, e.target.value)} placeholder="Label" />
                <input className="de-input de-col-unit-input" value={col.unit} onChange={e => updateColumnUnit(c, e.target.value)} placeholder="Unit" />
                {display === 'table' && (
                  <button
                    type="button"
                    className={`de-eye-btn${(block.hiddenColumns ?? []).includes(c) ? ' de-eye-btn--hidden' : ''}`}
                    onClick={() => toggleHideColumn(c)}
                    title={(block.hiddenColumns ?? []).includes(c) ? 'Hidden on worksheet — click to show' : 'Visible on worksheet — click to hide'}
                  >👁</button>
                )}
                {activeColumns.length > 1 && <button type="button" className="de-remove-btn" onClick={() => removeColumn(c)} title="Remove column">×</button>}
              </div>
            ))}
            <button type="button" className="de-add-btn" onClick={addColumn}>+ Column</button>
          </div>
        </>
      )}

      {/* Data rows */}
      <div className="de-section-label">{linkedBlock ? `Data (from "${linkedBlock.heading}")` : 'Data'}</div>
      <div className="de-table-wrap">
        <table className="de-table">
          <thead>
            <tr>
              {(display === 'graph' || display === 'bar') && <th className="de-th de-th-omit" title="Include in chart">✓</th>}
              {activeColumns.map((col, c) => (
                <th key={c} className="de-th">{col.label}{col.unit ? ` (${col.unit})` : ''}</th>
              ))}
              {!linkedBlock && <th className="de-th de-th-del" />}
            </tr>
          </thead>
          <tbody>
            {activeRows.map((row, r) => (
              <tr key={r}>
                {(display === 'graph' || display === 'bar') && (
                  <td className="de-td de-td-omit">
                    <input type="checkbox" checked={!graph.omitRows.includes(r)} onChange={() => toggleOmitRow(r)} />
                  </td>
                )}
                {row.map((cell, c) => (
                  <td key={c} className={`de-td${(display === 'table' && (block.hiddenColumns ?? []).includes(c)) ? ' de-td--hidden' : ''}`}>
                    {linkedBlock
                      ? <span className="de-cell-readonly">{cell}</span>
                      : <input ref={r === rows.length - 1 && c === row.length - 1 ? lastInputRef : undefined} className="de-cell-input" value={cell} onChange={e => updateCell(r, c, e.target.value)} />
                    }
                  </td>
                ))}
                {!linkedBlock && (
                  <td className="de-td de-td-del">
                    {rows.length > 1 && <button type="button" className="de-remove-btn" onClick={() => removeRow(r)} title="Remove row">×</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!linkedBlock && <button type="button" className="de-add-btn" onClick={addRow}>+ Row</button>}

      {/* Graph / bar options */}
      {(display === 'graph' || display === 'bar') && (
        <div className="de-graph-opts">
          <div className="de-section-label">{display === 'bar' ? 'Bar chart options' : 'Graph options'}</div>
          <div className="de-graph-opt-row">
            <label className="de-label">{display === 'bar' ? 'Category column' : 'X axis column'}</label>
            <select className="de-select" value={graph.xCol} onChange={e => updateGraph({ xCol: Number(e.target.value) })}>
              {activeColumns.map((col, c) => <option key={c} value={c}>{col.label || `Column ${c + 1}`}</option>)}
            </select>
          </div>
          <div className="de-graph-opt-row">
            <label className="de-label">{display === 'bar' ? 'Value column' : 'Y axis column'}</label>
            <select className="de-select" value={graph.yCol} onChange={e => updateGraph({ yCol: Number(e.target.value) })}>
              {activeColumns.map((col, c) => <option key={c} value={c}>{col.label || `Column ${c + 1}`}</option>)}
            </select>
          </div>
          <div className="de-graph-checks">
            <label className="de-check"><input type="checkbox" checked={graph.showXLabel} onChange={e => updateGraph({ showXLabel: e.target.checked })} /> Show x-axis label</label>
            <label className="de-check"><input type="checkbox" checked={graph.showYLabel} onChange={e => updateGraph({ showYLabel: e.target.checked })} /> Show y-axis label</label>
            <label className="de-check"><input type="checkbox" checked={graph.showXScale} onChange={e => updateGraph({ showXScale: e.target.checked })} /> Show x-axis scale</label>
            <label className="de-check"><input type="checkbox" checked={graph.showYScale} onChange={e => updateGraph({ showYScale: e.target.checked })} /> Show y-axis scale</label>
            {display === 'graph' && (
              <div className="de-fit-row">
                <span className="de-label">Best fit</span>
                {(['none', 'linear', 'curve'] as const).map(ft => (
                  <label key={ft} className="de-check">
                    <input type="radio" name={`fit-${block.id}`} checked={graph.fitType === ft} onChange={() => updateGraph({ fitType: ft })} />
                    {ft === 'none' ? 'None' : ft === 'linear' ? 'Straight line' : 'Smooth curve'}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
