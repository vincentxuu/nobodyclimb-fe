import type {
  AxisScore,
  PersonalityTypeCode,
  QuizAnswer,
  QuizAxis,
  QuizQuestion,
  QuizResult,
} from '@nobodyclimb/types'
import { QUIZ_QUESTIONS } from './questions'
import { QUIZ_AXES } from './types'

function calculateAxisScore(
  answers: QuizAnswer[],
  axis: QuizAxis,
  questions: readonly QuizQuestion[]
): number {
  const axisQuestions = questions.filter((q) => q.axis === axis)
  let total = 0
  for (const q of axisQuestions) {
    const answer = answers.find((a) => a.questionId === q.id)
    if (!answer) continue
    total += q.direction === 'left' ? answer.value : 6 - answer.value
  }
  return total
}

function determineDirection(
  axisScore: number,
  axis: QuizAxis
): { code: string; direction: string } {
  const axisDef = QUIZ_AXES.find((a) => a.id === axis)!
  if (axisScore >= 24) {
    return { code: axisDef.left.code, direction: axisDef.left.nameEn }
  }
  return { code: axisDef.right.code, direction: axisDef.right.nameEn }
}

export function calculateQuizResult(answers: QuizAnswer[]): QuizResult {
  if (answers.length < 24) {
    throw new Error('需要回答全部 24 題才能計算結果')
  }

  const seen = new Set<string>()
  for (const a of answers) {
    if (a.value < 1 || a.value > 5 || !Number.isInteger(a.value)) {
      throw new Error(`答案值必須為 1-5 的整數，收到: ${a.value}`)
    }
    if (seen.has(a.questionId)) {
      throw new Error(`重複的題目 ID: ${a.questionId}`)
    }
    seen.add(a.questionId)
  }

  for (const q of QUIZ_QUESTIONS) {
    if (!seen.has(q.id)) {
      throw new Error(`缺少題目 ${q.id} 的答案，需要回答全部 24 題`)
    }
  }

  const axes: QuizAxis[] = ['body', 'motive', 'mind']
  const axisScores: AxisScore[] = []
  let typeCode = ''

  for (const axis of axes) {
    const score = calculateAxisScore(answers, axis, QUIZ_QUESTIONS)
    const { code, direction } = determineDirection(score, axis)
    axisScores.push({ axis, score, direction })
    typeCode += code
  }

  const bodyScore = axisScores.find((a) => a.axis === 'body')!.score
  const motiveScore = axisScores.find((a) => a.axis === 'motive')!.score
  const mindScore = axisScores.find((a) => a.axis === 'mind')!.score

  const gritIndex = ((motiveScore - 8) / 32) * 100
  const flowIndex = ((40 - motiveScore) / 32) * 100
  const bodyPercent = ((bodyScore - 8) / 32) * 100
  const motivePercent = ((motiveScore - 8) / 32) * 100
  const mindPercent = ((mindScore - 8) / 32) * 100

  return {
    typeCode: typeCode as PersonalityTypeCode,
    axisScores,
    bodyPercent,
    motivePercent,
    mindPercent,
    gritIndex,
    flowIndex,
  }
}
