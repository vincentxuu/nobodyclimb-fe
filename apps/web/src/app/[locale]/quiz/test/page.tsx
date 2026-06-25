'use client'

import { calculateQuizResult, getPersonalityType, QUIZ_QUESTIONS } from '@nobodyclimb/constants'
import type { QuizAnswer } from '@nobodyclimb/types'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QuizProgress } from '@/components/quiz/QuizProgress'
import { QuizQuestion } from '@/components/quiz/QuizQuestion'
import { useQuizStore } from '@/store/quizStore'

function encodeScores(result: {
  bodyPercent: number
  motivePercent: number
  mindPercent: number
  gritIndex: number
}) {
  const payload = {
    b: Math.round(result.bodyPercent),
    m: Math.round(result.motivePercent),
    d: Math.round(result.mindPercent),
    g: Math.round(result.gritIndex),
  }
  // URL-safe base64
  return btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export default function QuizTestPage() {
  const router = useRouter()
  const { answers, currentIndex, setAnswer, goNext, goPrev, reset } = useQuizStore()
  const [mounted, setMounted] = useState(false)
  const completedRef = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sortedQuestions = useMemo(() => [...QUIZ_QUESTIONS].sort((a, b) => a.order - b.order), [])
  const currentQuestion = sortedQuestions[currentIndex]
  const totalQuestions = sortedQuestions.length
  const answeredCount = answers.filter((a) => a !== null).length

  const handleAnswer = useCallback(
    (value: number) => {
      setAnswer(currentIndex, value)
      if (currentIndex < totalQuestions - 1) {
        setTimeout(() => goNext(), 300)
      }
    },
    [currentIndex, totalQuestions, setAnswer, goNext]
  )

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    if (answers.some((a) => a === null)) return

    completedRef.current = true

    const quizAnswers: QuizAnswer[] = sortedQuestions.map((q, i) => ({
      questionId: q.id,
      value: answers[i] as 1 | 2 | 3 | 4 | 5,
    }))

    const result = calculateQuizResult(quizAnswers)
    const type = getPersonalityType(result.typeCode)
    if (!type) {
      completedRef.current = false
      return
    }

    const s = encodeScores(result)
    reset()
    router.push(`/quiz/result/${result.typeCode.toLowerCase()}?s=${s}`)
  }, [answers, sortedQuestions, reset, router])

  useEffect(() => {
    if (!mounted) return
    if (answeredCount === totalQuestions && currentIndex === totalQuestions - 1) {
      handleComplete()
    }
  }, [mounted, answeredCount, totalQuestions, currentIndex, handleComplete])

  if (!mounted || !currentQuestion) return null

  const axisColors: Record<string, string> = {
    body: 'from-red-50/80 via-white to-orange-50/60',
    motive: 'from-amber-50/80 via-white to-yellow-50/60',
    mind: 'from-emerald-50/80 via-white to-teal-50/60',
  }
  const bgGradient = currentQuestion ? axisColors[currentQuestion.axis] || '' : ''

  return (
    <div
      className={`flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-gradient-to-br px-4 transition-all duration-700 ${bgGradient}`}
    >
      <div className="w-full max-w-lg">
        <QuizProgress current={currentIndex + 1} total={totalQuestions} />
        <QuizQuestion
          question={currentQuestion}
          selectedValue={answers[currentIndex]}
          onAnswer={handleAnswer}
          onPrev={currentIndex > 0 ? goPrev : undefined}
          questionIndex={currentIndex}
        />
      </div>
    </div>
  )
}
