import type { Block } from '../types/worksheet'
import type { OakQuizQuestion } from '../types/oak'

function isCloze(text: string) { return text.includes('{}') }

function clozeText(question: string, answer: string) {
  return question.replace('{}', `[${answer}]`)
}

export function oakQuestionToBlock(q: OakQuizQuestion): Block {
  const id = crypto.randomUUID()

  switch (q.questionType) {
    case 'multiple-choice': {
      // Gap-fill MCQ: question contains {} — convert to cloze with word bank
      if (isCloze(q.question)) {
        const correct = q.answers.find(a => a.distractor === false)
        return {
          id,
          type: 'cloze',
          heading: 'Complete the sentence:',
          text: clozeText(q.question, correct?.content ?? '...'),
          showWordBank: true,
        }
      }

      const options = q.answers.map(a => a.content ?? '').filter(Boolean)
      const correctAnswers = q.answers.filter(a => a.distractor === false)

      // Multi-answer MCQ (select all that apply) — convert to open question
      if (correctAnswers.length > 1) {
        return {
          id,
          type: 'question',
          stem: q.question,
          marks: correctAnswers.length,
          lines: 3,
          parts: [],
          markScheme: correctAnswers
            .map(a => a.content ?? '')
            .filter(Boolean)
            .map((a, i) => `${a} [${i < correctAnswers.length - 1 ? '1' : '1'}]`)
            .join(', ') + ` [${correctAnswers.length} marks]`,
          numericalAnswer: '',
        }
      }

      // Standard single-answer MCQ
      const ci = q.answers.findIndex(a => a.distractor === false)
      const correctIndex = ci >= 0 ? ci : 0
      return {
        id,
        type: 'multiple_choice',
        stem: q.question,
        marks: 1,
        options,
        correctIndex,
        markScheme: `${options[correctIndex] ?? ''} [1]`,
      }
    }

    case 'short-answer': {
      // Gap-fill short answer: {} in question → cloze block
      if (isCloze(q.question)) {
        const answer = q.answers[0]?.content ?? '...'
        return {
          id,
          type: 'cloze',
          heading: 'Complete the sentence:',
          text: clozeText(q.question, answer),
          showWordBank: false,
        }
      }

      // Normal short answer
      const acceptable = q.answers.map(a => a.content).filter(Boolean)
      return {
        id,
        type: 'question',
        stem: q.question,
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

    default: {
      const acceptable = q.answers.map(a => a.content).filter(Boolean)
      return {
        id,
        type: 'question',
        stem: q.question,
        marks: 1,
        lines: 3,
        parts: [],
        markScheme: acceptable.length > 0 ? `${acceptable.join(' / ')} [1]` : '',
        numericalAnswer: '',
      }
    }
  }
}
