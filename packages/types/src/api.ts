/**
 * API 相關類型定義
 */

/**
 * API 回應介面
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * 分頁資訊介面 (後端 snake_case)
 */
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  total_pages: number
}

/**
 * 後端分頁回應介面 (snake_case)
 */
export interface BackendPaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: PaginationInfo
}

/**
 * 前端分頁回應介面 (camelCase)
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasMore?: boolean
  }
}

/**
 * 搜尋參數介面
 */
export interface SearchParams {
  query: string
  type?: 'all' | 'post' | 'gym' | 'gallery' | 'user'
  tags?: string[]
  facilities?: string[]
  sortBy?: 'date' | 'popularity' | 'latest' | 'popular' | 'rating'
  page?: number
  limit?: number
}
