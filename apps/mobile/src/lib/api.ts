/**
 * API Client 初始化
 *
 * 使用 @nobodyclimb/api-client 建立 Native 平台的 API Client
 */
import { createApiClient } from '@nobodyclimb/api-client'
import { tokenStorage } from './tokenStorage'

// API 基礎 URL
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://api.nobodyclimb.cc/api/v1'

// 建立 API Client 實例
export const apiClient = createApiClient({
  baseURL: API_BASE_URL,
  tokenStorage,
  onAuthError: () => {
    // 認證錯誤時清除 token
    // 實際的導航邏輯應該在 authStore 中處理
    console.warn('[API] 認證已過期，請重新登入')
  },
})

// 導出便捷方法
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
}

export default apiClient
