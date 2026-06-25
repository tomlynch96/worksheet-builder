import { seededShuffle } from './shuffle'
import type { MCQuestion, MCQuizVersion } from '../types/mcQuiz'

const LETTERS = ['A', 'B', 'C', 'D']

// Short code for the bubble sheet — first 4 hex chars of quiz ID uppercased
function quizShortCode(quizId: string): string {
  return quizId.replace(/-/g, '').slice(0, 4).toUpperCase()
}

export function computeVersions(
  questions: MCQuestion[],
  versionCount: number,
  quizId: string,
): MCQuizVersion[] {
  const shortCode = quizShortCode(quizId)
  const versions: MCQuizVersion[] = []

  for (let v = 1; v <= versionCount; v++) {
    // Shuffle question order
    const qIndices = questions.map((_, i) => i)
    const questionOrder = seededShuffle(qIndices, `${quizId}-q-v${v}`)

    // Shuffle option order per question (always 4 options)
    const optionOrders: number[][] = questions.map((_, qi) => {
      const oIndices = [0, 1, 2, 3]
      return seededShuffle(oIndices, `${quizId}-opt-q${qi}-v${v}`)
    })

    // Build answer key: for each question in this version's order,
    // find where the correct answer (original index 0) ended up
    const answerKey = questionOrder.map(qi => {
      const shuffledOptOrder = optionOrders[qi]
      const correctPosition = shuffledOptOrder.indexOf(0)
      return LETTERS[correctPosition]
    })

    versions.push({
      versionNumber: v,
      code: `${shortCode}-V${v}`,
      questionOrder,
      optionOrders,
      answerKey,
    })
  }

  return versions
}
