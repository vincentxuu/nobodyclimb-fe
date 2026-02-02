/**
 * API Client
 *
 * 使用 @nobodyclimb/api-client 共用套件
 */
import { createWebApiClient } from '@nobodyclimb/api-client/web'
import { API_BASE_URL } from '../constants'

/**
 * 創建 Web 平台的 API Client
 */
const apiClient = createWebApiClient(API_BASE_URL, () => {
  // Token 刷新失敗時的回調
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname
    const isAuthPage = currentPath.startsWith('/auth/')

    // 只有不在認證頁面時才重定向到登入頁面
    if (!isAuthPage) {
      window.location.href = '/auth/login'
    }
  }
})

export default apiClient
