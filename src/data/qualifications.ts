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
    specDataId: (b) => {
      if (b === 'AQA')    return 'aqa-gcse-physics'
      if (b === 'OCR')    return 'ocr-gateway-gcse-physics'
      if (b === 'Edexcel') return 'edexcel-gcse-physics'
      if (b === 'WJEC')   return 'wjec-gcse-physics'
      return null
    },
  },
  {
    id: 'gcse-biology',
    label: 'GCSE Biology',
    shortLabel: 'GCSE Biology',
    examBoards: ['AQA', 'OCR', 'Edexcel', 'WJEC'],
    specDataId: (b) => {
      if (b === 'AQA')    return 'aqa-gcse-biology'
      if (b === 'OCR')    return 'ocr-gateway-gcse-biology'
      if (b === 'Edexcel') return 'edexcel-gcse-biology'
      if (b === 'WJEC')   return 'wjec-gcse-biology'
      return null
    },
  },
  {
    id: 'gcse-chemistry',
    label: 'GCSE Chemistry',
    shortLabel: 'GCSE Chemistry',
    examBoards: ['AQA', 'OCR', 'Edexcel', 'WJEC'],
    specDataId: (b) => {
      if (b === 'AQA')    return 'aqa-gcse-chemistry'
      if (b === 'OCR')    return 'ocr-gateway-gcse-chemistry'
      if (b === 'Edexcel') return 'edexcel-gcse-chemistry'
      if (b === 'WJEC')   return 'wjec-gcse-chemistry'
      return null
    },
  },
  {
    id: 'alevel-physics',
    label: 'A Level Physics',
    shortLabel: 'A Level Physics',
    examBoards: ['AQA', 'OCR', 'Edexcel', 'WJEC'],
    specDataId: (b) => {
      if (b === 'AQA')    return 'aqa-alevel-physics'
      if (b === 'OCR')    return 'ocr-alevel-physics'
      if (b === 'Edexcel') return 'edexcel-alevel-physics'
      if (b === 'WJEC')   return 'wjec-alevel-physics'
      return null
    },
  },
  {
    id: 'exploring-science-y7',
    label: 'Exploring Science Year 7',
    shortLabel: 'Exp. Sci Y7',
    examBoards: ['Hodder'],
    specDataId: () => 'exploring-science-y7',
  },
  {
    id: 'exploring-science-y8',
    label: 'Exploring Science Year 8',
    shortLabel: 'Exp. Sci Y8',
    examBoards: ['Hodder'],
    specDataId: () => 'exploring-science-y8',
  },
  {
    id: 'exploring-science-y9',
    label: 'Exploring Science Year 9',
    shortLabel: 'Exp. Sci Y9',
    examBoards: ['Hodder'],
    specDataId: () => null,
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
