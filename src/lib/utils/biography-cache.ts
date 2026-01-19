import { Biography, PaginationInfo } from '@/lib/types'

// ═══════════════════════════════════════════════════════════
// 快取配置
// ═══════════════════════════════════════════════════════════

export const BIOGRAPHY_CACHE_KEYS = {
  HOME: 'nobodyclimb_home_biographies',
  LIST: 'nobodyclimb_biography_list',
  ARTICLES: 'nobodyclimb_home_articles',
} as const

export const CACHE_TTL = {
  SHORT: 3 * 60 * 1000, // 3 分鐘
  MEDIUM: 5 * 60 * 1000, // 5 分鐘
} as const

// ═══════════════════════════════════════════════════════════
// 快取工具函式
// ═══════════════════════════════════════════════════════════

interface CachedBiographies {
  data: Biography[]
  timestamp: number
}

interface CachedBiographyList {
  data: Biography[]
  pagination: PaginationInfo
  timestamp: number
}

/**
 * 從 localStorage 獲取緩存數據
 */
export function getCachedData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null
    return JSON.parse(cached) as T
  } catch {
    return null
  }
}

/**
 * 緩存數據到 localStorage
 */
export function setCachedData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // 忽略緩存錯誤（localStorage 可能已滿或被禁用）
  }
}

/**
 * 檢查緩存是否過期
 */
export function isCacheExpired(key: string, ttl: number): boolean {
  if (typeof window === 'undefined') return true

  try {
    const cached = localStorage.getItem(key)
    if (!cached) return true

    const { timestamp } = JSON.parse(cached) as { timestamp: number }
    return Date.now() - timestamp > ttl
  } catch {
    return true
  }
}

// ═══════════════════════════════════════════════════════════
// 首頁人物誌快取
// ═══════════════════════════════════════════════════════════

export function getCachedHomeBiographies(): Biography[] | null {
  const cached = getCachedData<CachedBiographies>(BIOGRAPHY_CACHE_KEYS.HOME)
  return cached?.data || null
}

export function cacheHomeBiographies(data: Biography[]): void {
  const cacheData: CachedBiographies = {
    data,
    timestamp: Date.now(),
  }
  setCachedData(BIOGRAPHY_CACHE_KEYS.HOME, cacheData)
}

export function isHomeBiographiesCacheExpired(): boolean {
  return isCacheExpired(BIOGRAPHY_CACHE_KEYS.HOME, CACHE_TTL.MEDIUM)
}

// ═══════════════════════════════════════════════════════════
// 人物誌列表快取
// ═══════════════════════════════════════════════════════════

export function getCachedBiographyList(): { data: Biography[]; pagination: PaginationInfo } | null {
  const cached = getCachedData<CachedBiographyList>(BIOGRAPHY_CACHE_KEYS.LIST)
  if (!cached) return null
  return { data: cached.data, pagination: cached.pagination }
}

export function cacheBiographyList(data: Biography[], pagination: PaginationInfo): void {
  const cacheData: CachedBiographyList = {
    data,
    pagination,
    timestamp: Date.now(),
  }
  setCachedData(BIOGRAPHY_CACHE_KEYS.LIST, cacheData)
}

export function isBiographyListCacheExpired(): boolean {
  return isCacheExpired(BIOGRAPHY_CACHE_KEYS.LIST, CACHE_TTL.SHORT)
}

// ═══════════════════════════════════════════════════════════
// 一句話問題選擇
// ═══════════════════════════════════════════════════════════

/** 問題 ID 對應的顯示文字 */
export const ONE_LINER_QUESTIONS: Record<string, string> = {
  climbing_origin: '你與攀岩的相遇',
  climbing_meaning: '攀岩對你來說是什麼？',
  advice_to_self: '給剛開始攀岩的自己',
  best_moment: '爬岩最爽的是？',
  favorite_place: '最喜歡在哪裡爬？',
  current_goal: '目前的攀岩目標',
  climbing_style_desc: '你的攀岩風格',
}

/** 故事問題 ID 對應的顯示文字 */
export const STORY_QUESTIONS: Record<string, string> = {
  climbing_origin_story: '你與攀岩的故事',
  memorable_route: '最難忘的一條路線',
  climbing_philosophy: '攀岩教會你的事',
  community_story: '岩友之間的故事',
  injury_recovery: '受傷與復原的經歷',
}

