import type { Block } from '../types/worksheet'
import type { OakQuizQuestion } from '../types/oak'

function isCloze(text: string) { return text.includes('{}') }

function clozeText(question: string, answer: string) {
  return question.replace('{}', `[${answer}]`)
}

/** Returns true if the question requires an image to make sense and should be skipped. */
export function oakQuestionNeedsImage(q: OakQuizQuestion): boolean {
  if (q.questionImage) return true
  // If every answer option is an image, the question is image-dependent
  if (q.questionType === 'multiple-choice') {
    const hasAnyText = q.answers.some(a => a.type === 'text' && typeof a.content === 'string' && a.content.trim())
    if (!hasAnyText) return true
  }
  return false
}

export function oakQuestionToBlock(q: OakQuizQuestion): Block {
  // Strip image-type answers — keep only text answers
  const q2: OakQuizQuestion = {
    ...q,
    answers: q.answers.filter(a => a.type === 'text' && typeof a.content === 'string'),
  }
  const id = crypto.randomUUID()

  switch (q2.questionType) {
    case 'multiple-choice': {
      // Gap-fill MCQ: question contains {} — convert to cloze with word bank
      if (isCloze(q2.question)) {
        const correct = q2.answers.find(a => a.distractor === false)
        return {
          id,
          type: 'cloze',
          heading: 'Complete the sentence:',
          text: clozeText(q2.question, (correct?.content as string) ?? '...'),
          showWordBank: true,
        }
      }

      const options = q2.answers.map(a => a.content as string).filter(Boolean)
      const correctAnswers = q2.answers.filter(a => a.distractor === false)

      // Multi-answer MCQ (select all that apply) — convert to open question
      if (correctAnswers.length > 1) {
        return {
          id,
          type: 'question',
          stem: q2.question,
          marks: correctAnswers.length,
          lines: 3,
          parts: [],
          markScheme: correctAnswers
            .map(a => a.content as string)
            .filter(Boolean)
            .join(', ') + ` [${correctAnswers.length} marks]`,
          numericalAnswer: '',
        }
      }

      // Standard single-answer MCQ
      const ci = q2.answers.findIndex(a => a.distractor === false)
      const correctIndex = ci >= 0 ? ci : 0
      return {
        id,
        type: 'multiple_choice',
        stem: q2.question,
        marks: 1,
        options,
        correctIndex,
        markScheme: `${options[correctIndex] ?? ''} [1]`,
      }
    }

    case 'short-answer': {
      // Gap-fill short answer: {} in question → cloze block
      if (isCloze(q2.question)) {
        const answer = (q2.answers[0]?.content as string) ?? '...'
        return {
          id,
          type: 'cloze',
          heading: 'Complete the sentence:',
          text: clozeText(q2.question, answer),
          showWordBank: false,
        }
      }

      const acceptable = q2.answers.map(a => a.content as string).filter(Boolean)
      return {
        id,
        type: 'question',
        stem: q2.question,
        marks: 1,
        lines: 3,
        parts: [],
        markScheme: acceptable.length > 0 ? `${acceptable.join(' / ')} [1]` : '',
        numericalAnswer: '',
      }
    }

    case 'match': {
      return {
        id,
        type: 'match_them_up',
        heading: q2.question,
        items: q2.answers
          .filter(a => a.matchOption && a.correctChoice)
          .map(a => ({
            id: crypto.randomUUID(),
            left: a.matchOption!.content,
            right: a.correctChoice!.content,
          })),
      }
    }

    case 'order': {
      const sorted = [...q2.answers].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      return {
        id,
        type: 'order_steps',
        heading: q2.question,
        steps: sorted.map(a => a.content as string).filter(Boolean),
      }
    }

    default: {
      const acceptable = q2.answers.map(a => a.content as string).filter(Boolean)
      return {
        id,
        type: 'question',
        stem: q2.question,
        marks: 1,
        lines: 3,
        parts: [],
        markScheme: acceptable.length > 0 ? `${acceptable.join(' / ')} [1]` : '',
        numericalAnswer: '',
      }
    }
  }
}
