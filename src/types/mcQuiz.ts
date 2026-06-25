export interface MCQuestion {
  id: string
  text: string
  options: string[]  // options[0] is always the correct answer in canonical form
}

export interface MCQuizVersion {
  versionNumber: number
  code: string           // e.g. "A3F2-V1"
  questionOrder: number[]   // indices into canonical questions
  optionOrders: number[][]  // per question: indices into canonical options
  answerKey: string[]    // correct letter for each question in this version's order
}

export interface MCQuiz {
  id: string
  profile_id: string
  worksheet_id: string
  title: string
  question_count: number
  version_count: number
  questions: MCQuestion[]
  created_at: string
  updated_at: string
}

export interface QuizScan {
  id: string
  quiz_id: string
  profile_id: string
  version_number: number
  score: number
  question_count: number
  question_results: Record<string, boolean>  // canonical question id → correct
  scanned_at: string
}
