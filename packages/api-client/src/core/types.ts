/**
 * API Client 核心類型定義
 */

import type { ApiResponse, RefreshTokenResponse } from '@nobodyclimb/types'

/**
 * Token 儲存介面
 * 不同平台（Web、Native）實作不同的 Token 儲存方式
 */
export interface TokenStorage {
  getAccessToken(): string | undefined
  setAccessToken(token: string, days?: number): void
  getRefreshToken(): string | undefined
  setRefreshToken(token: string, days?: number): void
  removeTokens(): void
  setTokens(accessToken: string, refreshToken: string, accessDays?: number, refreshDays?: number): void
}

/**
 * API Client 配置
 */
export interface ApiClientConfig {
  /** API 基礎 URL */
  baseURL: string
  /** 超時時間（毫秒） */
  timeout?: number
  /** Token 儲存實作 */
  tokenStorage: TokenStorage
  /** 最大重試次數 */
  maxRetries?: number
  /** 基礎重試延遲（毫秒） */
  retryDelay?: number
  /** 可重試的 HTTP 狀態碼 */
  retryableStatuses?: number[]
  /** Token 刷新失敗時的回調 */
  onAuthError?: () => void
}

/**
 * 重試配置
 */
export interface RetryConfig {
  maxRetries: number
  retryDelay: number
  retryableStatuses: number[]
}

/**
 * 擴展的 Axios 請求配置
 */
export interface ExtendedRequestConfig {
  _retry?: boolean
  _retryCount?: number
}

export type { ApiResponse, RefreshTokenResponse }
