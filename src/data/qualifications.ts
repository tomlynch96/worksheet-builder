import { getQualification } from './specs'

export interface QualificationOffering {
  id: string
  label: string
  shortLabel: string
  examBoards: string[]
  /** Returns the specs.ts QUALIFICATIONS id if we have spec data for this board */
  specDataId: (examBoard: string) => string | null
}

export const QUALIFICATION_OFFERINGS: QualificationOffering[] = [
  {
    id: 'gcse-physics',
    label: 'GCSE Physics',
    shortLabel: 'GCSE Physics',
    examBoards: ['AQA', 'OCR', 'Edexcel', 'WJEC'],
    specDataId: (b) => b === 'Edexcel' ? 'edexcel-gcse-physics' : null,
  },
  {
    id: 'gcse-combined',
    label: 'GCSE Combined Science (Physics)',
    shortLabel: 'GCSE Combined',
    examBoards: ['AQA', 'OCR', 'Edexcel', 'WJEC'],
    specDataId: (b) => b === 'Edexcel' ? 'edexcel-gcse-combined' : null,
  },
  {
    id: 'alevel-physics',
    label: 'A Level Physics',
    shortLabel: 'A Level Physics',
    examBoards: ['AQA', 'OCR', 'Edexcel', 'WJEC'],
    specDataId: (b) => b === 'Edexcel' ? 'edexcel-alevel-physics' : null,
  },
]

export function getOffering(id: string): QualificationOffering | undefined {
  return QUALIFICATION_OFFERINGS.find(q => q.id === id)
}

export function offeringLabel(qualId: string | null | undefined, examBoard: string | null | undefined): string {
  if (!qualId || !examBoard) return ''
  const offering = getOffering(qualId)
  if (!offering) return qualId
  return `${examBoard} ${offering.shortLabel}`
}

export function getSpecTopics(qualId: string, examBoard: string) {
  const offering = getOffering(qualId)
  if (!offering) return null
  const specId = offering.specDataId(examBoard)
  if (!specId) return null
  return getQualification(specId)?.topics ?? null
}
