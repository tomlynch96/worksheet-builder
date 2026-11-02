import { useMemo } from 'react'
import type { HeaderBlock, ExamBoard, Tier, ExamCover } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { Field, Row, CheckRow, ListEditor } from '../EditorPrimitives'
import { DEFAULT_EXAM_INFORMATION, DEFAULT_EXAM_INSTRUCTIONS } from '../../../utils/marks'
import { QUALIFICATION_OFFERINGS, getSpecTopics } from '../../../data/qualifications'

interface Props {
  block: HeaderBlock
  dispatch: React.Dispatch<WorksheetAction>
}

const EXAM_BOARDS: ExamBoard[] = ['AQA', 'OCR', 'Edexcel', 'WJEC', 'Pearson', 'IB']
const TIERS: { value: Tier; label: string }[] = [
  { value: 'higher', label: 'Higher' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'both', label: 'Both tiers' },
]

export function HeaderEditor({ block, dispatch }: Props) {
  function update(updates: Partial<HeaderBlock>) {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates })
  }

  const exam = block.exam
  function updateExam(updates: Partial<ExamCover>) {
    if (exam) update({ exam: { ...exam, ...updates } })
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
      <Field label={exam ? 'Exam title' : 'Worksheet title'}>
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
      {!exam && (
        <CheckRow label="Show total marks" checked={block.showTotalMarks ?? false} onChange={v => update({ showTotalMarks: v })} />
      )}
      <CheckRow
        label="Exam front page"
        checked={!!exam}
        onChange={v => update({
          exam: v ? { instructions: DEFAULT_EXAM_INSTRUCTIONS, information: DEFAULT_EXAM_INFORMATION } : undefined,
        })}
      />
      {exam && (
        <>
          <Row>
            <Field label="Paper name">
              <input
                value={exam.paperName ?? ''}
                placeholder="e.g. Paper 1 (Higher Tier)"
                onChange={e => updateExam({ paperName: e.target.value || undefined })}
              />
            </Field>
            <Field label="Time (minutes)">
              <input
                type="number" min={0} step={5}
                value={exam.durationMinutes ?? ''}
                onChange={e => updateExam({ durationMinutes: e.target.value ? Number(e.target.value) : undefined })}
              />
            </Field>
          </Row>
          <Field label="Target total marks">
            <input
              type="number" min={0}
              value={exam.targetMarks ?? ''}
              onChange={e => updateExam({ targetMarks: e.target.value ? Number(e.target.value) : undefined })}
            />
          </Field>
          <div className="ep-field">
            <span className="ep-label">Instructions</span>
            <ListEditor items={exam.instructions} onChange={items => updateExam({ instructions: items })} addLabel="+ Add instruction" />
          </div>
          <div className="ep-field">
            <span className="ep-label">Information (the maximum mark is added automatically)</span>
            <ListEditor items={exam.information} onChange={items => updateExam({ information: items })} addLabel="+ Add line" />
          </div>
        </>
      )}
    </div>
  )
}
