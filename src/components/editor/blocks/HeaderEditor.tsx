import { useMemo } from 'react'
import type { HeaderBlock, ExamBoard, Tier } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field, Row, CheckRow } from '../EditorPrimitives'
import { QUALIFICATION_OFFERINGS, getSpecTopics } from '../../../data/qualifications'

interface Props {
  block: HeaderBlock
  dispatch: React.Dispatch<WorksheetAction>
}

const EXAM_BOARDS: ExamBoard[] = ['AQA', 'OCR', 'Edexcel', 'WJEC', 'Hodder']
const TIERS: { value: Tier; label: string }[] = [
  { value: 'higher', label: 'Higher' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'both', label: 'Both tiers' },
]

export function HeaderEditor({ block, dispatch }: Props) {
  function update(updates: Partial<HeaderBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }

  // Offerings compatible with the currently-selected exam board
  const availableOfferings = useMemo(
    () => QUALIFICATION_OFFERINGS.filter(o => o.examBoards.includes(block.examBoard)),
    [block.examBoard],
  )

  // Spec topics using the offering's specDataId mapping
  const qualTopics = useMemo(
    () => block.qualification ? (getSpecTopics(block.qualification, block.examBoard) ?? []) : [],
    [block.qualification, block.examBoard],
  )

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
          <select
            value={block.examBoard}
            onChange={e => update({ examBoard: e.target.value as ExamBoard, qualification: undefined, specPoint: undefined })}
          >
            {EXAM_BOARDS.map(b => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Tier">
          <select value={block.tier} onChange={e => update({ tier: e.target.value as Tier })}>
            {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
      </Row>
      <Field label="Qualification">
        <select
          value={block.qualification ?? ''}
          onChange={e => update({ qualification: e.target.value || undefined, specPoint: undefined })}
        >
          <option value="">— None —</option>
          {availableOfferings.map(o => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </Field>
      {block.qualification && qualTopics.length > 0 && (
        <Field label="Spec point / lesson">
          <select
            value={block.specPoint ?? ''}
            onChange={e => update({ specPoint: e.target.value || undefined })}
          >
            <option value="">— Select spec point —</option>
            {qualTopics.map(topic => (
              <optgroup key={topic.ref} label={`${topic.ref} — ${topic.title}`}>
                {topic.points.map(point => (
                  <option key={point.ref} value={point.ref}>
                    {point.ref} — {point.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
      )}
      <CheckRow label="Show name field" checked={block.showName} onChange={v => update({ showName: v })} />
      <CheckRow label="Show date field" checked={block.showDate} onChange={v => update({ showDate: v })} />
      <CheckRow label="Show class field" checked={block.showClass} onChange={v => update({ showClass: v })} />
    </div>
  )
}
