/**
 * App 認證 Store
 *
 * 使用共用套件 @nobodyclimb/hooks 的 createAuthStore
 */
import { createAuthStore } from '@nobodyclimb/hooks'
import { tokenStorage } from '@/lib/tokenStorage'
import { router } from 'expo-router'

// API 基礎 URL
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://api.nobodyclimb.cc/api/v1'

// 重新導出 tokenStorage 供其他模組使用
export { tokenStorage }

// 建立認證 Store
export const useAuthStore = createAuthStore({
  apiBaseUrl: API_BASE_URL,
  tokenStorage,
  onAuthError: () => {
    // 認證錯誤時導向登入頁面
    router.replace('/auth/login')
  },
})
