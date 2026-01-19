/**
 * 攀岩系統練習遊戲 - Lib 導出
 */

// 型別
export * from './types'

// 常數
export * from './constants'

// 題庫資料
export { QUESTIONS_DATA, getQuestionsByCategory, getQuestionStats } from './questions-data'

// 音效管理
export { soundManager, useGameSounds } from './sounds'
