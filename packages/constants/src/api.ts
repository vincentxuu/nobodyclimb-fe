/**
 * API 相關常數
 */

/**
 * 預設分頁設定
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const

/**
 * 認證相關 Key
 */
export const AUTH_KEYS = {
  ACCESS_TOKEN: 'nobodyclimb-auth-token',
  REFRESH_TOKEN: 'nobodyclimb-refresh-token',
  USER: 'nobodyclimb-auth-user',
} as const

/**
 * API 超時設定 (毫秒)
 */
export const API_TIMEOUT = 10000

/**
 * 重試配置
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000, // 基礎延遲時間 (ms)
  RETRYABLE_STATUSES: [408, 500, 502, 503, 504, 522],
} as const

/**
 * API 版本
 */
export const API_VERSION = 'v1'