/** 卡片故事內容截斷長度 */
const CARD_STORY_MAX_LENGTH = 100

/** 卡片顯示的優先問題順序 */
const CARD_QUESTION_PRIORITY = [
  'climbing_meaning',
  'climbing_origin',
  'advice_to_self',
  'best_moment',
  'favorite_place',
]

interface OneLinerData {
  answer: string
  visibility?: string
}

interface OneLinersData {
  [key: string]: OneLinerData | undefined
}

interface StoryData {
  content: string
  visibility?: string
}

interface StoriesData {
  [key: string]: StoryData | undefined
}

export interface SelectedCardContent {
  question: string
  answer: string
  questionId: string
}

/**
 * 從 one_liners_data 和 stories_data 中隨機選擇一個問題
 * 避免與已使用的問題重複
 * @param usedQuestionIds - 已使用的問題 ID 集合，用於避免卡片間重複
 */
export function selectCardContent(
  id: string,
  oneLinersJson: string | null | undefined,
  storiesJson: string | null | undefined,
  usedQuestionIds: Set<string> = new Set(),
  fallbackMeaning?: string | null
): SelectedCardContent | null {
  // 解析 one_liners_data
  let oneLiners: OneLinersData | null = null
  if (oneLinersJson) {
    try {
      oneLiners = JSON.parse(oneLinersJson) as OneLinersData
    } catch {
      oneLiners = null
    }
  }

  // 解析 stories_data
  let stories: StoriesData | null = null
  if (storiesJson) {
    try {
      stories = JSON.parse(storiesJson) as StoriesData
    } catch {
      stories = null
    }
  }

  // 收集所有有回答的問題（排除已使用的）
  const availableContent: { key: string; question: string; answer: string }[] = []

  // 從 one_liners 收集
  for (const key of CARD_QUESTION_PRIORITY) {
    if (usedQuestionIds.has(key)) continue
    const data = oneLiners?.[key]
    if (data?.answer && data.answer.trim()) {
      availableContent.push({
        key,
        question: ONE_LINER_QUESTIONS[key] || '攀岩對你來說是什麼？',
        answer: data.answer,
      })
    }
  }

  // 從 stories 收集（截取指定長度）
  if (stories) {
    for (const [key, data] of Object.entries(stories)) {
      if (usedQuestionIds.has(key)) continue
      if (data?.content && data.content.trim()) {
        const truncated = data.content.length > CARD_STORY_MAX_LENGTH
          ? data.content.slice(0, CARD_STORY_MAX_LENGTH) + '...'
          : data.content
        availableContent.push({
          key,
          question: STORY_QUESTIONS[key] || '攀岩故事',
          answer: truncated,
        })
      }
    }
  }

  // 如果沒有可用內容，嘗試 fallback
  if (availableContent.length === 0) {
    if (fallbackMeaning?.trim() && !usedQuestionIds.has('climbing_meaning_fallback')) {
      return {
        question: ONE_LINER_QUESTIONS.climbing_meaning,
        answer: fallbackMeaning,
        questionId: 'climbing_meaning_fallback',
      }
    }
    return null
  }

  // 使用 ID hash 選擇，確保同一用戶顯示固定的內容
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const index = hash % availableContent.length
  const selected = availableContent[index]

  return {
    question: selected.question,
    answer: selected.answer,
    questionId: selected.key,
  }
}

// ═══════════════════════════════════════════════════════════
// 預設語錄
// ═══════════════════════════════════════════════════════════

const DEFAULT_QUOTES = [
  '正在岩壁上尋找人生的意義...',
  '手指還在長繭中，故事正在醞釀',
  '專注攀爬，無暇寫字',
  '話不多說，先爬再說',
  '故事？都刻在岩壁上了',
  '正忙著挑戰下一條路線',
  '低調的小人物，低調的攀登',
]

/**
 * 根據 ID 獲取一個固定的趣味語錄
 * 使用 ID 的字符碼總和來生成一個穩定的索引，確保同一用戶每次都顯示相同的語錄
 */
export function getDefaultQuote(id: string): string {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return DEFAULT_QUOTES[hash % DEFAULT_QUOTES.length]
}
