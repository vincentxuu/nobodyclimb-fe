import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const TOTAL_QUESTIONS = 24

interface QuizState {
  answers: (number | null)[]
  currentIndex: number
  setAnswer: (index: number, value: number) => void
  goNext: () => void
  goPrev: () => void
  reset: () => void
  isComplete: () => boolean
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      answers: Array(TOTAL_QUESTIONS).fill(null),
      currentIndex: 0,

      setAnswer: (index, value) =>
        set((state) => {
          const answers = [...state.answers]
          answers[index] = value
          return { answers }
        }),

      goNext: () =>
        set((state) => ({
          currentIndex: Math.min(state.currentIndex + 1, TOTAL_QUESTIONS - 1),
        })),

      goPrev: () =>
        set((state) => ({
          currentIndex: Math.max(state.currentIndex - 1, 0),
        })),

      reset: () =>
        set({
          answers: Array(TOTAL_QUESTIONS).fill(null),
          currentIndex: 0,
        }),

      isComplete: () => get().answers.every((a) => a !== null),
    }),
    {
      name: 'nobodyclimb-quiz',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
