/**
 * 共用的認證 Store 工廠函數
 *
 * 平台無關的認證狀態管理，透過依賴注入支援 Web 和 App
 *
 * 設計參考：https://starter.obytes.com/guides/authentication/
 */

import { create } from 'zustand'
import type {
  User,
  BackendUser,
  ApiResponse,
  AuthTokenResponse,
  RefreshTokenResponse,
} from '@nobodyclimb/types'
import { mapBackendUserToUser } from '@nobodyclimb/types'
import type { TokenStorage } from '@nobodyclimb/api-client'

// ============================================
// Types
// ============================================

export type AuthStatus = 'idle' | 'signIn' | 'signOut'

export interface AuthStoreState {
  /** 認證狀態 */
  status: AuthStatus
  /** 當前用戶 */
  user: User | null
  /** 是否載入中 */
  isLoading: boolean
  /** 錯誤訊息 */
  error: string | null
}

export interface AuthStoreActions {
  /** 登入 */
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  /** Google 登入 */
  signInWithGoogle: (credential: string, referralSource?: string) => Promise<{ isNewUser: boolean }>
  /** 註冊 */
  signUp: (username: string, email: string, password: string, referralSource?: string) => Promise<{ success: boolean; error?: string }>
  /** 登出 */
  signOut: () => Promise<void>
  /** 更新用戶資料 */
  updateUser: (userData: UpdateUserData) => Promise<{ success: boolean; error?: string }>
  /** 從儲存恢復認證狀態（App 啟動時調用） */
  hydrate: () => Promise<void>
  /** 清除錯誤 */
  clearError: () => void
}

export type AuthStore = AuthStoreState & AuthStoreActions

export interface UpdateUserData {
  displayName?: string
  bio?: string
  avatar?: string
}

export interface CreateAuthStoreConfig {
  /** API 基礎 URL */
  apiBaseUrl: string
  /** Token 儲存實作 */
  tokenStorage: TokenStorage
  /** 認證錯誤回調（如重定向到登入頁） */
  onAuthError?: () => void
}

// ============================================
// Helpers
// ============================================

function extractErrorMessage(error: any, defaultMessage: string): string {
  if (error?.response?.data) {
    const data = error.response.data
    return data.message || data.error || `${defaultMessage} (${error.response.status})`
  }
  if (error instanceof Error) {
    return error.message
  }
  return defaultMessage
}

// ============================================
// Factory Function
// ============================================

/**
 * 建立認證 Store
 *
 * @example
 * // Web (在 store/authStore.ts)
 * import { createAuthStore } from '@nobodyclimb/hooks'
 * import { webTokenStorage } from '@/lib/tokenStorage'
 *
 * export const useAuthStore = createAuthStore({
 *   apiBaseUrl: 'https://api.nobodyclimb.cc/api/v1',
 *   tokenStorage: webTokenStorage,
 *   onAuthError: () => router.push('/auth/login'),
 * })
 *
 * // App (在 store/authStore.ts)
 * import { createAuthStore } from '@nobodyclimb/hooks'
 * import { tokenStorage } from '@/lib/api-client'
 *
 * export const useAuthStore = createAuthStore({
 *   apiBaseUrl: 'https://api.nobodyclimb.cc/api/v1',
 *   tokenStorage: tokenStorage,
 *   onAuthError: () => router.replace('/auth/login'),
 * })
 */
