export interface OakImage {
  url: string
  width: number
  height: number
  alt?: string
  text?: string
}

export interface OakQuizAnswer {
  type: 'text' | 'image'
  content?: string | OakImage
  distractor?: boolean
  matchOption?: { type: string; content: string }
  correctChoice?: { type: string; content: string }
  order?: number
}

export interface OakQuizQuestion {
  question: string
  questionType: 'multiple-choice' | 'short-answer' | 'match' | 'order'
  questionImage?: OakImage
  answers: OakQuizAnswer[]
}

export interface OakLessonSummary {
  lessonSlug: string
  lessonTitle: string
  unitTitle?: string
}

export interface OakLessonDetail {
  lessonSlug: string
  lessonTitle: string
  unitTitle?: string
  keyStageSlug: string
  pupilLessonOutcome: string
  keyLearningPoints: string[]
  keywords: Array<{ keyword: string; description: string }>
  misconceptions: Array<{ misconception: string; response: string }>
  starterQuiz: OakQuizQuestion[]
  exitQuiz: OakQuizQuestion[]
}

export type OakSubject = 'science' | 'physics'
