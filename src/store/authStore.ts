import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import { User } from '@/lib/types'
import Cookies from 'js-cookie'
import { API_BASE_URL, AUTH_TOKEN_KEY } from '@/lib/constants'

interface UpdateUserData {
  id?: string;
  username?: string;
  email?: string;
  avatar?: File | string;
  avatarStyle?: string;
  bio?: string;
  displayName?: string;
  climbingStartYear?: string;
  frequentGym?: string;
  favoriteRouteType?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // 動作
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (token: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: UpdateUserData) => Promise<void>
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
          // 連接實際後端 API
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            password
          })
          
          // 從回應中獲取用戶信息和 Token
          const { user, token } = response.data
          
          // 設置 Cookie (如果後端沒有自動設置)
          Cookies.set(AUTH_TOKEN_KEY, token, { expires: 7 })
          
          // 更新狀態
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          // 處理錯誤
          const errorMessage = axios.isAxiosError(error) 
            ? error.response?.data?.message || '登入失敗，請檢查您的帳號密碼'
            : '登入過程中發生錯誤'
            
          set({
            error: errorMessage,
            isLoading: false,
          })
          
          throw new Error(errorMessage)
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
          // 連接實際後端 API
          const response = await axios.post(`${API_BASE_URL}/auth/register`, {
            username,
            email,
            password
          })
          
          // 從回應中獲取用戶信息和 Token
          const { user, token } = response.data
          
          // 設置 Cookie (如果後端沒有自動設置)
          Cookies.set(AUTH_TOKEN_KEY, token, { expires: 7 })
          
          // 更新狀態
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          // 處理錯誤
          const errorMessage = axios.isAxiosError(error) 
            ? error.response?.data?.message || '註冊失敗，該 Email 可能已被使用'
            : '註冊過程中發生錯誤'
            
          set({
            error: errorMessage,
            isLoading: false,
          })
          
          throw new Error(errorMessage)
        }
      },

      logout: async () => {
        try {
          // 通知後端登出 (可選)
          await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
            headers: {
              Authorization: `Bearer ${get().token}`
            }
          })
        } catch (error) {
          console.error('登出通知後端失敗:', error)
        } finally {
          // 無論後端請求成功與否，都清除本地狀態
          Cookies.remove(AUTH_TOKEN_KEY)
          
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
          // 處理檔案上傳情況
          let formData: FormData | null = null;
          let config: { headers: { 'Content-Type': string } } | undefined;
          
          if (userData.avatar && userData.avatar instanceof File) {
            formData = new FormData();
            formData.append('avatar', userData.avatar);
            config = {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            };
          }
          
          // 連接實際後端 API
          const response = await axios.put(
            `${API_BASE_URL}/auth/profile`, 
            formData,
            config
          );
          
          // 從回應中獲取更新後的用戶信息
          const { user } = response.data
          
          // 更新狀態
          set({
            user,
            isLoading: false,
          })
        } catch (error) {
          // 處理錯誤
          const errorMessage = axios.isAxiosError(error) 
            ? error.response?.data?.message || '更新資料失敗'
            : '更新資料過程中發生錯誤'
            
          set({
            error: errorMessage,
            isLoading: false,
          })
          
          throw new Error(errorMessage)
        }
      },
      
      refreshToken: async () => {
        try {
          // 向後端 API 請求刷新 Token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`)
          
          // 從回應中獲取新的 Token
          const { token, user } = response.data
          
          // 設置新的 Cookie
          Cookies.set(AUTH_TOKEN_KEY, token, { expires: 7 })
          
          // 更新狀態
          set({
            token,
            user,
            isAuthenticated: true,
          })
          
          return true
        } catch (error) {
          // Token 刷新失敗，用戶需要重新登入
          Cookies.remove(AUTH_TOKEN_KEY)
          
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
          isAuthenticated: !!user
        })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
