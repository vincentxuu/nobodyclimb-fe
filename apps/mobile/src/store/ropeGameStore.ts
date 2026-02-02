/**
 * 繩索系統遊戲狀態管理
 *
 * 對應 apps/web/src/store/ropeGameStore.ts
 */
import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

const ROPE_GAME_PROGRESS_KEY = 'rope_game_progress'

interface Question {
  id: string
  categoryId: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface CategoryProgress {
  categoryId: string
  totalQuestions: number
  answeredQuestions: number
  correctAnswers: number
  lastPlayedAt: number
  isCompleted: boolean
}

interface GameSession {
  categoryId: string
  questions: Question[]
  currentIndex: number
  answers: number[]
  startedAt: number
  score: number
}

interface RopeGameState {
  // 進度追蹤
  progress: Map<string, CategoryProgress>
  totalScore: number

  // 當前遊戲
  currentSession: GameSession | null

  // 設定
  soundEnabled: boolean
  vibrationEnabled: boolean

  // 初始化
  isInitialized: boolean
  initProgress: () => Promise<void>

  // 進度操作
  getCategoryProgress: (categoryId: string) => CategoryProgress | undefined
  updateCategoryProgress: (categoryId: string, progress: Partial<CategoryProgress>) => Promise<void>
  resetCategoryProgress: (categoryId: string) => Promise<void>
  resetAllProgress: () => Promise<void>

  // 遊戲操作
  startGame: (categoryId: string, questions: Question[]) => void
  submitAnswer: (answerIndex: number) => { isCorrect: boolean; correctAnswer: number }
  nextQuestion: () => boolean
  endGame: () => { score: number; totalQuestions: number; correctAnswers: number }
  quitGame: () => void

  // 設定操作
  toggleSound: () => void
  toggleVibration: () => void
}

export const useRopeGameStore = create<RopeGameState>((set, get) => ({
  progress: new Map(),
  totalScore: 0,
  currentSession: null,
  soundEnabled: true,
  vibrationEnabled: true,
  isInitialized: false,

  initProgress: async () => {
    try {
      const stored = await AsyncStorage.getItem(ROPE_GAME_PROGRESS_KEY)

      if (stored) {
        const data = JSON.parse(stored)
        const progressMap = new Map<string, CategoryProgress>(
          Object.entries(data.progress || {})
        )

        set({
          progress: progressMap,
          totalScore: data.totalScore || 0,
          soundEnabled: data.soundEnabled ?? true,
          vibrationEnabled: data.vibrationEnabled ?? true,
          isInitialized: true,
        })
      } else {
        set({ isInitialized: true })
      }
    } catch (error) {
      console.error('Failed to load rope game progress:', error)
      set({ isInitialized: true })
    }
  },

  getCategoryProgress: (categoryId) => {
    return get().progress.get(categoryId)
  },

  updateCategoryProgress: async (categoryId, progressUpdate) => {
    const { progress, totalScore } = get()
    const existing = progress.get(categoryId)

    const updated: CategoryProgress = {
      categoryId,
      totalQuestions: existing?.totalQuestions || 0,
      answeredQuestions: existing?.answeredQuestions || 0,
      correctAnswers: existing?.correctAnswers || 0,
      lastPlayedAt: Date.now(),
      isCompleted: existing?.isCompleted || false,
      ...progressUpdate,
    }

    const newProgress = new Map(progress)
    newProgress.set(categoryId, updated)

    // 計算新的總分
    let newTotalScore = 0
    newProgress.forEach((p) => {
      newTotalScore += p.correctAnswers * 10
    })

    set({ progress: newProgress, totalScore: newTotalScore })

    // 持久化
    try {
      const data = {
        progress: Object.fromEntries(newProgress),
        totalScore: newTotalScore,
        soundEnabled: get().soundEnabled,
        vibrationEnabled: get().vibrationEnabled,
      }
      await AsyncStorage.setItem(ROPE_GAME_PROGRESS_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save rope game progress:', error)
    }
  },

  resetCategoryProgress: async (categoryId) => {
    const { progress } = get()
    const newProgress = new Map(progress)
    newProgress.delete(categoryId)

    set({ progress: newProgress })

    try {
      const data = {
        progress: Object.fromEntries(newProgress),
        totalScore: get().totalScore,
        soundEnabled: get().soundEnabled,
        vibrationEnabled: get().vibrationEnabled,
      }
      await AsyncStorage.setItem(ROPE_GAME_PROGRESS_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to reset category progress:', error)
    }
  },

  resetAllProgress: async () => {
    set({
      progress: new Map(),
      totalScore: 0,
      currentSession: null,
    })

    try {
      await AsyncStorage.removeItem(ROPE_GAME_PROGRESS_KEY)
    } catch (error) {
      console.error('Failed to reset all progress:', error)
    }
  },

  startGame: (categoryId, questions) => {
    set({
      currentSession: {
        categoryId,
        questions,
        currentIndex: 0,
        answers: [],
        startedAt: Date.now(),
        score: 0,
      },
    })
  },

  submitAnswer: (answerIndex) => {
    const { currentSession } = get()
    if (!currentSession) {
      return { isCorrect: false, correctAnswer: -1 }
    }

    const currentQuestion = currentSession.questions[currentSession.currentIndex]
    const isCorrect = answerIndex === currentQuestion.correctAnswer

    set({
      currentSession: {
        ...currentSession,
        answers: [...currentSession.answers, answerIndex],
        score: isCorrect ? currentSession.score + 10 : currentSession.score,
      },
    })

    return {
      isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
    }
  },

  nextQuestion: () => {
    const { currentSession } = get()
    if (!currentSession) return false

    const nextIndex = currentSession.currentIndex + 1
    const hasMore = nextIndex < currentSession.questions.length

    if (hasMore) {
      set({
        currentSession: {
          ...currentSession,
          currentIndex: nextIndex,
        },
      })
    }

    return hasMore
  },

  endGame: () => {
    const { currentSession, updateCategoryProgress } = get()
    if (!currentSession) {
      return { score: 0, totalQuestions: 0, correctAnswers: 0 }
    }

    const totalQuestions = currentSession.questions.length
    const correctAnswers = currentSession.answers.filter(
      (answer, index) =>
        answer === currentSession.questions[index].correctAnswer
    ).length

    // 更新進度
    updateCategoryProgress(currentSession.categoryId, {
      totalQuestions,
      answeredQuestions: totalQuestions,
      correctAnswers,
      isCompleted: correctAnswers >= totalQuestions * 0.8, // 80% 正確率算完成
    })

    set({ currentSession: null })

    return {
      score: currentSession.score,
      totalQuestions,
      correctAnswers,
    }
  },

  quitGame: () => {
    set({ currentSession: null })
  },

  toggleSound: () => {
    set((state) => ({ soundEnabled: !state.soundEnabled }))
  },

  toggleVibration: () => {
    set((state) => ({ vibrationEnabled: !state.vibrationEnabled }))
  },
}))
