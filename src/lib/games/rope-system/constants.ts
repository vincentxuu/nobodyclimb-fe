/**
 * 攀岩系統練習遊戲 - 常數定義
 */

import type { Category, Difficulty } from './types'

// ============ 遊戲設定 ============

/** 遊戲初始設定 */
export const GAME_CONFIG = {
  /** 初始生命數 */
  INITIAL_LIVES: 3,
  /** 最大生命數 */
  MAX_LIVES: 5,
  /** 答對基礎分數 */
  BASE_SCORE: 100,
  /** 連擊加成（每連擊增加的分數） */
  COMBO_BONUS: 10,
  /** 最大連擊加成 */
  MAX_COMBO_BONUS: 50,
  /** 時間加成（每秒剩餘時間的分數） */
  TIME_BONUS_PER_SECOND: 5,
  /** 學習模式是否顯示解釋 */
  SHOW_EXPLANATION_IN_LEARN: true,
  /** 預設每題時間限制（秒） */
  DEFAULT_TIME_LIMIT: 30,
} as const

// ============ 動畫設定 ============

/** 動畫時間配置（毫秒） */
export const ANIMATION_DURATION = {
  /** 掉落動畫 */
  FALL: 800,
  /** 正確答案反饋 */
  CORRECT_FEEDBACK: 300,
  /** 錯誤答案反饋 */
  WRONG_FEEDBACK: 400,
  /** 分數增加動畫 */
  SCORE_UPDATE: 300,
  /** 生命值變化動畫 */
  LIFE_CHANGE: 400,
  /** 頁面轉場 */
  PAGE_TRANSITION: 300,
  /** 結果顯示延遲 */
  RESULT_DELAY: 500,
} as const

// ============ 色彩系統 ============

/** 主要色彩 */
export const COLORS = {
  PRIMARY: '#1B1A1A',
  ACCENT: '#FFE70C',
  BACKGROUND: '#F5F5F5',
  SURFACE: '#FFFFFF',
  TEXT_SECONDARY: '#535353',
  BORDER: '#E5E5E5',
} as const

/** 狀態色彩 */
export const STATUS_COLORS = {
  SUCCESS: '#22C55E',
  ERROR: '#EF4444',
  WARNING: '#F59E0B',
  INFO: '#3B82F6',
} as const

