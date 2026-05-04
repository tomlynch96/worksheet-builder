import { Document, Page, View, Text, StyleSheet, Font, Svg, Line, G } from '@react-pdf/renderer'
import katexMathItalicUrl from 'katex/dist/fonts/KaTeX_Math-Italic.ttf?url'
import katexMainRegularUrl from 'katex/dist/fonts/KaTeX_Main-Regular.ttf?url'

Font.register({ family: 'KaTeX-Math', src: katexMathItalicUrl })
Font.register({ family: 'KaTeX-Main', src: katexMainRegularUrl })

// DejaVu Sans: comprehensive Unicode coverage (Greek, arrows, math operators, etc.)
Font.register({
  family: 'UniSans',
  fonts: [
    { src: '/fonts/DejaVuSans.ttf' },
    { src: '/fonts/LiberationSans-Italic.ttf', fontStyle: 'italic' },
    { src: '/fonts/DejaVuSans-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/LiberationSans-BoldItalic.ttf', fontWeight: 'bold', fontStyle: 'italic' },
  ],
})
import type { Worksheet, Block, HeaderBlock, InstructionsBlock, QuestionBlock, WorkedExampleBlock, FigureBlock, SpacerBlock, InformationBlock, MatchThemUpBlock, ClozeBlock, OrderStepsBlock, MultipleChoiceBlock, DataBlock } from '../../types/worksheet'
import { seededShuffle, clozeToDisplayParts, extractClozeWords } from '../../utils/shuffle'
import { htmlToPdf } from '../../utils/htmlToPdf'
import { computeGraphLayout, toSvgCoords } from '../../utils/graphLayout'

// ── Styles ────────────────────────────────────────────────
// react-pdf uses pt units. A4 page: 595 × 842 pt. Margin: 51pt (~18mm).

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.45,
    color: '#000',
    paddingTop: 51,
    paddingBottom: 51,
    paddingLeft: 51,
    paddingRight: 51,
  },

  // Header
  headerBadges: { flexDirection: 'row', gap: 5, marginBottom: 6 },
  badge: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', padding: '2 6', borderRadius: 2 },
  badgeBoard: { backgroundColor: '#1e3a5f', color: '#fff' },
  badgeTier: { backgroundColor: '#e5e7eb', color: '#374151' },
  headerTitle: { fontFamily: 'Helvetica-Bold', fontSize: 18, marginBottom: 2, lineHeight: 1.2 },
  headerTopic: { fontSize: 9.5, color: '#374151', marginBottom: 10 },
  studentFields: { flexDirection: 'row', gap: 20, marginBottom: 10, flexWrap: 'wrap' },
  fieldLine: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, fontSize: 9.5 },
  fieldUnderline: { borderBottomWidth: 1, borderBottomColor: '#000', width: 120 },
  fieldUnderlineShort: { width: 65 },
  headerRule: { borderTopWidth: 2, borderTopColor: '#000', marginTop: 4, marginBottom: 16 },

  // Instructions
  instructions: { borderWidth: 1, borderColor: '#d1d5db', padding: '7 10', borderRadius: 3, backgroundColor: '#f9fafb', marginBottom: 14 },
  instructionItem: { fontSize: 9.5, marginBottom: 2 },

  // Questions
  question: { marginBottom: 18 },
  questionStem: { flexDirection: 'row', gap: 5, marginBottom: 5 },
  qNum: { fontFamily: 'Helvetica-Bold', width: 18, flexShrink: 0 },
  qText: { flex: 1 },
  marks: { fontSize: 9, color: '#374151', flexShrink: 0, marginLeft: 6 },
  answerLines: { marginLeft: 23 },
  answerLine: { borderBottomWidth: 1, borderBottomColor: '#9ca3af', height: 22, marginBottom: 0 },

  // Sub-parts
  parts: { marginLeft: 23 },
  part: { marginBottom: 8 },
  partStem: { flexDirection: 'row', gap: 5, marginBottom: 4 },
  partLabel: { fontFamily: 'Helvetica-Bold', width: 20, flexShrink: 0 },

  // Multiple choice
  mcOptions: { marginLeft: 23, marginTop: 3 },
  mcOption: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  mcLabel: { fontFamily: 'Helvetica-Bold', width: 16, flexShrink: 0 },

  // Worked example
  workedExample: { borderWidth: 2, borderColor: '#1e3a5f', borderRadius: 3, padding: '8 12', marginBottom: 16, backgroundColor: '#f8faff' },
  workedTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#1e3a5f', marginBottom: 6, textTransform: 'uppercase' },
  workedStep: { fontSize: 10, marginBottom: 4, marginLeft: 10, flexDirection: 'row' },

  // Information
  information: { borderLeftWidth: 4, borderLeftColor: '#b45309', backgroundColor: '#fffbeb', padding: '7 10', marginBottom: 16 },
  infoHeading: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#b45309', marginBottom: 4, textTransform: 'uppercase' },
  infoContent: { fontSize: 10.5, lineHeight: 1.5 },

  // Activity heading
  activityHeading: { fontSize: 10, fontStyle: 'italic', marginBottom: 7 },

  // Match them up
  match: { marginBottom: 16 },
  matchTable: { flexDirection: 'row' },
  matchCol: { flex: 1 },
  matchCell: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 2, padding: '4 8', fontSize: 10, minHeight: 26, justifyContent: 'center', marginBottom: 5 },
  matchCellLeft: { backgroundColor: '#f8faff' },
  matchLines: { width: 44, alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8 },
  matchDotRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 5, height: 26, alignItems: 'center' },
  matchDot: { width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: '#374151', backgroundColor: '#fff' },

  // Cloze
  cloze: { marginBottom: 16 },
  wordBank: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, borderWidth: 1, borderColor: '#d1d5db', padding: '7 9', borderRadius: 3, backgroundColor: '#f9fafb', marginBottom: 9 },
  wordBankWord: { fontSize: 10, borderWidth: 1, borderColor: '#9ca3af', padding: '1 7', borderRadius: 2, backgroundColor: '#fff' },
  clozeText: { fontSize: 10.5, lineHeight: 1.9 },
  clozeBlank: { fontSize: 10.5, color: '#000', letterSpacing: 1.5 },

  // Order steps
  orderSteps: { marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 6, fontSize: 10.5 },
  stepBox: { width: 20, height: 20, borderWidth: 1.5, borderColor: '#374151', borderRadius: 2, flexShrink: 0 },

  // Figure
  figure: { borderWidth: 1.5, borderColor: '#9ca3af', borderStyle: 'dashed', borderRadius: 3, justifyContent: 'flex-end', alignItems: 'center', padding: 8, marginBottom: 16, backgroundColor: '#f9fafb' },
  figureLabel: { fontSize: 9, color: '#6b7280', fontStyle: 'italic' },
})

