export type ExamBoard = 'AQA' | 'OCR' | 'Edexcel' | 'WJEC'
export type Tier = 'foundation' | 'higher' | 'both'

export interface HeaderBlock {
  id: string
  type: 'header'
  title: string
  topic: string
  examBoard: ExamBoard
  tier: Tier
  showName: boolean
  showDate: boolean
  showClass: boolean
}

export interface InstructionsBlock {
  id: string
  type: 'instructions'
  items: string[]
}

export interface QuestionPart {
  id: string
  label: string
  stem: string
  marks: number
  lines: number
}

export interface QuestionBlock {
  id: string
  type: 'question'
  stem: string
  marks: number
  lines: number
  parts: QuestionPart[]
}

export interface WorkedExampleBlock {
  id: string
  type: 'worked_example'
  title: string
  steps: string[]
}

export interface FigureBlock {
  id: string
  type: 'figure'
  caption: string
  size: 'small' | 'medium' | 'large'
}

export interface SpacerBlock {
  id: string
  type: 'spacer'
  size: 'small' | 'medium' | 'large'
}

export interface InformationBlock {
  id: string
  type: 'information'
  heading: string
  content: string
}

export interface MatchItem {
  id: string
  left: string
  right: string
}

export interface MatchThemUpBlock {
  id: string
  type: 'match_them_up'
  heading: string
  items: MatchItem[]
}

// Text with [word] syntax marking blanks — e.g. "The [frequency] of a wave..."
export interface ClozeBlock {
  id: string
  type: 'cloze'
  heading: string
  text: string
  showWordBank: boolean
}

export interface OrderStepsBlock {
  id: string
  type: 'order_steps'
  heading: string
  steps: string[]
}

export interface MultipleChoiceBlock {
  id: string
  type: 'multiple_choice'
  stem: string
  marks: number
  options: string[]
  correctIndex: number
}

export type Block =
  | HeaderBlock
  | InstructionsBlock
  | QuestionBlock
  | WorkedExampleBlock
  | FigureBlock
  | SpacerBlock
  | InformationBlock
  | MatchThemUpBlock
  | ClozeBlock
  | OrderStepsBlock
  | MultipleChoiceBlock

export type BlockType = Block['type']

export interface Worksheet {
  id: string
  blocks: Block[]
}
