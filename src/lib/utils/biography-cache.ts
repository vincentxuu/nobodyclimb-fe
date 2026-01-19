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
// 預設語錄
// ═══════════════════════════════════════════════════════════

const DEFAULT_QUOTES = [
  '正在岩壁上尋找人生的意義...',
  '手指還在長繭中，故事正在醞釀',
  '專注攀爬，無暇寫字',
  '話不多說，先爬再說',
  '故事？都刻在岩壁上了',
  '正忙著挑戰下一條路線',
  '沉默的攀岩者，響亮的 send',
  '低調的小人物，高調的攀登',
]

/**
 * 根據 ID 獲取一個固定的趣味語錄
 * 使用 ID 的字符碼總和來生成一個穩定的索引，確保同一用戶每次都顯示相同的語錄
 */
export function getDefaultQuote(id: string): string {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return DEFAULT_QUOTES[hash % DEFAULT_QUOTES.length]
}
