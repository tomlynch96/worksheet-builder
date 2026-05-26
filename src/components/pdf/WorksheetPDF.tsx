import { Document, Page, View, Text, Image, StyleSheet, Font, Svg, Line, G, Path, Rect } from '@react-pdf/renderer'
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
import type { Worksheet, Block, HeaderBlock, InstructionsBlock, QuestionBlock, WorkedExampleBlock, FigureBlock, SpacerBlock, InformationBlock, MatchThemUpBlock, ClozeBlock, OrderStepsBlock, MultipleChoiceBlock, DataBlock, NumericalAnswersBlock } from '../../types/worksheet'
import { seededShuffle, clozeToDisplayParts, extractClozeWords } from '../../utils/shuffle'
import { htmlToPdf } from '../../utils/htmlToPdf'
import { computeGraphLayout, toSvgCoords, catmullRomPath, computeBarLayout } from '../../utils/graphLayout'

// ── Styles ────────────────────────────────────────────────
// react-pdf uses pt. A4: 595×842pt, margins 51pt (~18mm).
// All non-fontSize dimension values are set at 0.75× the preview's px values
// so that 1pt × (96/72) = 1px equivalent — making PDF render identical to the
// browser preview.

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
  badge: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', padding: '2 5', borderRadius: 2 },
  badgeBoard: { backgroundColor: '#1e3a5f', color: '#fff' },
  badgeTier: { backgroundColor: '#e5e7eb', color: '#374151' },
  headerTitle: { fontFamily: 'Helvetica-Bold', fontSize: 18, marginBottom: 2, lineHeight: 1.2 },
  headerTopic: { fontSize: 9.5, color: '#374151', marginBottom: 9 },
  studentFields: { flexDirection: 'row', gap: 18, marginBottom: 9, flexWrap: 'wrap' },
  fieldLine: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, fontSize: 9.5 },
  fieldUnderline: { borderBottomWidth: 1, borderBottomColor: '#000', width: 120 },
  fieldUnderlineShort: { width: 60 },
  headerRule: { borderTopWidth: 2, borderTopColor: '#000', marginTop: 3, marginBottom: 14 },

  // Instructions
  instructions: { borderWidth: 1, borderColor: '#d1d5db', padding: '6 9', borderRadius: 3, backgroundColor: '#f9fafb', marginBottom: 12 },
  instructionItem: { fontSize: 9.5, marginBottom: 2 },

  // Questions
  question: { marginBottom: 15 },
  questionStem: { flexDirection: 'row', gap: 5, marginBottom: 5 },
  qNum: { fontFamily: 'Helvetica-Bold', width: 15, flexShrink: 0 },
  qText: { flex: 1 },
  marks: { fontSize: 9, color: '#374151', flexShrink: 0, marginLeft: 6 },
  answerLines: { marginLeft: 20 },
  answerLine: { borderBottomWidth: 1, borderBottomColor: '#9ca3af', height: 21, marginBottom: 0 },

  // Sub-parts
  parts: { marginLeft: 20 },
  part: { marginBottom: 8 },
  partStem: { flexDirection: 'row', gap: 5, marginBottom: 5 },
  partLabel: { fontFamily: 'Helvetica-Bold', width: 17, flexShrink: 0 },

  // Multiple choice
  mcOptions: { marginLeft: 20, marginTop: 3 },
  mcOption: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  mcLabel: { fontFamily: 'Helvetica-Bold', width: 14, flexShrink: 0 },

  // Worked example
  workedExample: { borderWidth: 2, borderColor: '#1e3a5f', borderRadius: 3, padding: '8 11', marginBottom: 14, backgroundColor: '#f8faff' },
  workedTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#1e3a5f', marginBottom: 6, textTransform: 'uppercase' },
  workedStep: { fontSize: 10, marginBottom: 3, marginLeft: 8, flexDirection: 'row' },

  // Information
  information: { borderLeftWidth: 4, borderLeftColor: '#b45309', backgroundColor: '#fffbeb', padding: '6 9', marginBottom: 14 },
  infoHeading: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#b45309', marginBottom: 3, textTransform: 'uppercase' },
  infoContent: { fontSize: 10.5, lineHeight: 1.5 },

  // Activity heading
  activityHeading: { fontSize: 10, fontStyle: 'italic', marginBottom: 6 },

  // Match them up
  match: { marginBottom: 14 },
  matchTable: { flexDirection: 'row' },
  matchCol: { flex: 1 },
  matchCell: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 2, padding: '4 7', fontSize: 10, minHeight: 23, justifyContent: 'center', marginBottom: 5 },
  matchCellLeft: { backgroundColor: '#f8faff' },
  matchLines: { width: 33, alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6 },
  matchDotRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 5, height: 20, alignItems: 'center' },
  matchDot: { width: 5, height: 5, borderRadius: 3, borderWidth: 1.5, borderColor: '#374151', backgroundColor: '#fff' },

  // Cloze
  cloze: { marginBottom: 14 },
  wordBank: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, borderWidth: 1, borderColor: '#d1d5db', padding: '6 8', borderRadius: 3, backgroundColor: '#f9fafb', marginBottom: 8 },
  wordBankWord: { fontSize: 10, borderWidth: 1, borderColor: '#9ca3af', padding: '2 6', borderRadius: 2, backgroundColor: '#fff' },
  clozeText: { fontSize: 10.5, lineHeight: 1.9 },
  clozeBlank: { fontSize: 10.5, color: '#000', letterSpacing: 1.5 },

  // Order steps
  orderSteps: { marginBottom: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5, fontSize: 10.5 },
  stepBox: { width: 17, height: 17, borderWidth: 1.5, borderColor: '#374151', borderRadius: 2, flexShrink: 0 },

  // Figure
  figure: { justifyContent: 'flex-end', alignItems: 'center', padding: 6, marginBottom: 14 },
  figureLabel: { fontSize: 9, color: '#6b7280', fontStyle: 'italic' },

  // Mark scheme
  msTitle: { fontFamily: 'Helvetica-Bold', fontSize: 15, color: '#1e3a5f', marginBottom: 4 },
  msSubtitle: { fontSize: 10, color: '#374151', marginBottom: 3 },
  msTitleRule: { borderTopWidth: 2, borderTopColor: '#1e3a5f', marginBottom: 18 },
  msQuestion: { marginBottom: 14 },
  msQuestionStem: { flexDirection: 'row', gap: 5, marginBottom: 4 },
  msAnswer: { marginLeft: 20, borderLeftWidth: 3, borderLeftColor: '#16a34a', backgroundColor: '#f0fdf4', padding: '5 8', borderRadius: 2, marginTop: 4 },
  msAnswerText: { fontSize: 10.5, color: '#14532d' },
  msNoAnswer: { fontSize: 10, color: '#9ca3af', fontStyle: 'italic' },
  msCorrectOption: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#f0fdf4', padding: '3 6', borderRadius: 2, marginLeft: 20, marginTop: 4 },
  msCorrectLabel: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#15803d', width: 14 },
  msCorrectTick: { fontSize: 10, color: '#16a34a', fontFamily: 'Helvetica-Bold' },
  msMatchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  msMatchLeft: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', padding: '4 7', borderRadius: 2, backgroundColor: '#f8faff', fontSize: 10 },
  msMatchArrow: { fontSize: 10, color: '#16a34a', fontFamily: 'Helvetica-Bold' },
  msMatchRight: { flex: 1, borderWidth: 1, borderColor: '#86efac', padding: '4 7', borderRadius: 2, backgroundColor: '#f0fdf4', fontSize: 10 },
  msStepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  msStepNum: { width: 17, height: 17, backgroundColor: '#16a34a', color: '#fff', fontSize: 9, fontFamily: 'Helvetica-Bold', borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  msClozeText: { fontSize: 10.5, lineHeight: 1.9, marginLeft: 20, marginTop: 4 },
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

function PDFQuestion({ block, blocks, num, showLines }: { block: QuestionBlock; blocks: Block[]; num: number; showLines: boolean }) {
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
      {block.attachedDataId && <PDFInlineData dataId={block.attachedDataId} blocks={blocks} />}
      {block.attachedFigureId && <PDFInlineFigure figureId={block.attachedFigureId} blocks={blocks} />}
      {!hasParts && showLines && <AnswerLinesPDF count={block.lines} />}
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
              {part.attachedDataId && <PDFInlineData dataId={part.attachedDataId} blocks={blocks} />}
              {part.attachedFigureId && <PDFInlineFigure figureId={part.attachedFigureId} blocks={blocks} />}
              {showLines && <AnswerLinesPDF count={part.lines} />}
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
          {htmlToPdf(step, {})}
        </View>
      ))}
    </View>
  )
}