// ── Helper ────────────────────────────────────────────────
const NUMBERED_TYPES = new Set(['question', 'multiple_choice', 'match_them_up', 'cloze', 'order_steps'])

function getQuestionNumber(blocks: Block[], id: string): number {
  let n = 0
  for (const b of blocks) {
    if (NUMBERED_TYPES.has(b.type)) n++
    if (b.id === id) return n
  }
  return n
}

function AnswerLinesPDF({ count }: { count: number }) {
  return (
    <View style={s.answerLines}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={s.answerLine} />
      ))}
    </View>
  )
}

// ── Block renderers ───────────────────────────────────────

function PDFHeader({ block }: { block: HeaderBlock }) {
  return (
    <View>
      <View style={s.headerBadges}>
        <Text style={[s.badge, s.badgeBoard]}>{block.examBoard}</Text>
        {block.tier !== 'both' && (
          <Text style={[s.badge, s.badgeTier]}>{block.tier === 'higher' ? 'Higher Tier' : 'Foundation Tier'}</Text>
        )}
      </View>
      <Text style={s.headerTitle}>{block.title || 'Worksheet Title'}</Text>
      {block.topic ? <Text style={s.headerTopic}>{block.topic}</Text> : null}
      {(block.showName || block.showDate || block.showClass) && (
        <View style={s.studentFields}>
          {block.showName  && <View style={s.fieldLine}><Text>Name:</Text><View style={s.fieldUnderline} /></View>}
          {block.showDate  && <View style={s.fieldLine}><Text>Date:</Text><View style={[s.fieldUnderline, s.fieldUnderlineShort]} /></View>}
          {block.showClass && <View style={s.fieldLine}><Text>Class:</Text><View style={[s.fieldUnderline, s.fieldUnderlineShort]} /></View>}
        </View>
      )}
      <View style={s.headerRule} />
    </View>
  )
}

function PDFInstructions({ block }: { block: InstructionsBlock }) {
  if (block.items.length === 0) return null
  return (
    <View style={s.instructions}>
      {block.items.map((item, i) => (
        <Text key={i} style={s.instructionItem}>• {item}</Text>
      ))}
    </View>
  )
}

