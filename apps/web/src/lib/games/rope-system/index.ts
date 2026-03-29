/**
 * 攀岩系統練習遊戲 - Lib 導出
 */

// 常數
export * from './constants'
// 題庫資料（異步載入）
export {
  clearQuestionsCache,
  fetchQuestionsByCategory,
  getQuestionStats,
  getQuestionsByCategory, // deprecated
  preloadQuestions,
} from './questions-data'
// 音效管理
export { soundManager, useGameSounds } from './sounds'
// 型別
export * from './types'
