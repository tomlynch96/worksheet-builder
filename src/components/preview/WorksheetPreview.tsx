import katex from 'katex'
import 'katex/contrib/mhchem'
import { useRef, useLayoutEffect, useState } from 'react'
import type { Worksheet, Block, HeaderBlock, InstructionsBlock, QuestionBlock, WorkedExampleBlock, FigureBlock, SpacerBlock, InformationBlock, MatchThemUpBlock, ClozeBlock, OrderStepsBlock, MultipleChoiceBlock, DataBlock } from '../../types/worksheet'
import { seededShuffle, clozeToDisplayParts, extractClozeWords } from '../../utils/shuffle'
import { splitIntoPages, estimateBlockHeight } from '../../utils/pagination'
import { computeGraphLayout, toSvgCoords, catmullRomPath, computeBarLayout } from '../../utils/graphLayout'
import './WorksheetPreview.css'

const NUMBERED_TYPES = new Set(['question', 'multiple_choice', 'match_them_up', 'cloze', 'order_steps'])

function getQuestionNumber(blocks: Block[], id: string): number {
  let n = 0
  for (const b of blocks) {
    if (NUMBERED_TYPES.has(b.type)) n++
    if (b.id === id) return n
  }
  return n
}

// Post-process Tiptap HTML: replace empty math spans with rendered MathML
function withMath(html: string): string {
  if (!html || (!html.includes('data-type="math"') && !html.includes('data-type="chem"'))) return html
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  doc.querySelectorAll('[data-type="math"]').forEach(el => {
    const latex = el.getAttribute('data-latex') || ''
    el.innerHTML = katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false,
      output: 'mathml',
    })
  })
  doc.querySelectorAll('[data-type="chem"]').forEach(el => {
    const chem = el.getAttribute('data-chem') || ''
    el.innerHTML = katex.renderToString(`\\ce{${chem}}`, {
      throwOnError: false,
      displayMode: false,
      output: 'mathml',
    })
  })
  return (doc.body.firstElementChild as HTMLElement).innerHTML
}

// Render rich HTML (with math) or plain text safely
function RichText({ html, className }: { html: string; className?: string }) {
  if (!html || html === '<p></p>') return <span className="pr-placeholder">—</span>
  if (html.includes('<')) {
    return <span className={className} dangerouslySetInnerHTML={{ __html: withMath(html) }} />
  }
  return <span className={className}>{html}</span>
}

function AnswerLines({ count }: { count: number }) {
  return (
    <div className="answer-lines">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="answer-line" />
      ))}
    </div>
  )
}

function PreviewHeader({ block }: { block: HeaderBlock }) {
  return (
    <div className="pr-header">
      <div className="pr-header-badges">
        <span className="pr-badge pr-badge--board">{block.examBoard}</span>
        {block.tier !== 'both' && (
          <span className="pr-badge pr-badge--tier">{block.tier === 'higher' ? 'Higher Tier' : 'Foundation Tier'}</span>
        )}
      </div>
      <h1 className="pr-title">{block.title || 'Worksheet Title'}</h1>
      {block.topic && <p className="pr-topic">{block.topic}</p>}
      {(block.showName || block.showDate || block.showClass) && (
        <div className="pr-student-fields">
          {block.showName  && <span className="pr-field-line">Name: <span className="pr-underline" /></span>}
          {block.showDate  && <span className="pr-field-line">Date: <span className="pr-underline pr-underline--short" /></span>}
          {block.showClass && <span className="pr-field-line">Class: <span className="pr-underline pr-underline--short" /></span>}
        </div>
      )}
      <div className="pr-header-rule" />
    </div>
  )
}

function PreviewInstructions({ block }: { block: InstructionsBlock }) {
  if (block.items.length === 0) return null
  return (
    <div className="pr-instructions">
      <ul className="pr-instructions-list">
        {block.items.map((item, i) => <li key={i}><RichText html={item} /></li>)}
      </ul>
    </div>
  )
}

