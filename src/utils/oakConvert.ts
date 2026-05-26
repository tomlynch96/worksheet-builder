import type { Block } from '../types/worksheet'
import type { OakQuizQuestion } from '../types/oak'

export function oakQuestionToBlock(q: OakQuizQuestion): Block {
  const id = crypto.randomUUID()

  switch (q.questionType) {
    case 'multiple-choice': {
      const options = q.answers.map(a => a.content ?? '').filter(Boolean)
      const correctIndex = q.answers.findIndex(a => a.distractor === false)
      const ci = correctIndex >= 0 ? correctIndex : 0
      return {
        id,
        type: 'multiple_choice',
        stem: q.question,
        marks: 1,
        options,
        correctIndex: ci,
        markScheme: `${options[ci] ?? ''} [1]`,
      }
    }

    case 'match': {
      return {
        id,
        type: 'match_them_up',
        heading: q.question,
        items: q.answers
          .filter(a => a.matchOption && a.correctChoice)
          .map(a => ({
            id: crypto.randomUUID(),
            left: a.matchOption!.content,
            right: a.correctChoice!.content,
          })),
      }
    }

    case 'order': {
      const sorted = [...q.answers].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      return {
        id,
        type: 'order_steps',
        heading: q.question,
        steps: sorted.map(a => a.content ?? '').filter(Boolean),
      }
    }

    case 'short-answer':
    default: {
      const acceptable = q.answers.filter(a => !a.distractor).map(a => a.content).filter(Boolean)
      return {
        id,
        type: 'question',
        stem: q.question,
        marks: 1,
        lines: 3,
        parts: [],
        markScheme: acceptable.length > 0 ? `${acceptable.join(' / ')} [1]` : '',
        numericalAnswer: '',
        attachedDataId: null,
      }
    }
  }
}
