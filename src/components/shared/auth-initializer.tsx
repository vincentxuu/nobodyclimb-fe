'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Cookies from 'js-cookie'
import { AUTH_TOKEN_KEY, AUTH_REFRESH_TOKEN_KEY } from '@/lib/constants'
import apiClient from '@/lib/api/client'
import { ApiResponse, BackendUser, mapBackendUserToUser } from '@/lib/types'

/**
 * 認證初始化組件
 * 在應用程序啟動時檢查使用者認證狀態
 */
export function AuthInitializer() {
  const { refreshToken, isAuthenticated, setUser } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()

  // 在組件掛載時檢查認證狀態
  useEffect(() => {
    const checkAuthStatus = async () => {
      // 檢查是否有認證 Cookie
      const accessToken = Cookies.get(AUTH_TOKEN_KEY)
      const refreshTokenValue = Cookies.get(AUTH_REFRESH_TOKEN_KEY)

      if (accessToken && !isAuthenticated) {
        try {
          // 調用 API 獲取當前用戶資訊
          const response = await apiClient.get<ApiResponse<BackendUser>>('/auth/me')

          if (response.data.success && response.data.data) {
            // 轉換後端 User 格式為前端格式
            const user = mapBackendUserToUser(response.data.data)
            setUser(user)

            // 同時更新 token 到 store
            useAuthStore.setState({ token: accessToken })
          } else {
            throw new Error('Failed to get user data')
          }
        } catch (error) {
          // API 調用失敗，嘗試刷新 Token
          if (refreshTokenValue) {
            const refreshed = await refreshToken()

            // 如果刷新失敗，且當前不是在登入頁，重定向到登入頁
            if (
              !refreshed &&
              !pathname.startsWith('/auth/login') &&
              !pathname.startsWith('/auth/register')
            ) {
              // 如果當前頁面需要授權，重定向到登入頁
              if (pathname.includes('/create') || pathname.includes('/edit')) {
                router.push('/auth/login')
              }
            }
          } else {
            // 沒有 refresh token，清除 access token
            Cookies.remove(AUTH_TOKEN_KEY)

            if (pathname.includes('/create') || pathname.includes('/edit')) {
              router.push('/auth/login')
            }
          }
        }
      } else if (!isAuthenticated && (pathname.includes('/create') || pathname.includes('/edit'))) {
        // 如果沒有 Token 且訪問受保護頁面，重定向到登入頁
        router.push('/auth/login')
      }
    }

    checkAuthStatus()
  }, [isAuthenticated, pathname, refreshToken, router, setUser])

  // 此組件不渲染任何內容
  return null
}
