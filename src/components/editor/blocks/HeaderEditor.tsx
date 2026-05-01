import type { HeaderBlock, ExamBoard, Tier } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field, Row, CheckRow } from '../EditorPrimitives'

interface Props {
  block: HeaderBlock
  dispatch: React.Dispatch<WorksheetAction>
}

const EXAM_BOARDS: ExamBoard[] = ['AQA', 'OCR', 'Edexcel', 'WJEC']
const TIERS: { value: Tier; label: string }[] = [
  { value: 'higher', label: 'Higher' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'both', label: 'Both tiers' },
]

export function HeaderEditor({ block, dispatch }: Props) {
  function update(updates: Partial<HeaderBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }

  return (
    <div className="block-fields">
      <Field label="Worksheet title">
        <input value={block.title} onChange={e => update({ title: e.target.value })} />
      </Field>
      <Field label="Topic / subject line">
        <input value={block.topic} onChange={e => update({ topic: e.target.value })} />
      </Field>
      <Row>
        <Field label="Exam board">
          <select value={block.examBoard} onChange={e => update({ examBoard: e.target.value as ExamBoard })}>
            {EXAM_BOARDS.map(b => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Tier">
          <select value={block.tier} onChange={e => update({ tier: e.target.value as Tier })}>
            {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
      </Row>
      <CheckRow label="Show name field" checked={block.showName} onChange={v => update({ showName: v })} />
      <CheckRow label="Show date field" checked={block.showDate} onChange={v => update({ showDate: v })} />
      <CheckRow label="Show class field" checked={block.showClass} onChange={v => update({ showClass: v })} />
    </div>
  )
}