function PDFInformation({ block }: { block: InformationBlock }) {
  return (
    <View style={s.information}>
      {block.heading ? htmlToPdf(block.heading, s.infoHeading) : null}
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
        {block.heading ? htmlToPdf(block.heading, s.qText) : <Text style={s.qText}>Match each term to its definition.</Text>}
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
        {block.heading ? htmlToPdf(block.heading, s.qText) : <Text style={s.qText}>Fill in the blanks.</Text>}
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
        {block.heading ? htmlToPdf(block.heading, s.qText) : <Text style={s.qText}>Number these steps in the correct order.</Text>}
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
  const heights: Record<FigureBlock['size'], number> = { small: 60, medium: 105, large: 150 }
  return (
    <View style={[s.figure, { height: heights[block.size] }]}>
      {block.imageData && (
        <Image
          src={block.imageData}
          style={{ flex: 1, objectFit: 'contain', marginBottom: block.caption ? 4 : 0 }}
        />
      )}
      {block.caption ? <Text style={s.figureLabel}>{block.caption}</Text> : null}
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
  const hiddenCells = new Set(block.hiddenCells ?? [])
  const colW = Math.floor(493 / columns.length)
  return (
    <View style={{ marginBottom: 9 }}>
      {heading ? <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginBottom: 5, lineHeight: 1.0 }}>{heading}</Text> : null}
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#d1d5db' }}>
        {columns.map((col, c) => (
          <View key={c} style={{ width: colW, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#d1d5db', padding: '3 5', backgroundColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center', lineHeight: 1.2 }}>
              {col.label}{col.unit ? ` (${col.unit})` : ''}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', borderLeftWidth: 1, borderColor: '#d1d5db' }}>
          {row.map((cell, c) => (
            <View key={c} style={{ width: colW, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#d1d5db', padding: '3 5' }}>
              <Text style={{ fontSize: 8.5, textAlign: 'center', lineHeight: 1.2 }}>{hiddenCells.has(`${r},${c}`) ? '' : cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

const PDF_W = 330, PDF_H = 225
const PDF_ML = 36, PDF_MR = 12, PDF_MT = 12, PDF_MB = 33
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

  const xStep = xTicks.length > 1 ? xTicks[1].value - xTicks[0].value : Math.max(xMax - xMin, 1)
  const yStep = yTicks.length > 1 ? yTicks[1].value - yTicks[0].value : Math.max(yMax - yMin, 1)
  const xMinStep = Math.max(xStep / 5, 1e-10)
  const yMinStep = Math.max(yStep / 5, 1e-10)

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
    <View style={{ marginBottom: 9, alignItems: 'center' }}>
      {heading ? <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginBottom: 5, lineHeight: 1.0, alignSelf: 'flex-start' }}>{heading}</Text> : null}
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
        {graph.fitType === 'linear' && graph.showFitLine !== false && bestFitLine && (() => { const p1 = px(bestFitLine.x1, bestFitLine.y1); const p2 = px(bestFitLine.x2, bestFitLine.y2); return <Line x1={String(p1.x)} y1={String(p1.y)} x2={String(p2.x)} y2={String(p2.y)} stroke="#dc2626" strokeWidth="1.5" /> })()}
        {graph.fitType === 'curve' && graph.showFitLine !== false && <Path d={catmullRomPath(points, layout, PDF_PW, PDF_PH, PDF_ML, PDF_MT)} stroke="#dc2626" strokeWidth="1.5" fill="none" />}
        {points.map((pt, i) => { const p = px(pt.x, pt.y); const d = 3.5; return <G key={i}><Line x1={String(p.x - d)} y1={String(p.y - d)} x2={String(p.x + d)} y2={String(p.y + d)} stroke="#1e3a5f" strokeWidth="1.5" /><Line x1={String(p.x + d)} y1={String(p.y - d)} x2={String(p.x - d)} y2={String(p.y + d)} stroke="#1e3a5f" strokeWidth="1.5" /></G> })}
      </Svg>
    </View>
  )
}

const PDF_BAR_W = 330, PDF_BAR_H = 210
const PDF_BAR_ML = 36, PDF_BAR_MR = 12, PDF_BAR_MT = 12, PDF_BAR_MB = 36
const PDF_BAR_PW = PDF_BAR_W - PDF_BAR_ML - PDF_BAR_MR
const PDF_BAR_PH = PDF_BAR_H - PDF_BAR_MT - PDF_BAR_MB

function PDFDataBar({ block }: { block: DataBlock }) {
  const { columns, graph, heading } = block
  const layout = computeBarLayout(block.rows, graph.xCol, graph.yCol, graph.omitRows)
  const { categories, yTicks, yMax } = layout
  const xLabel = columns[graph.xCol], yLabel = columns[graph.yCol]
  const total = categories.length
  const barW = total > 0 ? Math.min(32, (PDF_BAR_PW / total) * 0.55) : 24
  const gap = total > 0 ? PDF_BAR_PW / total : 36
  const yMinorStep = yTicks.length > 1 ? (yTicks[1].value - yTicks[0].value) / 5 : 0
  const yMinorLines: number[] = []
  if (yMinorStep > 0) {
    for (let v = 0; v <= yMax + yMinorStep * 0.01; v += yMinorStep) {
      const r = Math.round(v * 1e9) / 1e9
      if (!yTicks.some(t => Math.abs(t.value - r) < yMinorStep * 0.01)) yMinorLines.push(r)
    }
  }
  function barY(val: number) { return PDF_BAR_MT + PDF_BAR_PH - (yMax > 0 ? (val / yMax) * PDF_BAR_PH : 0) }
  return (
    <View style={{ marginBottom: 9, alignItems: 'center' }}>
      {heading ? <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginBottom: 5, lineHeight: 1.0, alignSelf: 'flex-start' }}>{heading}</Text> : null}
      <Svg width={PDF_BAR_W} height={PDF_BAR_H}>
        {yMinorLines.map((v, i) => <Line key={`bym${i}`} x1={String(PDF_BAR_ML)} y1={String(barY(v))} x2={String(PDF_BAR_ML + PDF_BAR_PW)} y2={String(barY(v))} stroke="#e5e7eb" strokeWidth="0.5" />)}
        {yTicks.map((t, i) => <Line key={`byM${i}`} x1={String(PDF_BAR_ML)} y1={String(barY(t.value))} x2={String(PDF_BAR_ML + PDF_BAR_PW)} y2={String(barY(t.value))} stroke="#d1d5db" strokeWidth="0.8" />)}
        <Line x1={String(PDF_BAR_ML)} y1={String(PDF_BAR_MT)} x2={String(PDF_BAR_ML)} y2={String(PDF_BAR_MT + PDF_BAR_PH)} stroke="#374151" strokeWidth="1.5" />
        <Line x1={String(PDF_BAR_ML)} y1={String(PDF_BAR_MT + PDF_BAR_PH)} x2={String(PDF_BAR_ML + PDF_BAR_PW)} y2={String(PDF_BAR_MT + PDF_BAR_PH)} stroke="#374151" strokeWidth="1.5" />
        {graph.showYScale && yTicks.map((t, i) => <Text key={`bys${i}`} x={String(PDF_BAR_ML - 3)} y={String(barY(t.value) + 2.5)} style={{ fontSize: 7, textAnchor: 'end' }}>{t.label}</Text>)}
        {categories.map((cat, i) => {
          const cx = PDF_BAR_ML + gap * i + gap / 2
          const h = yMax > 0 ? (cat.value / yMax) * PDF_BAR_PH : 0
          const y = PDF_BAR_MT + PDF_BAR_PH - h
          return (
            <G key={i}>
              {cat.visible && <Rect x={String(cx - barW / 2)} y={String(y)} width={String(barW)} height={String(h)} fill="#3b82f6" opacity="0.8" />}
              {graph.showXScale && <Text x={String(cx)} y={String(PDF_BAR_MT + PDF_BAR_PH + 11)} style={{ fontSize: 7, textAnchor: 'middle' }}>{cat.label}</Text>}
            </G>
          )
        })}
        {graph.showXLabel && <Text x={String(PDF_BAR_ML + PDF_BAR_PW / 2)} y={String(PDF_BAR_H - 2)} style={{ fontSize: 8, fontWeight: 'bold', textAnchor: 'middle' }}>{xLabel.label}{xLabel.unit ? ` (${xLabel.unit})` : ''}</Text>}
        {graph.showYLabel && <Text x="8" y={String(PDF_BAR_MT + PDF_BAR_PH / 2)} style={{ fontSize: 8, fontWeight: 'bold', textAnchor: 'middle' }} transform={`rotate(-90, 8, ${PDF_BAR_MT + PDF_BAR_PH / 2})`}>{yLabel.label}{yLabel.unit ? ` (${yLabel.unit})` : ''}</Text>}
      </Svg>
    </View>
  )
}

function resolveDataBlock(block: DataBlock, blocks: Block[]): DataBlock {
  if (!block.graph.linkedDataId) return block
  const linked = blocks.find(b => b.type === 'data' && b.id === block.graph.linkedDataId) as DataBlock | undefined
  return linked ? { ...block, columns: linked.columns, rows: linked.rows } : block
}

function PDFData({ block, blocks }: { block: DataBlock; blocks: Block[] }) {
  const resolved = resolveDataBlock(block, blocks)
  if (resolved.display === 'graph') return <PDFDataGraph block={resolved} />
  if (resolved.display === 'bar') return <PDFDataBar block={resolved} />
  return <PDFDataTable block={resolved} />
}

function PDFInlineData({ dataId, blocks, markScheme }: { dataId: string; blocks: Block[]; markScheme?: boolean }) {
  const found = blocks.find(b => b.id === dataId && b.type === 'data') as DataBlock | undefined
  if (!found) return null
  const block = markScheme ? { ...found, graph: { ...found.graph, omitRows: [], showFitLine: true, showXLabel: true, showYLabel: true, showXScale: true, showYScale: true }, hiddenCells: [] as string[] } : found
  return <View style={{ marginLeft: 15, marginTop: 4, marginBottom: 4 }}><PDFData block={block} blocks={blocks} /></View>
}

function PDFInlineFigure({ figureId, blocks }: { figureId: string; blocks: Block[] }) {
  const found = blocks.find(b => b.id === figureId && b.type === 'figure') as FigureBlock | undefined
  if (!found) return null
  return <View style={{ marginLeft: 15, marginTop: 4, marginBottom: 4 }}><PDFFigure block={found} /></View>
}

function PDFNumericalAnswers({ block, blocks }: { block: NumericalAnswersBlock; blocks: Block[] }) {
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
  const shuffled = seededShuffle(answers, block.id)
  return (
    <View style={{ borderWidth: 2, borderColor: '#374151', borderRadius: 4, padding: '8 11', marginBottom: 14, backgroundColor: '#f9fafb' }}>
      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#111827', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {block.heading || 'Numerical answers'}
      </Text>
      {shuffled.length === 0 ? (
        <Text style={{ fontSize: 9, color: '#9ca3af', fontStyle: 'italic' }}>No numerical answers set.</Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {shuffled.map((ans, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#374151' }} />
              <Text style={{ fontSize: 10 }}>{ans}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

function PDFBlock({ block, blocks, showLines }: { block: Block; blocks: Block[]; showLines: boolean }) {
  const num = NUMBERED_TYPES.has(block.type) ? getQuestionNumber(blocks, block.id) : 0
  switch (block.type) {
    case 'header':          return <PDFHeader block={block} />
    case 'instructions':    return <PDFInstructions block={block} />
    case 'question':        return <PDFQuestion block={block} blocks={blocks} num={num} showLines={showLines} />
    case 'multiple_choice': return <PDFMultipleChoice block={block} num={num} />
    case 'worked_example':  return <PDFWorkedExample block={block} />
    case 'information':     return <PDFInformation block={block} />
    case 'match_them_up':   return <PDFMatchThemUp block={block} num={num} />
    case 'cloze':           return <PDFCloze block={block} num={num} />
    case 'order_steps':     return <PDFOrderSteps block={block} num={num} />
    case 'figure':             return <PDFFigure block={block} />
    case 'spacer':             return <PDFSpacer block={block} />
    case 'data':               return <PDFData block={block as DataBlock} blocks={blocks} />
    case 'numerical_answers':  return <PDFNumericalAnswers block={block as NumericalAnswersBlock} blocks={blocks} />
  }
}

// ── Mark scheme PDF renderers ────────────────────────────────────────────────

function PDFMSQuestion({ block, blocks, num }: { block: QuestionBlock; blocks: Block[]; num: number }) {
  const hasParts = block.parts.length > 0
  return (
    <View style={s.msQuestion} wrap={false}>
      <View style={s.msQuestionStem}>
        <Text style={s.qNum}>{num}.</Text>
        <View style={s.qText}>{htmlToPdf(block.stem, {})}</View>
        {!hasParts && block.marks > 0 && <Text style={s.marks}>[{block.marks}m]</Text>}
      </View>
      {block.attachedDataId && <PDFInlineData dataId={block.attachedDataId} blocks={blocks} markScheme />}
      {block.attachedFigureId && <PDFInlineFigure figureId={block.attachedFigureId} blocks={blocks} />}
      {hasParts ? (
        <View style={{ marginLeft: 15, marginBottom: 4 }}>
          {block.parts.map(part => (
            <View key={part.id} style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', gap: 5, marginBottom: 3 }}>
                <Text style={s.partLabel}>({part.label})</Text>
                <View style={{ flex: 1 }}>{htmlToPdf(part.stem, { fontSize: 10 })}</View>
                {part.marks > 0 && <Text style={s.marks}>[{part.marks}m]</Text>}
              </View>
              {part.attachedDataId && <PDFInlineData dataId={part.attachedDataId} blocks={blocks} markScheme />}
              {part.attachedFigureId && <PDFInlineFigure figureId={part.attachedFigureId} blocks={blocks} />}
              <View style={s.msAnswer}>
                {part.markScheme
                  ? <View style={s.msAnswerText}>{htmlToPdf(part.markScheme, { fontSize: 10.5, color: '#14532d' })}</View>
                  : <Text style={s.msNoAnswer}>No mark scheme added.</Text>
                }
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={s.msAnswer}>
          {block.markScheme
            ? <View style={s.msAnswerText}>{htmlToPdf(block.markScheme, { fontSize: 10.5, color: '#14532d' })}</View>
            : <Text style={s.msNoAnswer}>No mark scheme added.</Text>
          }
        </View>
      )}
    </View>
  )
}

function PDFMSMultipleChoice({ block, num }: { block: MultipleChoiceBlock; num: number }) {
  const LABELS = ['A', 'B', 'C', 'D', 'E', 'F']
  return (
    <View style={s.msQuestion} wrap={false}>
      <View style={s.msQuestionStem}>
        <Text style={s.qNum}>{num}.</Text>
        <View style={s.qText}>{htmlToPdf(block.stem, {})}</View>
        {block.marks > 0 && <Text style={s.marks}>[{block.marks}m]</Text>}
      </View>
      <View style={s.msCorrectOption}>
        <Text style={s.msCorrectLabel}>{LABELS[block.correctIndex] ?? block.correctIndex + 1}</Text>
        <View style={{ flex: 1 }}>{htmlToPdf(block.options[block.correctIndex] ?? '', { fontSize: 10 })}</View>
        <Text style={s.msCorrectTick}>✓</Text>
      </View>
      {block.markScheme && (
        <View style={[s.msAnswer, { marginTop: 4 }]}>
          <View style={s.msAnswerText}>{htmlToPdf(block.markScheme, { fontSize: 10.5, color: '#14532d' })}</View>
        </View>
      )}
    </View>
  )
}

function PDFMSCloze({ block, num }: { block: ClozeBlock; num: number }) {
  const parts = clozeToDisplayParts(block.text)
  return (
    <View style={s.msQuestion} wrap={false}>
      <View style={s.msQuestionStem}>
        <Text style={s.qNum}>{num}.</Text>
        {block.heading ? htmlToPdf(block.heading, { flex: 1, fontSize: 10.5 }) : <Text style={{ flex: 1, fontSize: 10.5 }}>Fill in the blanks.</Text>}
      </View>
      <Text style={s.msClozeText}>
        {parts.map((part, i) =>
          part.type === 'blank'
            ? <Text key={i} style={{ fontFamily: 'Helvetica-Bold', color: '#15803d' }}>{part.value}</Text>
            : <Text key={i}>{part.value}</Text>
        )}
      </Text>
    </View>
  )
}

function PDFMSMatchThemUp({ block, num }: { block: MatchThemUpBlock; num: number }) {
  return (
    <View style={s.msQuestion} wrap={false}>
      <View style={[s.msQuestionStem, { marginBottom: 6 }]}>
        <Text style={s.qNum}>{num}.</Text>
        {block.heading ? htmlToPdf(block.heading, { flex: 1, fontSize: 10.5 }) : <Text style={{ flex: 1, fontSize: 10.5 }}>Match each term to its definition.</Text>}
      </View>
      <View style={{ marginLeft: 15 }}>
        {block.items.map(item => (
          <View key={item.id} style={s.msMatchRow}>
            <View style={s.msMatchLeft}>{htmlToPdf(item.left, { fontSize: 10 })}</View>
            <Text style={s.msMatchArrow}>→</Text>
            <View style={s.msMatchRight}>{htmlToPdf(item.right, { fontSize: 10 })}</View>
          </View>
        ))}
      </View>
    </View>
  )
}

function PDFMSOrderSteps({ block, num }: { block: OrderStepsBlock; num: number }) {
  return (
    <View style={s.msQuestion} wrap={false}>
      <View style={[s.msQuestionStem, { marginBottom: 6 }]}>
        <Text style={s.qNum}>{num}.</Text>
        {block.heading ? htmlToPdf(block.heading, { flex: 1, fontSize: 10.5 }) : <Text style={{ flex: 1, fontSize: 10.5 }}>Number these steps in the correct order.</Text>}
      </View>
      <View style={{ marginLeft: 15 }}>
        {block.steps.map((step, i) => (
          <View key={i} style={s.msStepRow}>
            <View style={s.msStepNum}><Text style={{ fontSize: 9, color: '#fff', fontFamily: 'Helvetica-Bold' }}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}>{htmlToPdf(step, { fontSize: 10.5 })}</View>
          </View>
        ))}
      </View>
    </View>
  )
}

function PDFMarkSchemeSection({ worksheet }: { worksheet: Worksheet }) {
  const header = worksheet.blocks.find(b => b.type === 'header') as HeaderBlock | undefined
  const attachedIds = new Set(
    worksheet.blocks.flatMap(b =>
      b.type === 'question'
        ? [b.attachedDataId, b.attachedFigureId, ...b.parts.map(p => p.attachedDataId), ...b.parts.map(p => p.attachedFigureId)].filter(Boolean) as string[]
        : []
    )
  )
  const msBlocks = worksheet.blocks.filter(b =>
    ['question', 'multiple_choice', 'cloze', 'match_them_up', 'order_steps'].includes(b.type)
  )
  const standaloneDataWithHidden = worksheet.blocks.filter(b =>
    b.type === 'data' && !attachedIds.has(b.id) && ((b as DataBlock).hiddenCells ?? []).length > 0
  ) as DataBlock[]

  return (
    <>
      <View style={{ marginBottom: 18 }}>
        <Text style={s.msTitle}>Mark Scheme{header?.title ? ` — ${header.title}` : ''}</Text>
        {header?.topic && <Text style={s.msSubtitle}>{header.topic}</Text>}
        <View style={s.msTitleRule} />
      </View>
      {msBlocks.map(block => {
        const num = getQuestionNumber(worksheet.blocks, block.id)
        switch (block.type) {
          case 'question':        return <PDFMSQuestion key={block.id} block={block as QuestionBlock} blocks={worksheet.blocks} num={num} />
          case 'multiple_choice': return <PDFMSMultipleChoice key={block.id} block={block as MultipleChoiceBlock} num={num} />
          case 'cloze':           return <PDFMSCloze key={block.id} block={block as ClozeBlock} num={num} />
          case 'match_them_up':   return <PDFMSMatchThemUp key={block.id} block={block as MatchThemUpBlock} num={num} />
          case 'order_steps':     return <PDFMSOrderSteps key={block.id} block={block as OrderStepsBlock} num={num} />
          default: return null
        }
      })}
      {standaloneDataWithHidden.map(block => (
        <View key={block.id} style={s.msQuestion} wrap={false}>
          <PDFData block={{ ...block, hiddenCells: [] }} blocks={worksheet.blocks} />
        </View>
      ))}
    </>
  )
}

function getPDFRenderableBlocks(worksheet: Worksheet) {
  const attachedIds = new Set<string>()
  for (const b of worksheet.blocks) {
    if (b.type === 'question') {
      if (b.attachedDataId) attachedIds.add(b.attachedDataId)
      if (b.attachedFigureId) attachedIds.add(b.attachedFigureId)
      for (const p of b.parts) {
        if (p.attachedDataId) attachedIds.add(p.attachedDataId)
        if (p.attachedFigureId) attachedIds.add(p.attachedFigureId)
      }
    }
  }
  return worksheet.blocks.filter(b => !attachedIds.has(b.id))
}

// Export for use in BookletPDF — renders mark scheme page without a Document wrapper.
export function WorksheetMarkSchemePage({ worksheet }: { worksheet: Worksheet }) {
  return (
    <Page size="A4" style={s.page}>
      <PDFMarkSchemeSection worksheet={worksheet} />
    </Page>
  )
}

// Export for use in BookletPDF — renders the worksheet pages without a Document wrapper.
export function WorksheetDocumentPages({ worksheet }: { worksheet: Worksheet }) {
  const renderableBlocks = getPDFRenderableBlocks(worksheet)
  const showLines = worksheet.showLines !== false
  return (
    <Page size="A4" style={s.page}>
      {renderableBlocks.map(block => (
        <View key={block.id} wrap={false}>
          <PDFBlock block={block} blocks={worksheet.blocks} showLines={showLines} />
        </View>
      ))}
    </Page>
  )
}

export { getPDFRenderableBlocks }

export function WorksheetPDF({ worksheet }: { worksheet: Worksheet }) {
  const renderableBlocks = getPDFRenderableBlocks(worksheet)
  const showLines = worksheet.showLines !== false
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {renderableBlocks.map(block => (
          <View key={block.id} wrap={false}>
            <PDFBlock block={block} blocks={worksheet.blocks} showLines={showLines} />
          </View>
        ))}
      </Page>
      <Page size="A4" style={s.page}>
        <PDFMarkSchemeSection worksheet={worksheet} />
      </Page>
    </Document>
  )
}
