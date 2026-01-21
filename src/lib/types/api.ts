/**
 * API 相關類型定義
 */

import type { BackendPost } from './content'

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
 * 分頁回應介面
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
 * 後端分頁資訊介面 (snake_case)
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
  data: T[]
  pagination: PaginationInfo
}

/**
 * 後端文章分頁回應介面
 * 後端實際返回 { success, data: [...], pagination: {...} }
 */
export interface BackendPostPaginatedResponse {
  success: boolean
  data: BackendPost[]
  pagination: PaginationInfo
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