export function createAuthStore(config: CreateAuthStoreConfig) {
  const { apiBaseUrl, tokenStorage, onAuthError } = config

  // 動態 import axios（避免 SSR 問題）
  const getAxios = async () => {
    const axios = (await import('axios')).default
    return axios
  }

  return create<AuthStore>()((set, get) => ({
    // Initial State
    status: 'idle',
    user: null,
    isLoading: false,
    error: null,

    // Actions
    signIn: async (email, password) => {
      set({ isLoading: true, error: null })

      try {
        const axios = await getAxios()

        // Step 1: 呼叫登入 API
        const loginResponse = await axios.post<ApiResponse<AuthTokenResponse>>(
          `${apiBaseUrl}/auth/login`,
          { email, password }
        )

        if (!loginResponse.data.success || !loginResponse.data.data) {
          throw new Error(loginResponse.data.message || '登入失敗')
        }

        const { access_token, refresh_token } = loginResponse.data.data

        // Step 2: 儲存 tokens
        tokenStorage.setTokens(access_token, refresh_token)

        // Step 3: 取得用戶資料
        const userResponse = await axios.get<ApiResponse<BackendUser>>(
          `${apiBaseUrl}/auth/me`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        )

        if (!userResponse.data.success || !userResponse.data.data) {
          throw new Error('無法取得用戶資料')
        }

        const user = mapBackendUserToUser(userResponse.data.data)

        set({
          status: 'signIn',
          user,
          isLoading: false,
          error: null,
        })

        return { success: true }
      } catch (error: any) {
        const errorMessage = extractErrorMessage(error, '登入失敗')
        set({ error: errorMessage, isLoading: false })
        return { success: false, error: errorMessage }
      }
    },

    signInWithGoogle: async (credential, referralSource) => {
      set({ isLoading: true, error: null })

      try {
        const axios = await getAxios()

        const loginResponse = await axios.post<ApiResponse<AuthTokenResponse>>(
          `${apiBaseUrl}/auth/google`,
          {
            credential,
            ...(referralSource && { referral_source: referralSource }),
          }
        )

        if (!loginResponse.data.success || !loginResponse.data.data) {
          throw new Error(loginResponse.data.message || 'Google 登入失敗')
        }

        const { access_token, refresh_token, is_new_user } = loginResponse.data.data

        tokenStorage.setTokens(access_token, refresh_token)

        const userResponse = await axios.get<ApiResponse<BackendUser>>(
          `${apiBaseUrl}/auth/me`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        )

        if (!userResponse.data.success || !userResponse.data.data) {
          throw new Error('無法取得用戶資料')
        }

        const user = mapBackendUserToUser(userResponse.data.data)

        set({
          status: 'signIn',
          user,
          isLoading: false,
          error: null,
        })

        return { isNewUser: is_new_user ?? false }
      } catch (error: any) {
        const errorMessage = extractErrorMessage(error, 'Google 登入失敗')
        set({ error: errorMessage, isLoading: false })
        throw new Error(errorMessage)
      }
    },

    signUp: async (username, email, password, referralSource) => {
      set({ isLoading: true, error: null })

      try {
        const axios = await getAxios()

        const registerResponse = await axios.post<ApiResponse<AuthTokenResponse>>(
          `${apiBaseUrl}/auth/register`,
          {
            username,
            email,
            password,
            ...(referralSource && { referral_source: referralSource }),
          }
        )

        if (!registerResponse.data.success || !registerResponse.data.data) {
          throw new Error(registerResponse.data.message || '註冊失敗')
        }

        const { access_token, refresh_token } = registerResponse.data.data

        tokenStorage.setTokens(access_token, refresh_token)

        const userResponse = await axios.get<ApiResponse<BackendUser>>(
          `${apiBaseUrl}/auth/me`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        )

        if (!userResponse.data.success || !userResponse.data.data) {
          throw new Error('無法取得用戶資料')
        }

        const user = mapBackendUserToUser(userResponse.data.data)

        set({
          status: 'signIn',
          user,
          isLoading: false,
        })

        return { success: true }
      } catch (error: any) {
        const errorMessage = extractErrorMessage(error, '註冊失敗')
        set({ error: errorMessage, isLoading: false })
        return { success: false, error: errorMessage }
      }
    },

    signOut: async () => {
      const axios = await getAxios()
      const token = tokenStorage.getAccessToken()

      try {
        if (token) {
          await axios.post(
            `${apiBaseUrl}/auth/logout`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
        }
      } catch (error) {
        console.error('登出通知後端失敗:', error)
      } finally {
        tokenStorage.removeTokens()
        set({
          status: 'signOut',
          user: null,
        })
      }
    },

    updateUser: async (userData) => {
      set({ isLoading: true, error: null })

      try {
        const axios = await getAxios()
        const token = tokenStorage.getAccessToken()

        const updateData: Record<string, unknown> = {}
        if (userData.displayName !== undefined) updateData.display_name = userData.displayName
        if (userData.bio !== undefined) updateData.bio = userData.bio
        if (userData.avatar !== undefined) updateData.avatar_url = userData.avatar

        const response = await axios.put<ApiResponse<BackendUser>>(
          `${apiBaseUrl}/auth/profile`,
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (!response.data.success || !response.data.data) {
          const errorMessage = response.data.message || '更新資料失敗'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }

        const user = mapBackendUserToUser(response.data.data)

        set({ user, isLoading: false, error: null })
        return { success: true }
      } catch (error: any) {
        const errorMessage = extractErrorMessage(error, '更新失敗')
        set({ error: errorMessage, isLoading: false })
        return { success: false, error: errorMessage }
      }
    },

    hydrate: async () => {
      try {
        const token = tokenStorage.getAccessToken()

        if (!token) {
          set({ status: 'signOut' })
          return
        }

        const axios = await getAxios()

        // 嘗試用現有 token 取得用戶資料
        const userResponse = await axios.get<ApiResponse<BackendUser>>(
          `${apiBaseUrl}/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (userResponse.data.success && userResponse.data.data) {
          const user = mapBackendUserToUser(userResponse.data.data)
          set({ status: 'signIn', user })
        } else {
          // Token 無效，嘗試刷新
          const refreshToken = tokenStorage.getRefreshToken()
          if (refreshToken) {
            const refreshResponse = await axios.post<ApiResponse<RefreshTokenResponse>>(
              `${apiBaseUrl}/auth/refresh-token`,
              { refresh_token: refreshToken }
            )

            if (refreshResponse.data.success && refreshResponse.data.data) {
              const { access_token } = refreshResponse.data.data
              tokenStorage.setAccessToken(access_token)

              // 重新取得用戶資料
              const retryResponse = await axios.get<ApiResponse<BackendUser>>(
                `${apiBaseUrl}/auth/me`,
                { headers: { Authorization: `Bearer ${access_token}` } }
              )

              if (retryResponse.data.success && retryResponse.data.data) {
                const user = mapBackendUserToUser(retryResponse.data.data)
                set({ status: 'signIn', user })
                return
              }
            }
          }

          // 刷新失敗，清除狀態
          tokenStorage.removeTokens()
          set({ status: 'signOut' })
          onAuthError?.()
        }
      } catch (error) {
        // 發生錯誤，視為登出狀態
        tokenStorage.removeTokens()
        set({ status: 'signOut' })
      }
    },

    clearError: () => set({ error: null }),
  }))
}
