/**
 * 攀岩人格測驗 Store
 *
 * 管理測驗進度、答案和結果
 */

import { calculateQuizResult, QUIZ_QUESTIONS } from '@nobodyclimb/constants'
import type { QuizAnswer, QuizResult } from '@nobodyclimb/types'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface QuizState {
  answers: QuizAnswer[]
  currentIndex: number
  result: QuizResult | null
  isCompleted: boolean

  setAnswer: (questionId: string, value: 1 | 2 | 3 | 4 | 5) => void
  goNext: () => void
  goPrev: () => void
  complete: () => void
  reset: () => void
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      answers: [],
      currentIndex: 0,
      result: null,
      isCompleted: false,

      setAnswer: (questionId, value) => {
        const { answers } = get()
        const existingIndex = answers.findIndex((a) => a.questionId === questionId)

        if (existingIndex >= 0) {
          const updated = [...answers]
          updated[existingIndex] = { questionId, value }
          set({ answers: updated })
        } else {
          set({ answers: [...answers, { questionId, value }] })
        }
      },

      goNext: () => {
        const { currentIndex } = get()
        if (currentIndex < QUIZ_QUESTIONS.length - 1) {
          set({ currentIndex: currentIndex + 1 })
        }
      },

      goPrev: () => {
        const { currentIndex } = get()
        if (currentIndex > 0) {
          set({ currentIndex: currentIndex - 1 })
        }
      },

      complete: () => {
        const { answers } = get()
        const result = calculateQuizResult(answers)
        set({ result, isCompleted: true })
      },

      reset: () => {
        set({
          answers: [],
          currentIndex: 0,
          result: null,
          isCompleted: false,
        })
      },
    }),
    {
      name: 'quiz-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
