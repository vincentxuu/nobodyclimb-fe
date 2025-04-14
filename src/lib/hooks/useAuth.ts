'use client'

import { useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'

/**
 * 認證 Hook
 * 提供登入、註冊、登出等認證功能
 */
export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    updateUser: storeUpdateUser,
    loginWithGoogle: storeLoginWithGoogle,
    clearError: storeClearError,
  } = useAuthStore()
  
  const router = useRouter()
  
  /**
   * 登入
   * @param {string} email - 用戶電子郵件
   * @param {string} password - 用戶密碼
   * @returns {Promise<{ success: boolean, error?: string }>} 登入結果
   */
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        await storeLogin(email, password)
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '登入失敗',
        }
      }
    },
    [storeLogin]
  )
  
  /**
   * 使用 Google 登入
   * @returns {Promise<{ success: boolean, error?: string }>} 登入結果
   */
  const loginWithGoogle = useCallback(async () => {
    try {
      // 這裡需要處理 Google 登入流程
      // 在實際應用中，這可能包括打開一個 Google OAuth 窗口
      // 然後處理回調並將令牌發送到後端
      
      // 模擬 Google 登入成功後獲取的令牌
      const mockGoogleToken = 'google-auth-token-' + Date.now()
      
      await storeLoginWithGoogle(mockGoogleToken)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google 登入失敗',
      }
    }
  }, [storeLoginWithGoogle])
  
  /**
   * 註冊
   * @param {string} username - 用戶名
   * @param {string} email - 電子郵件
   * @param {string} password - 密碼
   * @returns {Promise<{ success: boolean, error?: string }>} 註冊結果
   */
  const register = useCallback(
    async (username: string, email: string, password: string) => {
      try {
        await storeRegister(username, email, password)
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '註冊失敗',
        }
      }
    },
    [storeRegister]
  )
  
  /**
   * 登出
   * @param {boolean} redirect - 是否重定向到登入頁面
   */
  const logout = useCallback(
    async (redirect = true) => {
      await storeLogout()
      if (redirect) {
        router.push(ROUTES.LOGIN)
      }
    },
    [storeLogout, router]
  )
  
  /**
   * 更新用戶資料
   * @param {Partial<User>} userData - 要更新的用戶資料
   * @returns {Promise<{ success: boolean, error?: string }>} 更新結果
   */
  const updateUser = useCallback(
    async (userData: any) => {
      try {
        await storeUpdateUser(userData)
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '更新資料失敗',
        }
      }
    },
    [storeUpdateUser]
  )
  
  /**
   * 清除錯誤
   */
  const clearError = useCallback(() => {
    storeClearError()
  }, [storeClearError])
  
  return {
    user,
    token,
    isAuthenticated,
    loading: isLoading,
    error,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser,
    clearError,
  }
}
