import katex from 'katex'
import 'katex/contrib/mhchem'
import type { Worksheet, Block, HeaderBlock, InstructionsBlock, QuestionBlock, WorkedExampleBlock, FigureBlock, SpacerBlock, InformationBlock, MatchThemUpBlock, ClozeBlock, OrderStepsBlock, MultipleChoiceBlock, DataBlock } from '../../types/worksheet'
import { seededShuffle, clozeToDisplayParts, extractClozeWords } from '../../utils/shuffle'
import { splitIntoPages } from '../../utils/pagination'
import { computeGraphLayout, toSvgCoords } from '../../utils/graphLayout'
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

function PreviewQuestion({ block, num }: { block: QuestionBlock; num: number }) {
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
      <ol className="pr-worked-steps">
        {block.steps.map((step, i) => (
          <li key={i}>{step ? <RichText html={step} /> : <em className="pr-placeholder">Step…</em>}</li>
        ))}
      </ol>
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
      <span className="pr-figure-label">Figure: {block.caption || <em className="pr-placeholder">Add a caption…</em>}</span>
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
  const xMajorStep = xTicks.length > 1 ? xTicks[1].value - xTicks[0].value : (xMax - xMin)
  const yMajorStep = yTicks.length > 1 ? yTicks[1].value - yTicks[0].value : (yMax - yMin)
  const xMinorStep = xMajorStep / 5
  const yMinorStep = yMajorStep / 5

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
        {/* Best fit line */}
        {graph.showBestFit && bestFitLine && (() => {
          const p1 = toS(bestFitLine.x1, bestFitLine.y1)
          const p2 = toS(bestFitLine.x2, bestFitLine.y2)
          return <line x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 3" />
        })()}
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

function PreviewData({ block }: { block: DataBlock }) {
  return block.display === 'graph'
    ? <PreviewDataGraph block={block} />
    : <PreviewDataTable block={block} />
}

function PreviewBlock({ block, blocks }: { block: Block; blocks: Block[] }) {
  const num = NUMBERED_TYPES.has(block.type) ? getQuestionNumber(blocks, block.id) : 0
  switch (block.type) {
    case 'header':          return <PreviewHeader block={block} />
    case 'instructions':    return <PreviewInstructions block={block} />
    case 'question':        return <PreviewQuestion block={block} num={num} />
    case 'multiple_choice': return <PreviewMultipleChoice block={block} num={num} />
    case 'worked_example':  return <PreviewWorkedExample block={block} />
    case 'information':     return <PreviewInformation block={block} />
    case 'match_them_up':   return <PreviewMatchThemUp block={block} num={num} />
    case 'cloze':           return <PreviewCloze block={block} num={num} />
    case 'order_steps':     return <PreviewOrderSteps block={block} num={num} />
    case 'figure':          return <PreviewFigure block={block} />
    case 'spacer':          return <PreviewSpacer block={block} />
    case 'data':            return <PreviewData block={block as DataBlock} />
  }
}

interface WorksheetPreviewProps {
  worksheet: Worksheet
  selectedId?: string | null
  onSelect?: (id: string) => void
}

export function WorksheetPreview({ worksheet, selectedId, onSelect }: WorksheetPreviewProps) {
  const pages = splitIntoPages(worksheet.blocks)
  return (
    <>
      {pages.map((pageBlocks, pageIdx) => (
        <div key={pageIdx} className="a4-page">
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
                  <PreviewBlock block={block} blocks={worksheet.blocks} />
                </div>
              )
            }
            return <PreviewBlock key={block.id} block={block} blocks={worksheet.blocks} />
          })}
        </div>
      ))}
    </>
  )
}
