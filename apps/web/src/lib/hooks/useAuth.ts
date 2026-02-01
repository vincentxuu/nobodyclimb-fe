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
        const result = await storeLogin(email, password)
        return result
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
   * @param {string} credential - Google OAuth credential (ID token)
   * @returns {Promise<{ success: boolean, isNewUser?: boolean, error?: string }>} 登入結果
   */
  const loginWithGoogle = useCallback(async (credential: string) => {
    try {
      const result = await storeLoginWithGoogle(credential)
      return { success: true, isNewUser: result.isNewUser }
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
      const result = await storeRegister(username, email, password)
      return result
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
      const result = await storeUpdateUser(userData)
      return result
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