/** 難度色彩 */
export const DIFFICULTY_COLORS: Record<Difficulty, { star: string; bg: string }> = {
  1: { star: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)' },
  2: { star: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  3: { star: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
}

/** 難度標籤 */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: '入門',
  2: '進階',
  3: '困難',
}

// ============ 類別資料 ============

/** 所有題目類別 */
export const CATEGORIES: Category[] = [
  // 運動攀登
  {
    id: 'sport-belay',
    slug: 'sport-belay',
    name: '基礎確保',
    description: '學習正確的確保技術與安全觀念',
    icon: '🎯',
    parentSlug: 'sport',
    parentName: '運動攀登',
    questionCount: 15,
    difficulty: 1,
    order: 1,
  },
  {
    id: 'sport-lead',
    slug: 'sport-lead',
    name: '先鋒攀登',
    description: '掌握先鋒攀登的繩索管理與掛繩技巧',
    icon: '🧗',
    parentSlug: 'sport',
    parentName: '運動攀登',
    questionCount: 20,
    difficulty: 2,
    order: 2,
  },
  {
    id: 'sport-toprope',
    slug: 'sport-toprope',
    name: '頂繩架設',
    description: '學習頂繩系統的架設與安全確認',
    icon: '🔗',
    parentSlug: 'sport',
    parentName: '運動攀登',
    questionCount: 15,
    difficulty: 2,
    order: 3,
  },
  {
    id: 'sport-rappel',
    slug: 'sport-rappel',
    name: '垂降系統',
    description: '掌握垂降設備操作與安全程序',
    icon: '⬇️',
    parentSlug: 'sport',
    parentName: '運動攀登',
    questionCount: 15,
    difficulty: 2,
    order: 4,
  },
  // 傳統攀登
  {
    id: 'trad-anchor',
    slug: 'trad-anchor',
    name: '固定點架設',
    description: '學習多點固定系統的架設原則',
    icon: '⚓',
    parentSlug: 'trad',
    parentName: '傳統攀登',
    questionCount: 15,
    difficulty: 2,
    order: 5,
  },
  {
    id: 'trad-protection',
    slug: 'trad-protection',
    name: '保護裝備',
    description: '掌握各類保護裝備的放置技巧',
    icon: '🔩',
    parentSlug: 'trad',
    parentName: '傳統攀登',
    questionCount: 15,
    difficulty: 2,
    order: 6,
  },
  {
    id: 'trad-multipitch',
    slug: 'trad-multipitch',
    name: '多繩距系統',
    description: '學習多繩距攀登的繩索管理',
    icon: '🏔️',
    parentSlug: 'trad',
    parentName: '傳統攀登',
    questionCount: 15,
    difficulty: 3,
    order: 7,
  },
  {
    id: 'trad-rescue',
    slug: 'trad-rescue',
    name: '自我救援',
    description: '掌握基本的自我救援技術',
    icon: '🆘',
    parentSlug: 'trad',
    parentName: '傳統攀登',
    questionCount: 15,
    difficulty: 3,
    order: 8,
  },
]

/** 根據類別分組 */
export const CATEGORIES_BY_PARENT = {
  sport: CATEGORIES.filter((c) => c.parentSlug === 'sport'),
  trad: CATEGORIES.filter((c) => c.parentSlug === 'trad'),
}

/** 父類別資訊 */
export const PARENT_CATEGORIES = {
  sport: {
    slug: 'sport',
    name: '運動攀登',
    icon: '🏋️',
    description: 'Sport Climbing',
  },
  trad: {
    slug: 'trad',
    name: '傳統攀登',
    icon: '⛰️',
    description: 'Traditional Climbing',
  },
}

// ============ 音效 ID ============

/** 音效 ID 常數 */
export const SOUND_IDS = [
  'correct',
  'wrong',
  'fall',
  'impact',
  'levelUp',
  'complete',
  'gameOver',
] as const

export type SoundId = (typeof SOUND_IDS)[number]

// ============ 路由 ============

/** 遊戲相關路由 */
export const ROUTES = {
  HOME: '/games/rope-system',
  LEARN: (categoryId: string) => `/games/rope-system/learn/${categoryId}`,
  EXAM: '/games/rope-system/exam',
  EXAM_DETAIL: (examId: string) => `/games/rope-system/exam/${examId}`,
  RESULT: (attemptId: string) => `/games/rope-system/result/${attemptId}`,
  CERTIFICATE: (certId: string) => `/games/rope-system/certificate/${certId}`,
} as const

// ============ API 路徑 ============

/** API 端點 */
export const API_ENDPOINTS = {
  CATEGORIES: '/api/v1/games/rope-system/categories',
  QUESTIONS: (categoryId: string) =>
    `/api/v1/games/rope-system/categories/${categoryId}/questions`,
  EXAMS: '/api/v1/games/rope-system/exams',
  EXAM_DETAIL: (examId: string) => `/api/v1/games/rope-system/exams/${examId}`,
  START_EXAM: (examId: string) =>
    `/api/v1/games/rope-system/exams/${examId}/start`,
  SUBMIT_ATTEMPT: (attemptId: string) =>
    `/api/v1/games/rope-system/attempts/${attemptId}/submit`,
  USER_HISTORY: '/api/v1/games/rope-system/user/history',
  USER_CERTIFICATIONS: '/api/v1/games/rope-system/user/certifications',
} as const

// ============ 本地儲存 Key ============

/** LocalStorage 鍵名 */
export const STORAGE_KEYS = {
  SOUND_ENABLED: 'rope-game-sound-enabled',
  GAME_PROGRESS: 'rope-game-progress',
  CATEGORY_PROGRESS: 'rope-game-category-progress',
} as const
