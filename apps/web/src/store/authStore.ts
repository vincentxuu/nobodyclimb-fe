/**
 * Web 認證 Store
 *
 * 使用 @nobodyclimb/hooks 的 createAuthStore
 */
import { createAuthStore, type AuthStore } from '@nobodyclimb/hooks'
import { createWebTokenStorage } from '@nobodyclimb/api-client/web'
import { API_BASE_URL } from '@/lib/constants'

// 建立 Token Storage
const tokenStorage = createWebTokenStorage()

// 建立認證 Store
export const useAuthStore = createAuthStore({
  apiBaseUrl: API_BASE_URL,
  tokenStorage,
  onAuthError: () => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      const isAuthPage = currentPath.startsWith('/auth/')
      if (!isAuthPage) {
        window.location.href = '/auth/login'
      }
    }
  },
})

// 導出類型和 tokenStorage 供其他模組使用
export type { AuthStore }
export { tokenStorage }
