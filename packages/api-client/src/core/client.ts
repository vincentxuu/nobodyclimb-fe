/**
 * API Client 核心實作
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { API_TIMEOUT, RETRY_CONFIG } from '@nobodyclimb/constants'
import type {
  ApiClientConfig,
  ApiResponse,
  ExtendedRequestConfig,
  RefreshTokenResponse,
  RetryConfig,
} from './types'

/**
 * 指數退避延遲計算
 */
function getRetryDelay(retryCount: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, retryCount)
}

/**
 * 判斷是否應該重試
 */
function shouldRetry(
  error: AxiosError,
  retryCount: number,
  config: RetryConfig
): boolean {
  if (retryCount >= config.maxRetries) return false

  // 網路錯誤或超時
  if (!error.response) return true

  // 可重試的狀態碼
  return config.retryableStatuses.includes(error.response.status)
}

/**
 * 創建 API Client 工廠函數
 */
export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const {
    baseURL,
    timeout = API_TIMEOUT,
    tokenStorage,
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
    retryDelay = RETRY_CONFIG.BASE_DELAY,
    retryableStatuses = RETRY_CONFIG.RETRYABLE_STATUSES as unknown as number[],
    onAuthError,
  } = config

  const retryConfig: RetryConfig = {
    maxRetries,
    retryDelay,
    retryableStatuses,
  }

  // 建立 Axios 實例
  const client = axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 請求攔截器：自動添加認證 Token
  client.interceptors.request.use(
    (requestConfig) => {
      const token = tokenStorage.getAccessToken()

      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`
      }

      return requestConfig
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // 響應攔截器：處理 Token 過期、重試等
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & ExtendedRequestConfig

      if (!originalRequest) {
        return Promise.reject(error)
      }

      // 處理 401 未授權錯誤 (可能是 Token 過期)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          const refreshToken = tokenStorage.getRefreshToken()

          if (!refreshToken) {
            throw new Error('No refresh token available')
          }

          // 嘗試刷新 Token
          const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
            `${baseURL}/auth/refresh-token`,
            { refresh_token: refreshToken }
          )

          if (!response.data.success || !response.data.data) {
            throw new Error('Token refresh failed')
          }

          const { access_token } = response.data.data

          // 保存新的 access_token
          tokenStorage.setAccessToken(access_token)

          // 使用新的 Token 重試原始請求
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return client(originalRequest)
        } catch {
          // 刷新 Token 失敗
          tokenStorage.removeTokens()

          // 觸發認證錯誤回調
          if (onAuthError) {
            onAuthError()
          }

          return Promise.reject(error)
        }
      }

      // 處理可重試的錯誤（503、502、超時等）
      const retryCount = originalRequest._retryCount || 0

      if (shouldRetry(error, retryCount, retryConfig)) {
        originalRequest._retryCount = retryCount + 1
        const delay = getRetryDelay(retryCount, retryConfig.retryDelay)

        // eslint-disable-next-line no-console
        console.info(
          `[API] 請求失敗，${delay}ms 後重試 (${originalRequest._retryCount}/${retryConfig.maxRetries})`,
          originalRequest.url
        )

        // 等待後重試
        await new Promise((resolve) => setTimeout(resolve, delay))
        return client(originalRequest)
      }

      return Promise.reject(error)
    }
  )

  return client
}
