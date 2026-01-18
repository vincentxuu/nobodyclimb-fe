/**
 * 攀岩系統練習遊戲 - TypeScript 型別定義
 */

// ============ 基礎型別 ============

/** 題目類型 */
export type QuestionType = 'choice' | 'ordering' | 'situation'

/** 難度等級 */
export type Difficulty = 1 | 2 | 3

/** 遊戲模式 */
export type GameMode = 'learn' | 'exam'

/** 角色狀態 */
export type CharacterState = 'idle' | 'climbing' | 'falling' | 'celebrating'

// ============ 類別相關 ============

/** 題目類別 */
export interface Category {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  parentSlug: 'sport' | 'trad'
  parentName: string
  questionCount: number
  difficulty: Difficulty
  order: number
}

// ============ 題目相關 ============

/** 題目選項 */
export interface QuestionOption {
  id: string
  text: string
  image?: string
}

/** 題目 */
export interface Question {
  id: string
  categoryId: string
  type: QuestionType
  difficulty: Difficulty
  scenario?: string
  question: string
  options: QuestionOption[]
  correctAnswer: string | string[] // 單選為 string，排序題為 string[]
  explanation?: string
  hint?: string
  referenceSources?: string[]
  imageUrl?: string
  tags?: string[]
}

// ============ 考試相關 ============

/** 考試 */
export interface Exam {
  id: string
  name: string
  description?: string
  categoryIds: string[]
  questionCount: number
  timeLimit?: number // 秒
  passScore: number
  randomizeQuestions: boolean
  randomizeOptions: boolean
  questions?: Question[]
}

/** 作答紀錄 */
export interface Attempt {
  id: string
  examId?: string
  categoryId?: string
  userId: string
  mode: GameMode
  answers: Record<string, string | string[]>
  score: number
  correctCount: number
  totalCount: number
  startedAt: string
  completedAt?: string
  timeSpent?: number // 秒
}

// ============ 認證相關 ============

/** 認證等級 */
export type CertificationLevel = 1 | 2 | 3 | 4 | 5

/** 認證 */
export interface Certification {
  id: string
  userId: string
  level: CertificationLevel
  examId: string
  attemptId: string
  issuedAt: string
  expiresAt?: string
}

// ============ 遊戲狀態 ============

/** 答題結果 */
export interface AnswerResult {
  questionId: string
  isCorrect: boolean
  userAnswer: string | string[]
  correctAnswer: string | string[]
  pointsEarned: number
}

/** 遊戲統計 */
export interface GameStats {
  score: number
  correctCount: number
  wrongCount: number
  maxCombo: number
  timeSpent: number
}

// ============ 用戶進度 ============

/** 類別進度 */
export interface CategoryProgress {
  categoryId: string
  completedCount: number
  totalCount: number
  bestScore: number
  lastPlayedAt?: string
}

/** 用戶遊戲歷史 */
export interface UserGameHistory {
  attempts: Attempt[]
  certifications: Certification[]
  categoryProgress: Record<string, CategoryProgress>
}

// ============ API 響應 ============

/** API 響應格式 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/** 分頁資料 */
export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
