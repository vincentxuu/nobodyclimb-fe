import axios, { AxiosError } from 'axios'
import { API_BASE_URL, API_TIMEOUT } from '../constants'
import { ApiResponse, RefreshTokenResponse } from '../types'
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  removeTokens,
} from '../utils/tokenStorage'

/**
 * 重試配置
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 基礎延遲時間 (ms)
  retryableStatuses: [408, 500, 502, 503, 504, 522], // 可重試的 HTTP 狀態碼
}

/**
 * 指數退避延遲計算
 */
function getRetryDelay(retryCount: number): number {
  return RETRY_CONFIG.retryDelay * Math.pow(2, retryCount)
}

/**
 * 判斷是否應該重試
 */
function shouldRetry(error: AxiosError, retryCount: number): boolean {
  if (retryCount >= RETRY_CONFIG.maxRetries) return false

  // 網路錯誤或超時
  if (!error.response) return true

  // 可重試的狀態碼
  return RETRY_CONFIG.retryableStatuses.includes(error.response.status)
}

/**
 * 創建一個 Axios 實例用於 API 請求
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 請求攔截器
 * 在每個請求前自動添加認證 Token
 * 支援從 cookie 或 localStorage 取得 token (解決 Android WebView 問題)
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 響應攔截器
 * 處理常見錯誤情況，如 Token 過期、網路錯誤重試
 */
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean
      _retryCount?: number
    }

    if (!originalRequest) {
      return Promise.reject(error)
    }

    // 處理 401 未授權錯誤 (可能是 Token 過期)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // 從 cookie 或 localStorage 取得 refresh_token
        const refreshToken = getRefreshToken()

        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        // 嘗試刷新 Token
        const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
          `${API_BASE_URL}/auth/refresh-token`,
          { refresh_token: refreshToken }
        )

        if (!response.data.success || !response.data.data) {
          throw new Error('Token refresh failed')
        }

        const { access_token } = response.data.data

        // 保存新的 access_token (同時儲存到 cookie 和 localStorage)
        setAccessToken(access_token)

        // 使用新的 Token 重試原始請求
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // 刷新 Token 失敗，清除認證資訊 (同時清除 cookie 和 localStorage)
        removeTokens()

        // 如果在瀏覽器環境且不是請求刷新 Token 的請求
        if (typeof window !== 'undefined' && !originalRequest.url.includes('refresh-token')) {
          // 重定向到登入頁面
          window.location.href = '/auth/login'
        }

        return Promise.reject(refreshError)
      }
    }

    // 處理可重試的錯誤（503、502、超時等）
    const retryCount = originalRequest._retryCount || 0

    if (shouldRetry(error, retryCount)) {
      originalRequest._retryCount = retryCount + 1
      const delay = getRetryDelay(retryCount)

      // eslint-disable-next-line no-console
      console.info(
        `[API] 請求失敗，${delay}ms 後重試 (${originalRequest._retryCount}/${RETRY_CONFIG.maxRetries})`,
        originalRequest.url
      )

      // 等待後重試
      await new Promise((resolve) => setTimeout(resolve, delay))
      return apiClient(originalRequest)
    }

    return Promise.reject(error)
  }
)

export default apiClient