function PDFQuestion({ block, num }: { block: QuestionBlock; num: number }) {
  const hasParts = block.parts.length > 0
  return (
    <View style={s.question}>
      <View style={s.questionStem}>
        <Text style={s.qNum}>{num}.</Text>
        {htmlToPdf(block.stem, s.qText)}
        {!hasParts && block.marks > 0 && (
          <Text style={s.marks}>[{block.marks} mark{block.marks !== 1 ? 's' : ''}]</Text>
        )}
      </View>
      {!hasParts && <AnswerLinesPDF count={block.lines} />}
      {hasParts && (
        <View style={s.parts}>
          {block.parts.map(part => (
            <View key={part.id} style={s.part}>
              <View style={s.partStem}>
                <Text style={s.partLabel}>({part.label})</Text>
                {htmlToPdf(part.stem, s.qText)}
                {part.marks > 0 && (
                  <Text style={s.marks}>[{part.marks} mark{part.marks !== 1 ? 's' : ''}]</Text>
                )}
              </View>
              <AnswerLinesPDF count={part.lines} />
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

function PDFMultipleChoice({ block, num }: { block: MultipleChoiceBlock; num: number }) {
  const LABELS = ['A', 'B', 'C', 'D', 'E', 'F']
  return (
    <View style={s.question}>
      <View style={s.questionStem}>
        <Text style={s.qNum}>{num}.</Text>
        {htmlToPdf(block.stem, s.qText)}
        {block.marks > 0 && (
          <Text style={s.marks}>[{block.marks} mark{block.marks !== 1 ? 's' : ''}]</Text>
        )}
      </View>
      <View style={s.mcOptions}>
        {block.options.map((opt, i) => (
          <View key={i} style={s.mcOption}>
            <Text style={s.mcLabel}>{LABELS[i] ?? String(i + 1)}</Text>
            {htmlToPdf(opt, {})}
          </View>
        ))}
      </View>
    </View>
  )
}

function PDFWorkedExample({ block }: { block: WorkedExampleBlock }) {
  return (
    <View style={s.workedExample}>
      <Text style={s.workedTitle}>{block.title || 'Worked example'}</Text>
      {block.steps.map((step, i) => (
        <View key={i} style={s.workedStep}>
          <Text>{i + 1}. </Text>
          {htmlToPdf(step, {})}
        </View>
      ))}
    </View>
  )
}

function PDFInformation({ block }: { block: InformationBlock }) {
  return (
    <View style={s.information}>
      {block.heading ? <Text style={s.infoHeading}>{block.heading}</Text> : null}
      {htmlToPdf(block.content, s.infoContent)}
    </View>
  )
}

function PDFMatchThemUp({ block, num }: { block: MatchThemUpBlock; num: number }) {
  const shuffledRight = seededShuffle(block.items.map(i => i.right), block.id)
  return (
    <View style={s.match}>
      <View style={s.questionStem}>
        <Text style={s.qNum}>{num}.</Text>
        <Text style={s.qText}>{block.heading || 'Match each term to its definition.'}</Text>
      </View>
      <View style={s.matchTable}>
        <View style={s.matchCol}>
          {block.items.map((item) => (
            <View key={item.id} style={[s.matchCell, s.matchCellLeft]}>
              {htmlToPdf(item.left, { fontSize: 10 })}
            </View>
          ))}
        </View>
        <View style={{ width: 14 }} />
        <View style={s.matchCol}>
          {shuffledRight.map((right, i) => (
            <View key={i} style={s.matchCell}>
              {htmlToPdf(right, { fontSize: 10 })}
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

function PDFCloze({ block, num }: { block: ClozeBlock; num: number }) {
  const parts = clozeToDisplayParts(block.text)
  const words = seededShuffle(extractClozeWords(block.text), block.id)
  return (
    <View style={s.cloze}>
      <View style={s.questionStem}>
        <Text style={s.qNum}>{num}.</Text>
        <Text style={s.qText}>{block.heading || 'Fill in the blanks.'}</Text>
      </View>
      {block.showWordBank && words.length > 0 && (
        <View style={s.wordBank}>
          {words.map((w, i) => <Text key={i} style={s.wordBankWord}>{w}</Text>)}
        </View>
      )}
      <Text style={s.clozeText}>
        {parts.map((part, i) =>
          part.type === 'blank'
            ? <Text key={i} style={s.clozeBlank}>{'_'.repeat(Math.max(part.value.length + 4, 8))}</Text>
            : <Text key={i}>{part.value}</Text>
        )}
      </Text>
    </View>
  )
}

function PDFOrderSteps({ block, num }: { block: OrderStepsBlock; num: number }) {
  const shuffled = seededShuffle(block.steps, block.id)
  return (
    <View style={s.orderSteps}>
      <View style={s.questionStem}>
        <Text style={s.qNum}>{num}.</Text>
        <Text style={s.qText}>{block.heading || 'Number these steps in the correct order.'}</Text>
      </View>
      {shuffled.map((step, i) => (
        <View key={i} style={s.stepRow}>
          <View style={s.stepBox} />
          <Text>{step}</Text>
        </View>
      ))}
    </View>
  )
}

function PDFFigure({ block }: { block: FigureBlock }) {
  const heights: Record<FigureBlock['size'], number> = { small: 70, medium: 120, large: 180 }
  return (
    <View style={[s.figure, { height: heights[block.size] }]}>
      <Text style={s.figureLabel}>{block.caption || 'Figure'}</Text>
    </View>
  )
}

function PDFSpacer({ block }: { block: SpacerBlock }) {
  const heights: Record<SpacerBlock['size'], number> = { small: 12, medium: 24, large: 42 }
  return <View style={{ height: heights[block.size] }} />
}

// ── Data block ────────────────────────────────────────────

function PDFDataTable({ block }: { block: DataBlock }) {
  const { columns, rows, heading } = block
  const colW = Math.floor(493 / columns.length)
  return (
    <View style={{ marginBottom: 14 }}>
      {heading ? <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>{heading}</Text> : null}
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#d1d5db' }}>
        {columns.map((col, c) => (
          <View key={c} style={{ width: colW, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#d1d5db', padding: '4 6', backgroundColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', textAlign: 'center' }}>
              {col.label}{col.unit ? ` (${col.unit})` : ''}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', borderLeftWidth: 1, borderColor: '#d1d5db' }}>
          {row.map((cell, c) => (
            <View key={c} style={{ width: colW, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#d1d5db', padding: '4 6' }}>
              <Text style={{ fontSize: 9, textAlign: 'center' }}>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

const PDF_W = 440, PDF_H = 260
const PDF_ML = 44, PDF_MR = 12, PDF_MT = 12, PDF_MB = 38
const PDF_PW = PDF_W - PDF_ML - PDF_MR
const PDF_PH = PDF_H - PDF_MT - PDF_MB

function PDFDataGraph({ block }: { block: DataBlock }) {
  const { columns, graph, heading } = block
  const layout = computeGraphLayout(block.rows, graph.xCol, graph.yCol, graph.omitRows)
  const { xTicks, yTicks, points, bestFitLine, xMin, xMax, yMin, yMax } = layout
  const xCol = columns[graph.xCol]
  const yCol = columns[graph.yCol]

  function px(x: number, y: number) {
    const p = toSvgCoords({ x, y }, layout, PDF_PW, PDF_PH)
    return { x: p.cx + PDF_ML, y: p.cy + PDF_MT }
  }

  const xStep = xTicks.length > 1 ? xTicks[1].value - xTicks[0].value : (xMax - xMin || 1)
  const yStep = yTicks.length > 1 ? yTicks[1].value - yTicks[0].value : (yMax - yMin || 1)
  const xMinStep = xStep / 5, yMinStep = yStep / 5

  const xMinor: number[] = [], yMinor: number[] = []
  for (let v = xMin; v <= xMax + xMinStep * 0.01; v += xMinStep) {
    const r = Math.round(v * 1e9) / 1e9
    if (!xTicks.some(t => Math.abs(t.value - r) < xMinStep * 0.01)) xMinor.push(r)
  }
  for (let v = yMin; v <= yMax + yMinStep * 0.01; v += yMinStep) {
    const r = Math.round(v * 1e9) / 1e9
    if (!yTicks.some(t => Math.abs(t.value - r) < yMinStep * 0.01)) yMinor.push(r)
  }

  return (
    <View style={{ marginBottom: 14 }}>
      {heading ? <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>{heading}</Text> : null}
      <Svg width={PDF_W} height={PDF_H}>
        {xMinor.map((v, i) => { const p = px(v, yMin); return <Line key={`xm${i}`} x1={String(p.x)} y1={String(PDF_MT)} x2={String(p.x)} y2={String(PDF_MT + PDF_PH)} stroke="#e5e7eb" strokeWidth="0.5" /> })}
        {yMinor.map((v, i) => { const p = px(xMin, v); return <Line key={`ym${i}`} x1={String(PDF_ML)} y1={String(p.y)} x2={String(PDF_ML + PDF_PW)} y2={String(p.y)} stroke="#e5e7eb" strokeWidth="0.5" /> })}
        {xTicks.map((t, i) => { const p = px(t.value, yMin); return <Line key={`xM${i}`} x1={String(p.x)} y1={String(PDF_MT)} x2={String(p.x)} y2={String(PDF_MT + PDF_PH)} stroke="#d1d5db" strokeWidth="0.8" /> })}
        {yTicks.map((t, i) => { const p = px(xMin, t.value); return <Line key={`yM${i}`} x1={String(PDF_ML)} y1={String(p.y)} x2={String(PDF_ML + PDF_PW)} y2={String(p.y)} stroke="#d1d5db" strokeWidth="0.8" /> })}
        <Line x1={String(PDF_ML)} y1={String(PDF_MT)} x2={String(PDF_ML)} y2={String(PDF_MT + PDF_PH)} stroke="#374151" strokeWidth="1.5" />
        <Line x1={String(PDF_ML)} y1={String(PDF_MT + PDF_PH)} x2={String(PDF_ML + PDF_PW)} y2={String(PDF_MT + PDF_PH)} stroke="#374151" strokeWidth="1.5" />
        {graph.showXScale && xTicks.map((t, i) => { const p = px(t.value, yMin); return <Text key={`xs${i}`} x={String(p.x)} y={String(PDF_MT + PDF_PH + 11)} style={{ fontSize: 7, textAnchor: 'middle' }}>{t.label}</Text> })}
        {graph.showYScale && yTicks.map((t, i) => { const p = px(xMin, t.value); return <Text key={`ys${i}`} x={String(PDF_ML - 3)} y={String(p.y + 2.5)} style={{ fontSize: 7, textAnchor: 'end' }}>{t.label}</Text> })}
        {graph.showXLabel && <Text x={String(PDF_ML + PDF_PW / 2)} y={String(PDF_H - 2)} style={{ fontSize: 8, fontWeight: 'bold', textAnchor: 'middle' }}>{xCol.label}{xCol.unit ? ` (${xCol.unit})` : ''}</Text>}
        {graph.showYLabel && <Text x="8" y={String(PDF_MT + PDF_PH / 2)} style={{ fontSize: 8, fontWeight: 'bold', textAnchor: 'middle' }} transform={`rotate(-90, 8, ${PDF_MT + PDF_PH / 2})`}>{yCol.label}{yCol.unit ? ` (${yCol.unit})` : ''}</Text>}
        {graph.showBestFit && bestFitLine && (() => { const p1 = px(bestFitLine.x1, bestFitLine.y1); const p2 = px(bestFitLine.x2, bestFitLine.y2); return <Line x1={String(p1.x)} y1={String(p1.y)} x2={String(p2.x)} y2={String(p2.y)} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 3" /> })()}
        {points.map((pt, i) => { const p = px(pt.x, pt.y); const d = 3.5; return <G key={i}><Line x1={String(p.x - d)} y1={String(p.y - d)} x2={String(p.x + d)} y2={String(p.y + d)} stroke="#1e3a5f" strokeWidth="1.5" /><Line x1={String(p.x + d)} y1={String(p.y - d)} x2={String(p.x - d)} y2={String(p.y + d)} stroke="#1e3a5f" strokeWidth="1.5" /></G> })}
      </Svg>
    </View>
  )
}

function PDFData({ block }: { block: DataBlock }) {
  return block.display === 'graph' ? <PDFDataGraph block={block} /> : <PDFDataTable block={block} />
}

function PDFBlock({ block, blocks }: { block: Block; blocks: Block[] }) {
  const num = NUMBERED_TYPES.has(block.type) ? getQuestionNumber(blocks, block.id) : 0
  switch (block.type) {
    case 'header':          return <PDFHeader block={block} />
    case 'instructions':    return <PDFInstructions block={block} />
    case 'question':        return <PDFQuestion block={block} num={num} />
    case 'multiple_choice': return <PDFMultipleChoice block={block} num={num} />
    case 'worked_example':  return <PDFWorkedExample block={block} />
    case 'information':     return <PDFInformation block={block} />
    case 'match_them_up':   return <PDFMatchThemUp block={block} num={num} />
    case 'cloze':           return <PDFCloze block={block} num={num} />
    case 'order_steps':     return <PDFOrderSteps block={block} num={num} />
    case 'figure':          return <PDFFigure block={block} />
    case 'spacer':          return <PDFSpacer block={block} />
    case 'data':            return <PDFData block={block as DataBlock} />
  }
}

export function WorksheetPDF({ worksheet }: { worksheet: Worksheet }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {worksheet.blocks.map(block => (
          <View key={block.id} wrap={false}>
            <PDFBlock block={block} blocks={worksheet.blocks} />
          </View>
        ))}
      </Page>
    </Document>
  )
}
