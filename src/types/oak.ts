export interface OakLesson {
  lessonSlug: string
  lessonTitle: string
  unitSlug: string
  unitTitle: string
  keyStageSlug: string
  pupilLessonOutcome: string
  keyLearningPoints: string[]
  keywords: Array<{ keyword: string; description: string }>
  misconceptions: Array<{ misconception: string; response: string }>
}

export interface OakUnit {
  unitSlug: string
  unitTitle: string
  yearSlug: string
  keyStageSlug: string
  lessons: Array<{ lessonSlug: string; lessonTitle: string }>
}

export interface OakSubjectData {
  units: OakUnit[]
  lessons: OakLesson[]
}

export type OakSubject = 'science' | 'physics'
