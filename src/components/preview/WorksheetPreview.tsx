import katex from 'katex'
import 'katex/contrib/mhchem'
import { useRef, useLayoutEffect, useEffect, useState, type RefObject } from 'react'
import type { Worksheet, Block, HeaderBlock, InstructionsBlock, QuestionBlock, WorkedExampleBlock, FigureBlock, SpacerBlock, InformationBlock, MatchThemUpBlock, ClozeBlock, OrderStepsBlock, MultipleChoiceBlock, DataBlock, NumericalAnswersBlock } from '../../types/worksheet'
import { seededShuffle, clozeToDisplayParts, extractClozeWords } from '../../utils/shuffle'
import { splitIntoPages, estimateBlockHeight, type PageBlock } from '../../utils/pagination'
import { computeGraphLayout, toSvgCoords, catmullRomPath, computeBarLayout } from '../../utils/graphLayout'
import { computeTotalMarks } from '../../utils/marks'
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

function AnswerLines({ count, show = true }: { count: number; show?: boolean }) {
  if (!show) return null
  return (
    <div className="answer-lines">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="answer-line" />
      ))}
    </div>
  )
}

function PreviewHeaderMS({ block }: { block: HeaderBlock }) {
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
      <div className="pr-header-rule" />
    </div>
  )
}