function PreviewQuestion({ block, blocks, num }: { block: QuestionBlock; blocks: Block[]; num: number }) {
  const hasParts = block.parts.length > 0
  return (
    <div className="pr-question">
      <div className="pr-question-stem">
        <span className="pr-q-num">{num}.</span>
        <span className="pr-q-text">
          {block.stem ? <RichText html={block.stem} /> : <em className="pr-placeholder">Question stem…</em>}
        </span>
        {!hasParts && block.marks > 0 && (
          <span className="pr-marks">[{block.marks} mark{block.marks !== 1 ? 's' : ''}]</span>
        )}
      </div>
      {block.attachedDataId && <InlineData dataId={block.attachedDataId} blocks={blocks} />}
      {block.attachedFigureId && <InlineFigure figureId={block.attachedFigureId} blocks={blocks} />}
      {!hasParts && <AnswerLines count={block.lines} />}
      {hasParts && (
        <div className="pr-parts">
          {block.parts.map(part => (
            <div key={part.id} className="pr-part">
              <div className="pr-part-stem">
                <span className="pr-part-label">({part.label})</span>
                <span className="pr-q-text">
                  {part.stem ? <RichText html={part.stem} /> : <em className="pr-placeholder">Sub-question…</em>}
                </span>
                {part.marks > 0 && (
                  <span className="pr-marks">[{part.marks} mark{part.marks !== 1 ? 's' : ''}]</span>
                )}
              </div>
              {part.attachedDataId && <InlineData dataId={part.attachedDataId} blocks={blocks} />}
              {part.attachedFigureId && <InlineFigure figureId={part.attachedFigureId} blocks={blocks} />}
              <AnswerLines count={part.lines} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PreviewMultipleChoice({ block, num }: { block: MultipleChoiceBlock; num: number }) {
  const LABELS = ['A', 'B', 'C', 'D', 'E', 'F']
  return (
    <div className="pr-question">
      <div className="pr-question-stem">
        <span className="pr-q-num">{num}.</span>
        <span className="pr-q-text">
          {block.stem ? <RichText html={block.stem} /> : <em className="pr-placeholder">Question stem…</em>}
        </span>
        {block.marks > 0 && (
          <span className="pr-marks">[{block.marks} mark{block.marks !== 1 ? 's' : ''}]</span>
        )}
      </div>
      <div className="pr-mc-options">
        {block.options.map((opt, i) => (
          <div key={i} className="pr-mc-option">
            <span className="pr-mc-label">{LABELS[i] ?? i + 1}</span>
            {opt ? <RichText html={opt} /> : <em className="pr-placeholder">Option…</em>}
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewWorkedExample({ block }: { block: WorkedExampleBlock }) {
  return (
    <div className="pr-worked-example">
      <div className="pr-worked-title">{block.title || 'Worked example'}</div>
      <div className="pr-worked-steps">
        {block.steps.map((step, i) => (
          <div key={i} className="pr-worked-step">{step ? <RichText html={step} /> : <em className="pr-placeholder">Step…</em>}</div>
        ))}
      </div>
    </div>
  )
}

function PreviewInformation({ block }: { block: InformationBlock }) {
  return (
    <div className="pr-information">
      {block.heading && <div className="pr-information-heading">{block.heading}</div>}
      <div className="pr-information-content">
        {block.content ? <RichText html={block.content} /> : <em className="pr-placeholder">Information text…</em>}
      </div>
    </div>
  )
}

function PreviewMatchThemUp({ block, num }: { block: MatchThemUpBlock; num: number }) {
  const shuffledRight = seededShuffle(block.items.map(i => i.right), block.id)
  return (
    <div className="pr-match">
      <div className="pr-question-stem" style={{ marginBottom: 8 }}>
        <span className="pr-q-num">{num}.</span>
        <span className="pr-q-text">
          {block.heading || <em className="pr-placeholder">Match each term to its definition.</em>}
        </span>
      </div>
      <div className="pr-match-table">
        <div className="pr-match-col">
          {block.items.map((item, i) => (
            <div key={item.id} className="pr-match-cell pr-match-cell--left">
              {item.left ? <RichText html={item.left} /> : <em className="pr-placeholder">Term {i + 1}…</em>}
            </div>
          ))}
        </div>
        <div className="pr-match-gap" />
        <div className="pr-match-col">
          {shuffledRight.map((right, i) => (
            <div key={i} className="pr-match-cell pr-match-cell--right">
              {right ? <RichText html={right} /> : <em className="pr-placeholder">Definition {i + 1}…</em>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewCloze({ block, num }: { block: ClozeBlock; num: number }) {
  const parts = clozeToDisplayParts(block.text)
  const words = seededShuffle(extractClozeWords(block.text), block.id)
  return (
    <div className="pr-cloze">
      <div className="pr-question-stem" style={{ marginBottom: 8 }}>
        <span className="pr-q-num">{num}.</span>
        <span className="pr-q-text">
          {block.heading || <em className="pr-placeholder">Fill in the blanks.</em>}
        </span>
      </div>
      {block.showWordBank && words.length > 0 && (
        <div className="pr-word-bank">
          {words.map((w, i) => (
            <span key={i} className="pr-word-bank-word">{w}</span>
          ))}
        </div>
      )}
      <p className="pr-cloze-text">
        {parts.length === 0
          ? <em className="pr-placeholder">Enter cloze text with [bracketed] words…</em>
          : parts.map((part, i) =>
              part.type === 'blank'
                ? <span key={i} className="pr-cloze-blank">{'_'.repeat(Math.max(part.value.length + 4, 8))}</span>
                : <span key={i}>{part.value}</span>
            )
        }
      </p>
    </div>
  )
}

function PreviewOrderSteps({ block, num }: { block: OrderStepsBlock; num: number }) {
  const shuffled = seededShuffle(block.steps, block.id)
  return (
    <div className="pr-order-steps">
      <div className="pr-question-stem" style={{ marginBottom: 8 }}>
        <span className="pr-q-num">{num}.</span>
        <span className="pr-q-text">
          {block.heading || <em className="pr-placeholder">Number these steps in the correct order.</em>}
        </span>
      </div>
      <div className="pr-steps-list">
        {shuffled.map((step, i) => (
          <div key={i} className="pr-step-row">
            <span className="pr-step-box" />
            {step ? <RichText html={step} /> : <em className="pr-placeholder">Step…</em>}
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewFigure({ block }: { block: FigureBlock }) {
  const heights: Record<FigureBlock['size'], number> = { small: 80, medium: 140, large: 200 }
  return (
    <div className="pr-figure" style={{ height: heights[block.size] }}>
      {block.imageData
        ? <img src={block.imageData} alt={block.caption} className="pr-figure-image" />
        : null}
      {block.caption && <span className="pr-figure-label">{block.caption}</span>}
      {!block.imageData && !block.caption && <span className="pr-figure-label pr-placeholder">Add a caption…</span>}
    </div>
  )
}

function PreviewSpacer({ block }: { block: SpacerBlock }) {
  const heights: Record<SpacerBlock['size'], number> = { small: 16, medium: 32, large: 56 }
  return <div style={{ height: heights[block.size] }} />
}

function PreviewDataTable({ block }: { block: DataBlock }) {
  const { columns, rows, heading } = block
  return (
    <div className="pr-data-table">
      {heading && <p className="pr-data-heading">{heading}</p>}
      <table className="pr-table">
        <thead>
          <tr>
            {columns.map((col, c) => (
              <th key={c} className="pr-th">
                {col.label}{col.unit ? ` (${col.unit})` : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => <td key={c} className="pr-td">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const SVG_W = 440, SVG_H = 300
const ML = 48, MR = 16, MT = 16, MB = 44  // margins
const PLOT_W = SVG_W - ML - MR
const PLOT_H = SVG_H - MT - MB

function PreviewDataGraph({ block }: { block: DataBlock }) {
  const { columns, rows, graph, heading } = block
  const layout = computeGraphLayout(rows, graph.xCol, graph.yCol, graph.omitRows)
  const xLabel = columns[graph.xCol]
  const yLabel = columns[graph.yCol]

  function toS(x: number, y: number) {
    const p = toSvgCoords({ x, y }, layout, PLOT_W, PLOT_H)
    return { cx: p.cx + ML, cy: p.cy + MT }
  }

  const { xTicks, yTicks, points, bestFitLine, xMin, xMax, yMin, yMax } = layout
  const xMajorStep = xTicks.length > 1 ? xTicks[1].value - xTicks[0].value : Math.max(xMax - xMin, 1)
  const yMajorStep = yTicks.length > 1 ? yTicks[1].value - yTicks[0].value : Math.max(yMax - yMin, 1)
  const xMinorStep = Math.max(xMajorStep / 5, 1e-10)
  const yMinorStep = Math.max(yMajorStep / 5, 1e-10)

  const xMinorLines: number[] = []
  for (let v = xMin; v <= xMax + xMinorStep * 0.01; v += xMinorStep) {
    const r = Math.round(v * 1e9) / 1e9
    if (!xTicks.some(t => Math.abs(t.value - r) < xMinorStep * 0.01)) xMinorLines.push(r)
  }
  const yMinorLines: number[] = []
  for (let v = yMin; v <= yMax + yMinorStep * 0.01; v += yMinorStep) {
    const r = Math.round(v * 1e9) / 1e9
    if (!yTicks.some(t => Math.abs(t.value - r) < yMinorStep * 0.01)) yMinorLines.push(r)
  }

  return (
    <div className="pr-data-graph">
      {heading && <p className="pr-data-heading">{heading}</p>}
      <svg width={SVG_W} height={SVG_H} className="pr-graph-svg">
        {/* Minor gridlines */}
        {xMinorLines.map((v, i) => {
          const { cx } = toS(v, yMin)
          return <line key={i} x1={cx} y1={MT} x2={cx} y2={MT + PLOT_H} stroke="#e5e7eb" strokeWidth="0.5" />
        })}
        {yMinorLines.map((v, i) => {
          const { cy } = toS(xMin, v)
          return <line key={i} x1={ML} y1={cy} x2={ML + PLOT_W} y2={cy} stroke="#e5e7eb" strokeWidth="0.5" />
        })}
        {/* Major gridlines */}
        {xTicks.map((t, i) => {
          const { cx } = toS(t.value, yMin)
          return <line key={i} x1={cx} y1={MT} x2={cx} y2={MT + PLOT_H} stroke="#d1d5db" strokeWidth="1" />
        })}
        {yTicks.map((t, i) => {
          const { cy } = toS(xMin, t.value)
          return <line key={i} x1={ML} y1={cy} x2={ML + PLOT_W} y2={cy} stroke="#d1d5db" strokeWidth="1" />
        })}
        {/* Axes */}
        <line x1={ML} y1={MT} x2={ML} y2={MT + PLOT_H} stroke="#374151" strokeWidth="1.5" />
        <line x1={ML} y1={MT + PLOT_H} x2={ML + PLOT_W} y2={MT + PLOT_H} stroke="#374151" strokeWidth="1.5" />
        {/* X scale */}
        {graph.showXScale && xTicks.map((t, i) => {
          const { cx } = toS(t.value, yMin)
          return <text key={i} x={cx} y={MT + PLOT_H + 14} textAnchor="middle" fontSize="9" fill="#374151">{t.label}</text>
        })}
        {/* Y scale */}
        {graph.showYScale && yTicks.map((t, i) => {
          const { cy } = toS(xMin, t.value)
          return <text key={i} x={ML - 4} y={cy + 3} textAnchor="end" fontSize="9" fill="#374151">{t.label}</text>
        })}
        {/* Axis labels */}
        {graph.showXLabel && (
          <text x={ML + PLOT_W / 2} y={SVG_H - 3} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1f2937">
            {xLabel.label}{xLabel.unit ? ` (${xLabel.unit})` : ''}
          </text>
        )}
        {graph.showYLabel && (
          <text
            x={10}
            y={MT + PLOT_H / 2}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#1f2937"
            transform={`rotate(-90, 10, ${MT + PLOT_H / 2})`}
          >
            {yLabel.label}{yLabel.unit ? ` (${yLabel.unit})` : ''}
          </text>
        )}
        {/* Best fit */}
        {graph.fitType === 'linear' && bestFitLine && (() => {
          const p1 = toS(bestFitLine.x1, bestFitLine.y1)
          const p2 = toS(bestFitLine.x2, bestFitLine.y2)
          return <line x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy} stroke="#dc2626" strokeWidth="1.5" />
        })()}
        {graph.fitType === 'curve' && (
          <path d={catmullRomPath(points, layout, PLOT_W, PLOT_H, ML, MT)} fill="none" stroke="#dc2626" strokeWidth="1.5" />
        )}
        {/* Data points (×) */}
        {points.map((p, i) => {
          const { cx, cy } = toS(p.x, p.y)
          const d = 4
          return (
            <g key={i}>
              <line x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d} stroke="#1e3a5f" strokeWidth="1.5" />
              <line x1={cx + d} y1={cy - d} x2={cx - d} y2={cy + d} stroke="#1e3a5f" strokeWidth="1.5" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const BAR_W = 440, BAR_H = 280
const BAR_ML = 48, BAR_MR = 16, BAR_MT = 16, BAR_MB = 48
const BAR_PW = BAR_W - BAR_ML - BAR_MR
const BAR_PH = BAR_H - BAR_MT - BAR_MB

function PreviewDataBar({ block }: { block: DataBlock }) {
  const { columns, rows, graph, heading } = block
  const layout = computeBarLayout(rows, graph.xCol, graph.yCol, graph.omitRows)
  const { categories, yTicks, yMax } = layout
  const xLabel = columns[graph.xCol], yLabel = columns[graph.yCol]
  const total = categories.length
  const barW = total > 0 ? Math.min(40, (BAR_PW / total) * 0.6) : 30
  const gap = total > 0 ? BAR_PW / total : 40
  const yMinorStep = yTicks.length > 1 ? (yTicks[1].value - yTicks[0].value) / 5 : 0
  const yMinorLines: number[] = []
  if (yMinorStep > 0) {
    for (let v = 0; v <= yMax + yMinorStep * 0.01; v += yMinorStep) {
      const r = Math.round(v * 1e9) / 1e9
      if (!yTicks.some(t => Math.abs(t.value - r) < yMinorStep * 0.01)) yMinorLines.push(r)
    }
  }
  function barY(val: number) { return BAR_MT + BAR_PH - (val / yMax) * BAR_PH }
  return (
    <div className="pr-data-graph">
      {heading && <p className="pr-data-heading">{heading}</p>}
      <svg width={BAR_W} height={BAR_H} className="pr-graph-svg">
        {yMinorLines.map((v, i) => <line key={i} x1={BAR_ML} y1={barY(v)} x2={BAR_ML + BAR_PW} y2={barY(v)} stroke="#e5e7eb" strokeWidth="0.5" />)}
        {yTicks.map((t, i) => <line key={i} x1={BAR_ML} y1={barY(t.value)} x2={BAR_ML + BAR_PW} y2={barY(t.value)} stroke="#d1d5db" strokeWidth="1" />)}
        <line x1={BAR_ML} y1={BAR_MT} x2={BAR_ML} y2={BAR_MT + BAR_PH} stroke="#374151" strokeWidth="1.5" />
        <line x1={BAR_ML} y1={BAR_MT + BAR_PH} x2={BAR_ML + BAR_PW} y2={BAR_MT + BAR_PH} stroke="#374151" strokeWidth="1.5" />
        {graph.showYScale && yTicks.map((t, i) => <text key={i} x={BAR_ML - 4} y={barY(t.value) + 3} textAnchor="end" fontSize="9" fill="#374151">{t.label}</text>)}
        {categories.map((cat, i) => {
          const cx = BAR_ML + gap * i + gap / 2
          const h = yMax > 0 ? (cat.value / yMax) * BAR_PH : 0
          const y = BAR_MT + BAR_PH - h
          return (
            <g key={i}>
              {cat.visible && <rect x={cx - barW / 2} y={y} width={barW} height={h} fill="#3b82f6" opacity="0.8" />}
              {graph.showXScale && <text x={cx} y={BAR_MT + BAR_PH + 14} textAnchor="middle" fontSize="9" fill="#374151">{cat.label}</text>}
            </g>
          )
        })}
        {graph.showXLabel && <text x={BAR_ML + BAR_PW / 2} y={BAR_H - 3} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1f2937">{xLabel.label}{xLabel.unit ? ` (${xLabel.unit})` : ''}</text>}
        {graph.showYLabel && <text x={10} y={BAR_MT + BAR_PH / 2} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1f2937" transform={`rotate(-90, 10, ${BAR_MT + BAR_PH / 2})`}>{yLabel.label}{yLabel.unit ? ` (${yLabel.unit})` : ''}</text>}
      </svg>
    </div>
  )
}

function resolveData(block: DataBlock, blocks: Block[]): DataBlock {
  if (!block.graph.linkedDataId) return block
  const linked = blocks.find(b => b.type === 'data' && b.id === block.graph.linkedDataId) as DataBlock | undefined
  return linked ? { ...block, columns: linked.columns, rows: linked.rows } : block
}

function PreviewData({ block, blocks }: { block: DataBlock; blocks: Block[] }) {
  const resolved = resolveData(block, blocks)
  if (resolved.display === 'graph') return <PreviewDataGraph block={resolved} />
  if (resolved.display === 'bar') return <PreviewDataBar block={resolved} />
  return <PreviewDataTable block={resolved} />
}

function InlineData({ dataId, blocks, markScheme }: { dataId: string; blocks: Block[]; markScheme?: boolean }) {
  const found = blocks.find(b => b.id === dataId && b.type === 'data') as DataBlock | undefined
  if (!found) return null
  const block = markScheme ? { ...found, graph: { ...found.graph, omitRows: [] } } : found
  return <div className="pr-inline-data"><PreviewData block={block} blocks={blocks} /></div>
}

function InlineFigure({ figureId, blocks }: { figureId: string; blocks: Block[] }) {
  const found = blocks.find(b => b.id === figureId && b.type === 'figure') as FigureBlock | undefined
  if (!found) return null
  return <div className="pr-inline-data"><PreviewFigure block={found} /></div>
}

// ── Mark scheme variants ──────────────────────────────────────────────────────

function MSAnswer({ html }: { html?: string }) {
  return (
    <div className="pr-ms-answer">
      {html ? <RichText html={html} /> : <em className="pr-placeholder">No mark scheme added.</em>}
    </div>
  )
}

function PreviewQuestionMS({ block, blocks, num }: { block: QuestionBlock; blocks: Block[]; num: number }) {
  const hasParts = block.parts.length > 0
  return (
    <div className="pr-question">
      <div className="pr-question-stem">
        <span className="pr-q-num">{num}.</span>
        <span className="pr-q-text">
          {block.stem ? <RichText html={block.stem} /> : <em className="pr-placeholder">Question stem…</em>}
        </span>
        {!hasParts && block.marks > 0 && (
          <span className="pr-marks">[{block.marks} mark{block.marks !== 1 ? 's' : ''}]</span>
        )}
      </div>
      {block.attachedDataId && <InlineData dataId={block.attachedDataId} blocks={blocks} markScheme />}
      {block.attachedFigureId && <InlineFigure figureId={block.attachedFigureId} blocks={blocks} />}
      {hasParts ? (
        <div className="pr-parts">
          {block.parts.map(part => (
            <div key={part.id} className="pr-part">
              <div className="pr-part-stem">
                <span className="pr-part-label">({part.label})</span>
                <span className="pr-q-text">
                  {part.stem ? <RichText html={part.stem} /> : <em className="pr-placeholder">Sub-question…</em>}
                </span>
                {part.marks > 0 && (
                  <span className="pr-marks">[{part.marks} mark{part.marks !== 1 ? 's' : ''}]</span>
                )}
              </div>
              {part.attachedDataId && <InlineData dataId={part.attachedDataId} blocks={blocks} markScheme />}
              {part.attachedFigureId && <InlineFigure figureId={part.attachedFigureId} blocks={blocks} />}
              <MSAnswer html={part.markScheme} />
            </div>
          ))}
        </div>
      ) : (
        <MSAnswer html={block.markScheme} />
      )}
    </div>
  )
}

const MC_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

function PreviewMultipleChoiceMS({ block, num }: { block: MultipleChoiceBlock; num: number }) {
  return (
    <div className="pr-question">
      <div className="pr-question-stem">
        <span className="pr-q-num">{num}.</span>
        <span className="pr-q-text">
          {block.stem ? <RichText html={block.stem} /> : <em className="pr-placeholder">Question stem…</em>}
        </span>
        {block.marks > 0 && (
          <span className="pr-marks">[{block.marks} mark{block.marks !== 1 ? 's' : ''}]</span>
        )}
      </div>
      <div className="pr-mc-options">
        {block.options.map((opt, i) => (
          <div key={i} className={`pr-mc-option${i === block.correctIndex ? ' pr-mc-option--correct' : ''}`}>
            <span className="pr-mc-label">{MC_LABELS[i] ?? i + 1}</span>
            {opt ? <RichText html={opt} /> : <em className="pr-placeholder">Option…</em>}
            {i === block.correctIndex && <span className="pr-ms-tick">✓</span>}
          </div>
        ))}
      </div>
      {block.markScheme && <MSAnswer html={block.markScheme} />}
    </div>
  )
}

function PreviewClozeMS({ block, num }: { block: ClozeBlock; num: number }) {
  const parts = clozeToDisplayParts(block.text)
  return (
    <div className="pr-cloze">
      <div className="pr-question-stem" style={{ marginBottom: 8 }}>
        <span className="pr-q-num">{num}.</span>
        <span className="pr-q-text">{block.heading || <em className="pr-placeholder">Fill in the blanks.</em>}</span>
      </div>
      <p className="pr-cloze-text">
        {parts.length === 0
          ? <em className="pr-placeholder">Enter cloze text with [bracketed] words…</em>
          : parts.map((part, i) =>
              part.type === 'blank'
                ? <span key={i} className="pr-cloze-answer">{part.value}</span>
                : <span key={i}>{part.value}</span>
            )
        }
      </p>
    </div>
  )
}

function PreviewMatchThemUpMS({ block, num }: { block: MatchThemUpBlock; num: number }) {
  return (
    <div className="pr-match">
      <div className="pr-question-stem" style={{ marginBottom: 8 }}>
        <span className="pr-q-num">{num}.</span>
        <span className="pr-q-text">{block.heading || <em className="pr-placeholder">Match each term to its definition.</em>}</span>
      </div>
      <div className="pr-match-table">
        <div className="pr-match-col">
          {block.items.map((item, i) => (
            <div key={item.id} className="pr-match-cell pr-match-cell--left">
              {item.left ? <RichText html={item.left} /> : <em className="pr-placeholder">Term {i + 1}…</em>}
            </div>
          ))}
        </div>
        <div className="pr-match-arrow-col">
          {block.items.map((_, i) => <div key={i} className="pr-match-arrow">→</div>)}
        </div>
        <div className="pr-match-col">
          {block.items.map((item, i) => (
            <div key={item.id} className="pr-match-cell pr-match-cell--right pr-match-cell--correct">
              {item.right ? <RichText html={item.right} /> : <em className="pr-placeholder">Definition {i + 1}…</em>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewOrderStepsMS({ block, num }: { block: OrderStepsBlock; num: number }) {
  return (
    <div className="pr-order-steps">
      <div className="pr-question-stem" style={{ marginBottom: 8 }}>
        <span className="pr-q-num">{num}.</span>
        <span className="pr-q-text">{block.heading || <em className="pr-placeholder">Number these steps in the correct order.</em>}</span>
      </div>
      <div className="pr-steps-list">
        {block.steps.map((step, i) => (
          <div key={i} className="pr-step-row">
            <span className="pr-step-num">{i + 1}</span>
            {step ? <RichText html={step} /> : <em className="pr-placeholder">Step…</em>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function PreviewBlock({ block, blocks, mode }: { block: Block; blocks: Block[]; mode: 'worksheet' | 'markscheme' }) {
  const num = NUMBERED_TYPES.has(block.type) ? getQuestionNumber(blocks, block.id) : 0
  if (mode === 'markscheme') {
    switch (block.type) {
      case 'question':        return <PreviewQuestionMS block={block} blocks={blocks} num={num} />
      case 'multiple_choice': return <PreviewMultipleChoiceMS block={block} num={num} />
      case 'cloze':           return <PreviewClozeMS block={block} num={num} />
      case 'match_them_up':   return <PreviewMatchThemUpMS block={block} num={num} />
      case 'order_steps':     return <PreviewOrderStepsMS block={block} num={num} />
      default: break
    }
  }
  switch (block.type) {
    case 'header':          return <PreviewHeader block={block} />
    case 'instructions':    return <PreviewInstructions block={block} />
    case 'question':        return <PreviewQuestion block={block} blocks={blocks} num={num} />
    case 'multiple_choice': return <PreviewMultipleChoice block={block} num={num} />
    case 'worked_example':  return <PreviewWorkedExample block={block} />
    case 'information':     return <PreviewInformation block={block} />
    case 'match_them_up':   return <PreviewMatchThemUp block={block} num={num} />
    case 'cloze':           return <PreviewCloze block={block} num={num} />
    case 'order_steps':     return <PreviewOrderSteps block={block} num={num} />
    case 'figure':          return <PreviewFigure block={block} />
    case 'spacer':          return <PreviewSpacer block={block} />
    case 'data':            return <PreviewData block={block as DataBlock} blocks={blocks} />
  }
}

interface WorksheetPreviewProps {
  worksheet: Worksheet
  selectedId?: string | null
  onSelect?: (id: string) => void
  mode?: 'worksheet' | 'markscheme'
}

function getAttachedBlockIds(blocks: Block[]): Set<string> {
  const ids = new Set<string>()
  for (const b of blocks) {
    if (b.type === 'question') {
      if (b.attachedDataId) ids.add(b.attachedDataId)
      if (b.attachedFigureId) ids.add(b.attachedFigureId)
      for (const p of b.parts) {
        if (p.attachedDataId) ids.add(p.attachedDataId)
        if (p.attachedFigureId) ids.add(p.attachedFigureId)
      }
    }
  }
  return ids
}

export function WorksheetPreview({ worksheet, selectedId, onSelect, mode = 'worksheet' }: WorksheetPreviewProps) {
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({})
  const containerRef = useRef<HTMLDivElement | null>(null)

  const attachedIds = getAttachedBlockIds(worksheet.blocks)
  const renderableBlocks = worksheet.blocks.filter(b => !attachedIds.has(b.id))

  // After every render, measure each block's consumed space (including margin-bottom)
  // using offsetTop distances between siblings, which correctly capture collapsed margins.
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const children = Array.from(container.children) as HTMLElement[]
    const next: Record<string, number> = {}
    renderableBlocks.forEach((block, i) => {
      const el = children[i]
      if (!el) return
      if (i < children.length - 1) {
        next[block.id] = children[i + 1].offsetTop - el.offsetTop
      } else {
        const inner = el.firstElementChild as HTMLElement | null
        const mb = inner ? parseFloat(getComputedStyle(inner).marginBottom || '0') : 0
        next[block.id] = el.offsetHeight + mb
      }
    })
    setMeasuredHeights(prev => {
      const unchanged = renderableBlocks.every(b => prev[b.id] === next[b.id])
      return unchanged ? prev : next
    })
  })

  const heightOf = (block: Block) => measuredHeights[block.id] ?? estimateBlockHeight(block)
  const pages = splitIntoPages(renderableBlocks, heightOf)

  return (
    <>
      {/* Hidden container renders every block at the exact content width so
          heights reflect real text-wrapped sizes including collapsed margins. */}
      <div
        ref={containerRef}
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 658,
          visibility: 'hidden',
          pointerEvents: 'none',
          fontFamily: 'Arial, "Helvetica Neue", sans-serif',
          fontSize: '11pt',
          lineHeight: 1.45,
          color: '#000',
        }}
      >
        {renderableBlocks.map(block => (
          <div key={block.id}>
            <PreviewBlock block={block} blocks={worksheet.blocks} mode={mode} />
          </div>
        ))}
      </div>

      {pages.map((pageBlocks, pageIdx) => (
        <div key={pageIdx} className="a4-page">
          {mode === 'markscheme' && (
            <div className="pr-ms-page-banner">
              {pageIdx === 0 ? 'Mark Scheme' : `Mark Scheme — p.${pageIdx + 1}`}
            </div>
          )}
          {pageBlocks.map(block => {
            const isSelected = block.id === selectedId
            if (onSelect) {
              return (
                <div
                  key={block.id}
                  className={`preview-block-wrap ${isSelected ? 'preview-block-wrap--selected' : ''}`}
                  onClick={() => onSelect(block.id)}
                  title="Click to edit"
                >
                  <PreviewBlock block={block} blocks={worksheet.blocks} mode={mode} />
                </div>
              )
            }
            return <PreviewBlock key={block.id} block={block} blocks={worksheet.blocks} mode={mode} />
          })}
        </div>
      ))}
    </>
  )
}
