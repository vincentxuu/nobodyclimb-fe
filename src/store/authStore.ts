import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import apiClient from '@/lib/api/client'
import {
  User,
  ApiResponse,
  AuthTokenResponse,
  RefreshTokenResponse,
  BackendUser,
  mapBackendUserToUser,
} from '@/lib/types'
import Cookies from 'js-cookie'
import { API_BASE_URL, AUTH_TOKEN_KEY, AUTH_REFRESH_TOKEN_KEY } from '@/lib/constants'

interface UpdateUserData {
  id?: string
  username?: string
  email?: string
  avatar?: File | string
  avatarStyle?: string
  bio?: string
  displayName?: string
  climbingStartYear?: string
  frequentGym?: string
  favoriteRouteType?: string
  socialLinks?: {
    instagram?: string
    facebook?: string
    twitter?: string
    website?: string
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // 動作
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: (token: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateUser: (userData: UpdateUserData) => Promise<{ success: boolean; error?: string }>
  refreshToken: () => Promise<boolean>
  clearError: () => void
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })

        try {
          // Step 1: 呼叫登入 API 取得 tokens
          const loginResponse = await axios.post<ApiResponse<AuthTokenResponse>>(
            `${API_BASE_URL}/auth/login`,
            { email, password }
          )

          if (!loginResponse.data.success || !loginResponse.data.data) {
            throw new Error(loginResponse.data.message || '登入失敗')
          }

          const { access_token, refresh_token } = loginResponse.data.data

          // Step 2: 儲存 tokens 到 Cookie
          // access_token: 15 分鐘 (expires_in 是秒數，這裡用 1 天作為 cookie 過期時間，實際驗證由 JWT 控制)
          Cookies.set(AUTH_TOKEN_KEY, access_token, { expires: 1 })
          // refresh_token: 7 天
          Cookies.set(AUTH_REFRESH_TOKEN_KEY, refresh_token, { expires: 7 })

          // Step 3: 使用 access_token 取得用戶資料
          const userResponse = await axios.get<ApiResponse<BackendUser>>(
            `${API_BASE_URL}/auth/me`,
            { headers: { Authorization: `Bearer ${access_token}` } }
          )

          if (!userResponse.data.success || !userResponse.data.data) {
            throw new Error('無法取得用戶資料')
          }

          // Step 4: 轉換後端 User 格式為前端格式
          const user = mapBackendUserToUser(userResponse.data.data)

          // Step 5: 更新狀態
          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          return { success: true }
        } catch (error) {
          // 處理錯誤 - 優先顯示後端回傳的錯誤訊息
          let errorMessage = '登入過程中發生錯誤'

          if (axios.isAxiosError(error)) {
            const data = error.response?.data
            // 後端格式: { success: false, error: "...", message: "..." }
            errorMessage = data?.message || data?.error || `登入失敗 (${error.response?.status || 'Network Error'})`
          } else if (error instanceof Error) {
            errorMessage = error.message
          }

          set({
            error: errorMessage,
            isLoading: false,
          })

          return { success: false, error: errorMessage }
        }
      },

      loginWithGoogle: async (token) => {
        set({ isLoading: true, error: null })
        try {
          // 向後端 API 發送 Google 令牌
          const response = await axios.post(`${API_BASE_URL}/auth/google`, { token })

          // 從回應中獲取用戶信息和 Token
          const { user, token: authToken } = response.data

          // 設置 Cookie (如果後端沒有自動設置)
          Cookies.set(AUTH_TOKEN_KEY, authToken, { expires: 7 })

          // 更新狀態
          set({
            user,
            token: authToken,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          // 處理錯誤
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.message || 'Google 登入失敗'
            : 'Google 登入過程中發生錯誤'

          set({
            error: errorMessage,
            isLoading: false,
          })

          throw new Error(errorMessage)
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true, error: null })
        try {
          // Step 1: 呼叫註冊 API 取得 tokens
          const registerResponse = await axios.post<ApiResponse<AuthTokenResponse>>(
            `${API_BASE_URL}/auth/register`,
            { username, email, password }
          )

          if (!registerResponse.data.success || !registerResponse.data.data) {
            throw new Error(registerResponse.data.message || '註冊失敗')
          }

          const { access_token, refresh_token } = registerResponse.data.data

          // Step 2: 儲存 tokens 到 Cookie
          Cookies.set(AUTH_TOKEN_KEY, access_token, { expires: 1 })
          Cookies.set(AUTH_REFRESH_TOKEN_KEY, refresh_token, { expires: 7 })

          // Step 3: 使用 access_token 取得用戶資料
          const userResponse = await axios.get<ApiResponse<BackendUser>>(
            `${API_BASE_URL}/auth/me`,
            { headers: { Authorization: `Bearer ${access_token}` } }
          )

          if (!userResponse.data.success || !userResponse.data.data) {
            throw new Error('無法取得用戶資料')
          }

          // Step 4: 轉換後端 User 格式為前端格式
          const user = mapBackendUserToUser(userResponse.data.data)

          // Step 5: 更新狀態
          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          })

          return { success: true }
        } catch (error) {
          // 處理錯誤 - 優先顯示後端回傳的錯誤訊息
          let errorMessage = '註冊過程中發生錯誤'

          if (axios.isAxiosError(error)) {
            const data = error.response?.data
            // 後端格式: { success: false, error: "...", message: "..." }
            errorMessage = data?.message || data?.error || `註冊失敗 (${error.response?.status || 'Network Error'})`
          } else if (error instanceof Error) {
            errorMessage = error.message
          }

          set({
            error: errorMessage,
            isLoading: false,
          })

          return { success: false, error: errorMessage }
        }
      },

      logout: async () => {
        try {
          // 通知後端登出 (可選)
          await axios.post(
            `${API_BASE_URL}/auth/logout`,
            {},
            {
              headers: {
                Authorization: `Bearer ${get().token}`,
              },
            }
          )
        } catch (error) {
          console.error('登出通知後端失敗:', error)
        } finally {
          // 無論後端請求成功與否，都清除本地狀態
          Cookies.remove(AUTH_TOKEN_KEY)
          Cookies.remove(AUTH_REFRESH_TOKEN_KEY)

          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })
        }
      },

      updateUser: async (userData: UpdateUserData) => {
        set({ isLoading: true, error: null })
        try {
          // 準備更新資料 (轉換為後端格式)
          const updateData: Record<string, unknown> = {}
          if (userData.displayName !== undefined) updateData.display_name = userData.displayName
          if (userData.bio !== undefined) updateData.bio = userData.bio
          if (userData.avatar && typeof userData.avatar === 'string') {
            updateData.avatar_url = userData.avatar
          }
          if (userData.climbingStartYear !== undefined) updateData.climbing_start_year = userData.climbingStartYear
          if (userData.frequentGym !== undefined) updateData.frequent_gym = userData.frequentGym
          if (userData.favoriteRouteType !== undefined) updateData.favorite_route_type = userData.favoriteRouteType

          // 使用 apiClient 以支援自動 token 刷新
          const response = await apiClient.put<ApiResponse<BackendUser>>(
            '/auth/profile',
            updateData
          )

          if (!response.data.success || !response.data.data) {
            const errorMessage = response.data.message || '更新資料失敗'
            set({
              error: errorMessage,
              isLoading: false,
            })
            return { success: false, error: errorMessage }
          }

          // 轉換後端 User 格式為前端格式
          const user = mapBackendUserToUser(response.data.data)

          // 更新狀態
          set({
            user,
            isLoading: false,
            error: null,
          })

          return { success: true }
        } catch (error) {
          // 處理錯誤 - 優先顯示後端回傳的錯誤訊息
          let errorMessage = '更新資料過程中發生錯誤'

          if (axios.isAxiosError(error)) {
            const data = error.response?.data
            // 後端格式: { success: false, error: "...", message: "..." }
            errorMessage = data?.message || data?.error || `更新失敗 (${error.response?.status || 'Network Error'})`
          } else if (error instanceof Error) {
            errorMessage = error.message
          }

          set({
            error: errorMessage,
            isLoading: false,
          })

          return { success: false, error: errorMessage }
        }
      },

      refreshToken: async () => {
        try {
          // 從 Cookie 取得 refresh_token
          const refreshToken = Cookies.get(AUTH_REFRESH_TOKEN_KEY)

          if (!refreshToken) {
            throw new Error('No refresh token available')
          }

          // 向後端 API 請求刷新 Token
          const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
            `${API_BASE_URL}/auth/refresh-token`,
            { refresh_token: refreshToken }
          )

          if (!response.data.success || !response.data.data) {
            throw new Error('Token refresh failed')
          }

          const { access_token } = response.data.data

          // 設置新的 access_token Cookie
          Cookies.set(AUTH_TOKEN_KEY, access_token, { expires: 1 })

          // 取得最新的用戶資料
          const userResponse = await axios.get<ApiResponse<BackendUser>>(
            `${API_BASE_URL}/auth/me`,
            { headers: { Authorization: `Bearer ${access_token}` } }
          )

          let user = get().user
          if (userResponse.data.success && userResponse.data.data) {
            user = mapBackendUserToUser(userResponse.data.data)
          }

          // 更新狀態
          set({
            token: access_token,
            user,
            isAuthenticated: true,
          })

          return true
        } catch (error) {
          // Token 刷新失敗，用戶需要重新登入
          Cookies.remove(AUTH_TOKEN_KEY)
          Cookies.remove(AUTH_REFRESH_TOKEN_KEY)

          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })

          return false
        }
      },

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
        })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