function PreviewHeader({ block, allBlocks }: { block: HeaderBlock; allBlocks: Block[] }) {
  const totalMarks = block.showTotalMarks ? computeTotalMarks(allBlocks) : 0
  return (
    <div className="pr-header">
      <div className="pr-header-top-row">
        <div className="pr-header-badges">
          <span className="pr-badge pr-badge--board">{block.examBoard}</span>
          {block.tier !== 'both' && (
            <span className="pr-badge pr-badge--tier">{block.tier === 'higher' ? 'Higher Tier' : 'Foundation Tier'}</span>
          )}
        </div>
        {block.showTotalMarks && totalMarks > 0 && (
          <span className="pr-total-marks">{totalMarks} marks</span>
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

function resolveDataIds(b: { attachedDataId?: string; attachedDataIds?: string[] }): string[] {
  if (b.attachedDataIds?.length) return b.attachedDataIds
  return b.attachedDataId ? [b.attachedDataId] : []
}

function PreviewQuestionParts({ parts, blocks, showLines }: { parts: QuestionBlock['parts']; blocks: Block[]; showLines: boolean }) {
  return (
    <div className="pr-parts">
      {parts.map(part => (
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
          {resolveDataIds(part).map(id => <InlineData key={id} dataId={id} blocks={blocks} />)}
          {part.attachedFigureId && <InlineFigure figureId={part.attachedFigureId} blocks={blocks} />}
          <AnswerLines count={part.lines} show={showLines} />
        </div>
      ))}
    </div>
  )
}

function PreviewQuestion({ block, blocks, num, showLines = true, isContinuation = false }: { block: QuestionBlock; blocks: Block[]; num: number; showLines?: boolean; isContinuation?: boolean }) {
  const hasParts = block.parts.length > 0

  if (isContinuation) {
    return (
      <div className="pr-question">
        <div className="pr-q-continuation">Question {num} (continued)</div>
        <PreviewQuestionParts parts={block.parts} blocks={blocks} showLines={showLines} />
      </div>
    )
  }

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
      {resolveDataIds(block).map(id => <InlineData key={id} dataId={id} blocks={blocks} />)}
      {block.attachedFigureId && <InlineFigure figureId={block.attachedFigureId} blocks={blocks} />}
      {!hasParts && <AnswerLines count={block.lines} show={showLines} />}
      {hasParts && <PreviewQuestionParts parts={block.parts} blocks={blocks} showLines={showLines} />}
    </div>
  )
}

function PreviewMultipleChoice({ block, num, blocks }: { block: MultipleChoiceBlock; num: number; blocks: Block[] }) {
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
      {block.attachedFigureId && <InlineFigure figureId={block.attachedFigureId} blocks={blocks} />}
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

function PreviewWorkedExample({ block, blocks }: { block: WorkedExampleBlock; blocks: Block[] }) {
  return (
    <div className="pr-worked-example">
      <div className="pr-worked-title">
        {block.title ? <RichText html={block.title} /> : 'Worked example'}
      </div>
      {block.attachedFigureId && <InlineFigure figureId={block.attachedFigureId} blocks={blocks} />}
      <div className="pr-worked-steps">
        {block.steps.map((step, i) => (
          <div key={i} className="pr-worked-step">{step ? <RichText html={step} /> : <em className="pr-placeholder">Step…</em>}</div>
        ))}
      </div>
    </div>
  )
}

function PreviewInformation({ block, blocks }: { block: InformationBlock; blocks: Block[] }) {
  return (
    <div className="pr-information">
      {block.heading && <div className="pr-information-heading"><RichText html={block.heading} /></div>}
      {block.attachedFigureId && <InlineFigure figureId={block.attachedFigureId} blocks={blocks} />}
      <div className="pr-information-content">
        {block.content ? <RichText html={block.content} /> : <em className="pr-placeholder">Information text…</em>}
      </div>
    </div>
  )
}

function PreviewMatchThemUp({ block, num, blocks }: { block: MatchThemUpBlock; num: number; blocks: Block[] }) {
  const shuffledRight = seededShuffle(block.items.map(i => i.right), block.id)
  const marks = block.items.length
  return (
    <div className="pr-match">
      <div className="pr-question-stem" style={{ marginBottom: 8 }}>
        <span className="pr-q-num">{num}.</span>
        <span className="pr-q-text">
          {block.heading ? <RichText html={block.heading} /> : <em className="pr-placeholder">Match each term to its definition.</em>}
        </span>
        {marks > 0 && <span className="pr-marks">[{marks} mark{marks !== 1 ? 's' : ''}]</span>}
      </div>
      {block.attachedFigureId && <InlineFigure figureId={block.attachedFigureId} blocks={blocks} />}
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

function PreviewCloze({ block, num, blocks }: { block: ClozeBlock; num: number; blocks: Block[] }) {
  const parts = clozeToDisplayParts(block.text)
  const words = seededShuffle(extractClozeWords(block.text), block.id)
  const marks = words.length
  return (
    <div className="pr-cloze">
      <div className="pr-question-stem" style={{ marginBottom: 8 }}>
        <span className="pr-q-num">{num}.</span>
        <span className="pr-q-text">
          {block.heading ? <RichText html={block.heading} /> : <em className="pr-placeholder">Fill in the blanks.</em>}
        </span>
        {marks > 0 && <span className="pr-marks">[{marks} mark{marks !== 1 ? 's' : ''}]</span>}
      </div>
      {block.attachedFigureId && <InlineFigure figureId={block.attachedFigureId} blocks={blocks} />}
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
                ? <span key={i} className="pr-cloze-blank" style={{ width: `${Math.max(part.value.length * 0.55 + 2, 4)}em` }} />
                : <span key={i}>{part.value.split('\n').map((line, j, arr) => (
                    <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                  ))}</span>
            )
        }
      </p>
    </div>
  )
}

function PreviewOrderSteps({ block, num, blocks }: { block: OrderStepsBlock; num: number; blocks: Block[] }) {
  const shuffled = seededShuffle(block.steps, block.id)
  const marks = block.steps.length
  return (
    <div className="pr-order-steps">
      <div className="pr-question-stem" style={{ marginBottom: 8 }}>
        <span className="pr-q-num">{num}.</span>
        <span className="pr-q-text">
          {block.heading ? <RichText html={block.heading} /> : <em className="pr-placeholder">Number these steps in the correct order.</em>}
        </span>
        {marks > 0 && <span className="pr-marks">[{marks} mark{marks !== 1 ? 's' : ''}]</span>}
      </div>
      {block.attachedFigureId && <InlineFigure figureId={block.attachedFigureId} blocks={blocks} />}
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
  const maxHeights: Record<FigureBlock['size'], number> = { small: 100, medium: 180, large: 300 }
  const maxH = maxHeights[block.size]
  return (
    <div className="pr-figure">
      {(block.imageData ?? block.imageUrl)
        ? <img src={block.imageData ?? block.imageUrl} alt={block.caption} className="pr-figure-image" style={{ maxHeight: maxH }} />
        : null}
      {block.caption && <span className="pr-figure-label">{block.caption}</span>}
      {!(block.imageData ?? block.imageUrl) && !block.caption && <span className="pr-figure-label pr-placeholder">Add a caption…</span>}
    </div>
  )
}

function PreviewSpacer({ block }: { block: SpacerBlock }) {
  const heights: Record<SpacerBlock['size'], number> = { small: 16, medium: 32, large: 56 }
  return <div style={{ height: heights[block.size] }} />
}

function PreviewDataTable({ block, markScheme = false }: { block: DataBlock; markScheme?: boolean }) {
  const { columns, rows, heading } = block
  const originalHidden = new Set(block.hiddenCells ?? [])
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
              {row.map((cell, c) => {
                const wasHidden = originalHidden.has(`${r},${c}`)
                const hide = !markScheme && wasHidden
                return (
                  <td key={c} className={`pr-td${markScheme && wasHidden ? ' pr-td--was-hidden' : ''}`}>
                    {hide ? '' : cell}
                  </td>
                )
              })}
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
        {graph.fitType === 'linear' && graph.showFitLine !== false && bestFitLine && (() => {
          const p1 = toS(bestFitLine.x1, bestFitLine.y1)
          const p2 = toS(bestFitLine.x2, bestFitLine.y2)
          return <line x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy} stroke="#dc2626" strokeWidth="1.5" />
        })()}
        {graph.fitType === 'curve' && graph.showFitLine !== false && (
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

function applyMarkSchemeToData(block: DataBlock): DataBlock {
  return {
    ...block,
    graph: {
      ...block.graph,
      omitRows: [],
      showFitLine: true,
      showXLabel: true,
      showYLabel: true,
      showXScale: true,
      showYScale: true,
    },
  }
}

function PreviewData({ block, blocks, markScheme = false }: { block: DataBlock; blocks: Block[]; markScheme?: boolean }) {
  const resolved = resolveData(block, blocks)
  const display = markScheme && (resolved.display === 'graph' || resolved.display === 'bar')
    ? applyMarkSchemeToData(resolved)
    : resolved
  if (display.display === 'graph') return <PreviewDataGraph block={display} />
  if (display.display === 'bar') return <PreviewDataBar block={display} />
  return <PreviewDataTable block={display} markScheme={markScheme} />
}

function InlineData({ dataId, blocks, markScheme }: { dataId: string; blocks: Block[]; markScheme?: boolean }) {
  const found = blocks.find(b => b.id === dataId && b.type === 'data') as DataBlock | undefined
  if (!found) return null
  return <div className="pr-inline-data"><PreviewData block={found} blocks={blocks} markScheme={markScheme} /></div>
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

function PreviewQuestionMSParts({ parts, blocks }: { parts: QuestionBlock['parts']; blocks: Block[] }) {
  return (
    <div className="pr-parts">
      {parts.map(part => (
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
          {resolveDataIds(part).map(id => <InlineData key={id} dataId={id} blocks={blocks} markScheme />)}
          {part.attachedFigureId && <InlineFigure figureId={part.attachedFigureId} blocks={blocks} />}
          <MSAnswer html={part.markScheme} />
        </div>
      ))}
    </div>
  )
}

function PreviewQuestionMS({ block, blocks, num, isContinuation = false }: { block: QuestionBlock; blocks: Block[]; num: number; isContinuation?: boolean }) {
  const hasParts = block.parts.length > 0

  if (isContinuation) {
    return (
      <div className="pr-question">
        <div className="pr-q-continuation">Question {num} (continued)</div>
        <PreviewQuestionMSParts parts={block.parts} blocks={blocks} />
      </div>
    )
  }

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
      {resolveDataIds(block).map(id => <InlineData key={id} dataId={id} blocks={blocks} markScheme />)}
      {block.attachedFigureId && <InlineFigure figureId={block.attachedFigureId} blocks={blocks} />}
      {hasParts ? (
        <PreviewQuestionMSParts parts={block.parts} blocks={blocks} />
      ) : (
        <MSAnswer html={block.markScheme} />
      )}
    </div>
  )
}

const MC_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

function PreviewMultipleChoiceMS({ block, num }: { block: MultipleChoiceBlock; num: number }) {
  const correctSet = new Set(block.correctIndices ?? [block.correctIndex])
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
          <div key={i} className={`pr-mc-option${correctSet.has(i) ? ' pr-mc-option--correct' : ''}`}>
            <span className="pr-mc-label">{MC_LABELS[i] ?? i + 1}</span>
            {opt ? <RichText html={opt} /> : <em className="pr-placeholder">Option…</em>}
            {correctSet.has(i) && <span className="pr-ms-tick">✓</span>}
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
        <span className="pr-q-text">{block.heading ? <RichText html={block.heading} /> : <em className="pr-placeholder">Fill in the blanks.</em>}</span>
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
  const PAIR_COLORS = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#db2777', '#0891b2']
  const shuffledRight = seededShuffle(block.items.map(i => i.right), block.id)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const leftRefs = useRef<(HTMLDivElement | null)[]>([])
  const rightRefs = useRef<(HTMLDivElement | null)[]>([])
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; color: string }[]>([])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const cr = container.getBoundingClientRect()
    const next = block.items.map((item, origIdx) => {
      const si = shuffledRight.indexOf(item.right)
      const le = leftRefs.current[origIdx]
      const re = rightRefs.current[si]
      if (!le || !re) return null
      const lr = le.getBoundingClientRect()
      const rr = re.getBoundingClientRect()
      return {
        x1: lr.right - cr.left, y1: lr.top + lr.height / 2 - cr.top,
        x2: rr.left - cr.left,  y2: rr.top + rr.height / 2 - cr.top,
        color: PAIR_COLORS[origIdx % PAIR_COLORS.length],
      }
    }).filter((l): l is NonNullable<typeof l> => l !== null)
    setLines(prev =>
      prev.length === next.length && prev.every((l, i) => l.x1 === next[i].x1 && l.y1 === next[i].y1 && l.x2 === next[i].x2 && l.y2 === next[i].y2)
        ? prev : next
    )
  })

  const containerRect = containerRef.current?.getBoundingClientRect()

  return (
    <div className="pr-match">
      <div className="pr-question-stem" style={{ marginBottom: 8 }}>
        <span className="pr-q-num">{num}.</span>
        <span className="pr-q-text">{block.heading ? <RichText html={block.heading} /> : <em className="pr-placeholder">Match each term to its definition.</em>}</span>
      </div>
      <div ref={containerRef} className="pr-match-table" style={{ position: 'relative' }}>
        <svg
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
          width={containerRect?.width ?? 0}
          height={containerRect?.height ?? 0}
        >
          {lines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.color} strokeWidth={1.5} />
          ))}
        </svg>
        <div className="pr-match-col">
          {block.items.map((item, origIdx) => (
            <div
              key={item.id}
              ref={el => { leftRefs.current[origIdx] = el }}
              className="pr-match-cell pr-match-cell--left"
              style={{ borderColor: PAIR_COLORS[origIdx % PAIR_COLORS.length], background: PAIR_COLORS[origIdx % PAIR_COLORS.length] + '18' }}
            >
              {item.left ? <RichText html={item.left} /> : <em className="pr-placeholder">Term {origIdx + 1}…</em>}
            </div>
          ))}
        </div>
        <div className="pr-match-gap" />
        <div className="pr-match-col">
          {shuffledRight.map((right, si) => {
            const origIdx = block.items.findIndex(item => item.right === right)
            return (
              <div
                key={si}
                ref={el => { rightRefs.current[si] = el }}
                className="pr-match-cell pr-match-cell--right"
                style={{ borderColor: PAIR_COLORS[origIdx % PAIR_COLORS.length], background: PAIR_COLORS[origIdx % PAIR_COLORS.length] + '18' }}
              >
                {right ? <RichText html={right} /> : <em className="pr-placeholder">Definition {si + 1}…</em>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PreviewOrderStepsMS({ block, num }: { block: OrderStepsBlock; num: number }) {
  const shuffled = seededShuffle(block.steps, block.id)
  return (
    <div className="pr-order-steps">
      <div className="pr-question-stem" style={{ marginBottom: 8 }}>
        <span className="pr-q-num">{num}.</span>
        <span className="pr-q-text">{block.heading ? <RichText html={block.heading} /> : <em className="pr-placeholder">Number these steps in the correct order.</em>}</span>
      </div>
      <div className="pr-order-ms-layout">
        <div className="pr-steps-list">
          {shuffled.map((step, i) => (
            <div key={i} className="pr-step-row">
              <span className="pr-step-num">{block.steps.indexOf(step) + 1}</span>
              {step ? <RichText html={step} /> : <em className="pr-placeholder">Step…</em>}
            </div>
          ))}
        </div>
        <div className="pr-order-ms-divider" />
        <div className="pr-steps-list">
          {block.steps.map((step, i) => (
            <div key={i} className="pr-step-row pr-step-row--correct">
              <span className="pr-step-num">{i + 1}</span>
              {step ? <RichText html={step} /> : <em className="pr-placeholder">Step…</em>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function collectNumericalAnswers(blocks: Block[]): string[] {
  const answers: string[] = []
  for (const b of blocks) {
    if (b.type !== 'question') continue
    if (b.parts.length === 0) {
      if (b.numericalAnswer?.trim()) answers.push(b.numericalAnswer.trim())
    } else {
      for (const p of b.parts) {
        if (p.numericalAnswer?.trim()) answers.push(p.numericalAnswer.trim())
      }
    }
  }
  return answers
}

function PreviewNumericalAnswers({ block, blocks }: { block: NumericalAnswersBlock; blocks: Block[] }) {
  const answers = seededShuffle(collectNumericalAnswers(blocks), block.id)
  return (
    <div className="pr-numerical-answers">
      <div className="pr-numerical-heading">
        {block.heading ? <RichText html={block.heading} /> : 'Numerical answers'}
      </div>
      {answers.length === 0 ? (
        <p className="pr-numerical-empty">No numerical answers set yet. Edit questions and enter a numerical answer to populate this box.</p>
      ) : (
        <div className="pr-numerical-grid">
          {answers.map((ans, i) => (
            <span key={i} className="pr-numerical-item">
              <span className="pr-numerical-circle" />
              {ans}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function PreviewBlock({ block, blocks, mode, showLines }: { block: PageBlock; blocks: Block[]; mode: 'worksheet' | 'markscheme'; showLines?: boolean }) {
  const isContinuation = block._isContinuation ?? false
  const num = NUMBERED_TYPES.has(block.type) ? getQuestionNumber(blocks, block.id) : 0
  if (mode === 'markscheme') {
    switch (block.type) {
      case 'header':          return isContinuation ? null : <PreviewHeaderMS block={block} />
      case 'instructions':    return null
      case 'information':     return null
      case 'worked_example':  return null
      case 'spacer':          return null
      case 'question':        return <PreviewQuestionMS block={block} blocks={blocks} num={num} isContinuation={isContinuation} />
      case 'multiple_choice': return <PreviewMultipleChoiceMS block={block} num={num} />
      case 'cloze':           return <PreviewClozeMS block={block} num={num} />
      case 'match_them_up':   return <PreviewMatchThemUpMS block={block} num={num} />
      case 'order_steps':     return <PreviewOrderStepsMS block={block} num={num} />
      case 'data': {
        const b = block as DataBlock
        // Always show graphs (completed graph is the answer); only show tables if they had hidden cells
        if (b.display === 'table' && (b.hiddenCells ?? []).length === 0) return null
        return <PreviewData block={b} blocks={blocks} markScheme />
      }
      default: break
    }
  }
  switch (block.type) {
    case 'header':          return isContinuation ? null : <PreviewHeader block={block} allBlocks={blocks} />
    case 'instructions':    return isContinuation ? null : <PreviewInstructions block={block} />
    case 'question':        return <PreviewQuestion block={block} blocks={blocks} num={num} showLines={showLines} isContinuation={isContinuation} />
    case 'multiple_choice': return <PreviewMultipleChoice block={block} num={num} blocks={blocks} />
    case 'worked_example':  return <PreviewWorkedExample block={block} blocks={blocks} />
    case 'information':     return <PreviewInformation block={block} blocks={blocks} />
    case 'match_them_up':   return <PreviewMatchThemUp block={block} num={num} blocks={blocks} />
    case 'cloze':           return <PreviewCloze block={block} num={num} blocks={blocks} />
    case 'order_steps':     return <PreviewOrderSteps block={block} num={num} blocks={blocks} />
    case 'figure':             return <PreviewFigure block={block} />
    case 'spacer':             return <PreviewSpacer block={block} />
    case 'data':               return <PreviewData block={block as DataBlock} blocks={blocks} />
    case 'numerical_answers':  return <PreviewNumericalAnswers block={block as NumericalAnswersBlock} blocks={blocks} />
  }
}

interface WorksheetPreviewProps {
  worksheet: Worksheet
  selectedId?: string | null
  onSelect?: (id: string) => void
  onAttach?: (blockId: string, questionId: string) => void
  mode?: 'worksheet' | 'markscheme'
  printRef?: RefObject<HTMLDivElement | null>
  startPage?: number
  onPageCountChange?: (count: number) => void
}

function getAttachedBlockIds(blocks: Block[]): Set<string> {
  const ids = new Set<string>()
  for (const b of blocks) {
    if (b.type === 'question') {
      resolveDataIds(b).forEach(id => ids.add(id))
      if (b.attachedFigureId) ids.add(b.attachedFigureId)
      for (const p of b.parts) {
        resolveDataIds(p).forEach(id => ids.add(id))
        if (p.attachedFigureId) ids.add(p.attachedFigureId)
      }
    } else if (b.type === 'multiple_choice' || b.type === 'information' || b.type === 'worked_example' || b.type === 'cloze' || b.type === 'match_them_up' || b.type === 'order_steps') {
      if (b.attachedFigureId) ids.add(b.attachedFigureId)
    }
  }
  return ids
}

export function WorksheetPreview({ worksheet, selectedId, onSelect, onAttach, mode = 'worksheet', printRef, startPage, onPageCountChange }: WorksheetPreviewProps) {
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({})
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const reportedPageCountRef = useRef<number | null>(null)

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
  const showLines = worksheet.showLines !== false
  const pages = splitIntoPages(renderableBlocks, heightOf, showLines, mode === 'markscheme')

  // Report actual page count once measurements have stabilised
  useEffect(() => {
    if (!onPageCountChange) return
    const hasMeasurements = Object.keys(measuredHeights).length > 0
    if (!hasMeasurements) return
    if (reportedPageCountRef.current !== pages.length) {
      reportedPageCountRef.current = pages.length
      onPageCountChange(pages.length)
    }
  })

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
            <PreviewBlock block={block} blocks={worksheet.blocks} mode={mode} showLines={worksheet.showLines !== false} />
          </div>
        ))}
      </div>

      <div ref={printRef} className="ws-pages">
        {pages.map((pageBlocks, pageIdx) => (
          <div key={pageIdx} className="a4-page">
            {mode === 'markscheme' && (
              <div className="pr-ms-page-banner">
                {pageIdx === 0 ? 'Mark Scheme' : `Mark Scheme — p.${pageIdx + 1}`}
              </div>
            )}
            {startPage !== undefined && (
              <div className="a4-page-number" />
            )}
            {pageBlocks.map(block => {
              const blockKey = block._isContinuation ? `${block.id}-cont-${pageIdx}` : block.id
              const isSelected = block.id === selectedId
              if (onSelect) {
                const isDraggable = onAttach && !block._isContinuation && (block.type === 'figure' || block.type === 'data')
                const isDropZone  = onAttach && draggingId && (block.type === 'question' || block.type === 'multiple_choice')
                return (
                  <div
                    key={blockKey}
                    draggable={isDraggable || undefined}
                    className={[
                      'preview-block-wrap',
                      isSelected ? 'preview-block-wrap--selected' : '',
                      isDraggable ? 'preview-block-wrap--draggable' : '',
                      isDropZone  ? 'preview-block-wrap--drop-zone' : '',
                    ].join(' ').trim()}
                    onClick={() => onSelect(block.id)}
                    title={isDraggable ? 'Drag onto a question to attach' : 'Click to edit'}
                    onDragStart={isDraggable ? e => { e.dataTransfer.setData('text/plain', block.id); setDraggingId(block.id) } : undefined}
                    onDragEnd={isDraggable ? () => setDraggingId(null) : undefined}
                    onDragOver={isDropZone ? e => e.preventDefault() : undefined}
                    onDrop={isDropZone ? e => { e.preventDefault(); onAttach!(draggingId!, block.id); setDraggingId(null) } : undefined}
                  >
                    <PreviewBlock block={block} blocks={worksheet.blocks} mode={mode} showLines={worksheet.showLines !== false} />
                  </div>
                )
              }
              return <PreviewBlock key={blockKey} block={block} blocks={worksheet.blocks} mode={mode} showLines={worksheet.showLines !== false} />
            })}
          </div>
        ))}
      </div>
    </>
  )
}
