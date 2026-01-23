import { Biography, PaginationInfo } from '@/lib/types'
import type { StoriesDataJson } from './stories-data'

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
  // 原有欄位
  climbing_origin_story: '你與攀岩的故事',
  memorable_route: '最難忘的一條路線',
  climbing_philosophy: '攀岩教會你的事',
  community_story: '岩友之間的故事',
  injury_recovery: '受傷與復原的經歷',
  // 進階故事欄位
  memorable_moment: '最難忘的攀岩時刻',
  biggest_challenge: '最大的挑戰',
  breakthrough_story: '突破的故事',
  first_outdoor: '第一次戶外攀岩',
  first_grade: '第一次完成的難度',
  frustrating_climb: '最挫折的一次',
  fear_management: '如何面對恐懼',
  climbing_lesson: '攀岩教會我的事',
  failure_perspective: '如何看待失敗',
  flow_moment: '心流時刻',
  life_balance: '攀岩與生活的平衡',
  unexpected_gain: '意外的收穫',
  climbing_mentor: '攀岩導師',
  climbing_partner: '攀岩夥伴',
  funny_moment: '有趣的攀岩經歷',
  favorite_spot: '最愛的攀岩地點',
  advice_to_group: '給岩友的建議',
  climbing_space: '攀岩的空間',
  training_method: '訓練方式',
  effective_practice: '有效的練習',
  technique_tip: '技巧心得',
  gear_choice: '裝備選擇',
  dream_climb: '夢想中的路線',
  climbing_trip: '攀岩旅行',
  bucket_list_story: '願望清單',
  climbing_goal: '攀岩目標',
  climbing_style: '攀岩風格',
  climbing_inspiration: '攀岩的啟發',
  life_outside_climbing: '攀岩以外的生活',
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

export interface SelectedCardContent {
  question: string
  answer: string
  questionId: string
}

/**
 * 從 one_liners_data 和 stories_data 中選擇一個問題
 * 新演算法：優先顯示真實內容 > 避免重複 > 預設語錄
 * @param id - 用戶 ID，用於生成穩定的內容選擇
 * @param questionUsageCount - 問題使用次數計數器，用於追蹤和平衡問題重複
 * @param options - 配置選項（重複上限、是否允許重複等）
 */
export function selectCardContent(
  id: string,
  oneLinersJson: string | null | undefined,
  storiesJson: string | null | undefined,
  questionUsageCount: Map<string, number> = new Map(),
  options: {
    maxRepetition?: number
    allowRepetition?: boolean
  } = {}
): SelectedCardContent | null {
  const { maxRepetition = 3, allowRepetition = true } = options

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
  let stories: StoriesDataJson | null = null
  if (storiesJson) {
    try {
      stories = JSON.parse(storiesJson) as StoriesDataJson
    } catch {
      stories = null
    }
  }

  // 階段 1：收集所有可用內容（不考慮重複）
  const allAvailableContent: { key: string; question: string; answer: string }[] = []

  // 從 one_liners 收集（只顯示 public 的內容）
  const oneLinersKeys = oneLiners ? Object.keys(oneLiners) : []
  const prioritySet = new Set(CARD_QUESTION_PRIORITY)
  const orderedOneLinerKeys = [
    ...CARD_QUESTION_PRIORITY,
    ...oneLinersKeys.filter((key) => !prioritySet.has(key)).sort(),
  ]

  for (const key of orderedOneLinerKeys) {
    const data = oneLiners?.[key]
    if (data?.answer && data.answer.trim() && data.visibility === 'public') {
      allAvailableContent.push({
        key,
        question: ONE_LINER_QUESTIONS[key] || '攀岩對你來說是什麼？',
        answer: data.answer,
      })
    }
  }

  // 從 stories 收集（截取指定長度）
  // stories_data 結構: { category: { questionKey: { answer, visibility } } }
  if (stories) {
    for (const category of Object.values(stories)) {
      if (!category) continue
      for (const [key, data] of Object.entries(category)) {
        if (data?.answer && data.answer.trim() && data.visibility === 'public') {
          const truncated = data.answer.length > CARD_STORY_MAX_LENGTH
            ? data.answer.slice(0, CARD_STORY_MAX_LENGTH) + '...'
            : data.answer
          allAvailableContent.push({
            key,
            question: STORY_QUESTIONS[key] || '攀岩故事',
            answer: truncated,
          })
        }
      }
    }
  }

  // 階段 2：如果沒有任何內容，使用預設語錄
  if (allAvailableContent.length === 0) {
    return null
  }

  // 階段 3：策略 1 - 優先選擇未使用的問題
  const unusedContent = allAvailableContent.filter(
    item => !questionUsageCount.has(item.key)
  )

  if (unusedContent.length > 0) {
    return selectByHash(id, unusedContent)
  }

  // 階段 4：策略 2 - 所有問題都被使用過，允許重複但選擇使用次數最少的
  if (allowRepetition) {
    const availableContent = maxRepetition > 0
      ? allAvailableContent.filter(
        item => (questionUsageCount.get(item.key) || 0) < maxRepetition
      )
      : allAvailableContent

    // 找出最小使用次數（僅針對可用內容）
    const usageCounts = availableContent.map(
      item => questionUsageCount.get(item.key) || 0
    )
    const minUsage = Math.min(...usageCounts)

    // 過濾出使用次數最少的內容
    const leastUsedContent = availableContent.filter(
      item => (questionUsageCount.get(item.key) || 0) === minUsage
    )

    if (leastUsedContent.length > 0) {
      return selectByHash(id, leastUsedContent)
    }

    // 如果所有問題都達上限，但仍有內容 - 優先顯示真實內容
    if (allAvailableContent.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`所有問題都達重複上限，但仍顯示內容 (user: ${id})`)
      }
      return selectByHash(id, allAvailableContent)
    }
  }

  // 階段 5：最後才使用預設語錄
  return null
}

/**
 * 使用 ID hash 選擇固定內容
 * 確保同一用戶每次都顯示相同的內容
 */
function selectByHash(
  id: string,
  content: { key: string; question: string; answer: string }[]
): SelectedCardContent {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const index = hash % content.length
  const selected = content[index]

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
