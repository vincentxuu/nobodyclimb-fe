/**
 * 攀岩系統練習遊戲 - Zustand 狀態管理
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  GameMode,
  Category,
  Question,
  Exam,
  AnswerResult,
  GameStats,
  CharacterState,
} from '@/lib/games/rope-system/types'
import { GAME_CONFIG, STORAGE_KEYS } from '@/lib/games/rope-system/constants'

interface RopeGameState {
  // ========== 遊戲設定 ==========
  mode: GameMode | null
  category: Category | null
  exam: Exam | null

  // ========== 題目狀態 ==========
  questions: Question[]
  currentIndex: number
  answers: Record<string, string | string[]>
  results: AnswerResult[]

  // ========== 遊戲狀態 ==========
  score: number
  lives: number
  combo: number
  maxCombo: number
  timeRemaining: number | null
  startTime: number | null

  // ========== UI 狀態 ==========
  isAnswered: boolean
  showExplanation: boolean
  characterState: CharacterState
  isComplete: boolean
  isPaused: boolean

  // ========== 音效設定 ==========
  soundEnabled: boolean

  // ========== Actions ==========
  startGame: (
    _mode: GameMode,
    _questions: Question[],
    _category?: Category,
    _exam?: Exam
  ) => void
  submitAnswer: (_answer: string | string[]) => AnswerResult
  nextQuestion: () => void
  setCharacterState: (_state: CharacterState) => void
  toggleSound: () => void
  togglePause: () => void
  updateTimeRemaining: (_time: number) => void
  resetGame: () => void
  getStats: () => GameStats
}

/** 初始狀態 */
const initialState = {
  mode: null,
  category: null,
  exam: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  results: [],
  score: 0,
  lives: GAME_CONFIG.INITIAL_LIVES,
  combo: 0,
  maxCombo: 0,
  timeRemaining: null,
  startTime: null,
  isAnswered: false,
  showExplanation: false,
  characterState: 'idle' as CharacterState,
  isComplete: false,
  isPaused: false,
  soundEnabled: true,
}

export const useRopeGameStore = create<RopeGameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * 開始遊戲
       */
      startGame: (mode, questions, category, exam) => {
        set({
          ...initialState,
          mode,
          questions,
          category: category || null,
          exam: exam || null,
          startTime: Date.now(),
          timeRemaining: exam?.timeLimit || null,
          soundEnabled: get().soundEnabled, // 保留音效設定
        })
      },

      /**
       * 提交答案
       */
      submitAnswer: (answer) => {
        const state = get()
        const currentQuestion = state.questions[state.currentIndex]

        if (!currentQuestion || state.isAnswered) {
          return {
            questionId: '',
            isCorrect: false,
            userAnswer: answer,
            correctAnswer: '',
            pointsEarned: 0,
          }
        }

        // 檢查答案是否正確
        const isCorrect = checkAnswer(answer, currentQuestion.correctAnswer)

        // 計算得分
        let pointsEarned = 0
        let newCombo = state.combo
        let newLives = state.lives
        let newCharacterState: CharacterState = state.characterState

        if (isCorrect) {
          // 答對：加分 + 連擊
          newCombo = state.combo + 1
          const comboBonus = Math.min(
            newCombo * GAME_CONFIG.COMBO_BONUS,
            GAME_CONFIG.MAX_COMBO_BONUS
          )
          pointsEarned = GAME_CONFIG.BASE_SCORE + comboBonus
          newCharacterState = 'climbing'
        } else {
          // 答錯：扣命 + 重置連擊
          newCombo = 0
          newLives = Math.max(0, state.lives - 1)
          newCharacterState = 'falling'
        }

        const result: AnswerResult = {
          questionId: currentQuestion.id,
          isCorrect,
          userAnswer: answer,
          correctAnswer: currentQuestion.correctAnswer,
          pointsEarned,
        }

        // 更新狀態
        set({
          answers: { ...state.answers, [currentQuestion.id]: answer },
          results: [...state.results, result],
          score: state.score + pointsEarned,
          lives: newLives,
          combo: newCombo,
          maxCombo: Math.max(state.maxCombo, newCombo),
          isAnswered: true,
          showExplanation: state.mode === 'learn',
          characterState: newCharacterState,
        })

        return result
      },

      /**
       * 進入下一題
       */
      nextQuestion: () => {
        const state = get()
        const nextIndex = state.currentIndex + 1
        const isLastQuestion = nextIndex >= state.questions.length
        const isGameOver = state.lives <= 0

        if (isLastQuestion || isGameOver) {
          set({
            isComplete: true,
            characterState: isGameOver ? 'idle' : 'celebrating',
          })
        } else {
          set({
            currentIndex: nextIndex,
            isAnswered: false,
            showExplanation: false,
            characterState: 'idle',
          })
        }
      },

      /**
       * 設定角色狀態
       */
      setCharacterState: (characterState) => {
        set({ characterState })
      },

      /**
       * 切換音效
       */
      toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }))
      },

      /**
       * 切換暫停
       */
      togglePause: () => {
        set((state) => ({ isPaused: !state.isPaused }))
      },

      /**
       * 更新剩餘時間
       */
      updateTimeRemaining: (time) => {
        set({ timeRemaining: time })
      },

      /**
       * 重置遊戲
       */
      resetGame: () => {
        set({
          ...initialState,
          soundEnabled: get().soundEnabled, // 保留音效設定
        })
      },

      /**
       * 取得遊戲統計
       */
      getStats: () => {
        const state = get()
        const correctCount = state.results.filter((r) => r.isCorrect).length
        const wrongCount = state.results.filter((r) => !r.isCorrect).length
        const timeSpent = state.startTime
          ? Math.floor((Date.now() - state.startTime) / 1000)
          : 0

        return {
          score: state.score,
          correctCount,
          wrongCount,
          maxCombo: state.maxCombo,
          timeSpent,
        }
      },
    }),
    {
      name: STORAGE_KEYS.SOUND_ENABLED,
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
      }),
    }
  )
)

/**
 * 檢查答案是否正確
 */
function checkAnswer(
  userAnswer: string | string[],
  correctAnswer: string | string[]
): boolean {
  // 單選題
  if (typeof correctAnswer === 'string') {
    return userAnswer === correctAnswer
  }

  // 排序題
  if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
    if (userAnswer.length !== correctAnswer.length) return false
    return userAnswer.every((answer, index) => answer === correctAnswer[index])
  }

  return false
}

// ========== Selectors ==========

/**
 * 取得當前題目
 */
export const selectCurrentQuestion = (state: RopeGameState) =>
  state.questions[state.currentIndex] || null

/**
 * 取得進度百分比
 */
export const selectProgress = (state: RopeGameState) =>
  state.questions.length > 0
    ? ((state.currentIndex + 1) / state.questions.length) * 100
    : 0

/**
 * 檢查遊戲是否結束
 */
export const selectIsGameOver = (state: RopeGameState) =>
  state.lives <= 0 || state.isComplete
