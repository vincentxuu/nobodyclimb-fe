'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import Cookies from 'js-cookie'
import { AUTH_TOKEN_KEY, AUTH_REFRESH_TOKEN_KEY } from '@/lib/constants'
import apiClient from '@/lib/api/client'
import { ApiResponse, BackendUser, mapBackendUserToUser } from '@/lib/types'
import { storyPromptService } from '@/lib/api/services'
import { toast } from '@/components/ui/use-toast'

/** 故事推薦彈窗顯示延遲時間（毫秒） */
const STORY_PROMPT_SHOW_DELAY = 1500

/** 建立人物誌提示的 localStorage key */
const BIOGRAPHY_PROMPT_KEY = 'nobodyclimb_biography_prompt_shown'

/**
 * 認證初始化組件
 * 在應用程序啟動時檢查使用者認證狀態
 */
export function AuthInitializer() {
  const { refreshToken, isAuthenticated, setUser } = useAuthStore()
  const { openStoryPrompt } = useUIStore()
  const pathname = usePathname()
  const router = useRouter()
  // 追蹤是否已經檢查過故事推薦
  const hasCheckedStoryPrompt = useRef(false)

  // 檢查是否應該顯示故事推薦彈窗
  const checkStoryPrompt = useCallback(async () => {
    // 避免重複檢查
    if (hasCheckedStoryPrompt.current) return
    hasCheckedStoryPrompt.current = true

    try {
      const response = await storyPromptService.shouldPrompt()
      if (response.success && response.data?.should_prompt) {
        // 延遲一點顯示彈窗，讓用戶先看到頁面
        setTimeout(() => {
          openStoryPrompt()
        }, STORY_PROMPT_SHOW_DELAY)
      } else if (response.success && response.data?.reason === 'no_biography') {
        // 用戶沒有建立人物誌，顯示提示鼓勵建立
        // 檢查是否已經顯示過（每次 session 只顯示一次）
        const hasShown = sessionStorage.getItem(BIOGRAPHY_PROMPT_KEY)
        if (!hasShown) {
          sessionStorage.setItem(BIOGRAPHY_PROMPT_KEY, 'true')
          setTimeout(() => {
            toast({
              title: '歡迎加入 NobodyClimb！',
              description: '建立你的人物誌，讓更多岩友認識你吧！',
            })
          }, STORY_PROMPT_SHOW_DELAY)
        }
      }
    } catch (error) {
      console.error('檢查故事推薦失敗:', error)
    }
  }, [openStoryPrompt])

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

            // 認證成功後檢查故事推薦
            checkStoryPrompt()
          } else {
            throw new Error('Failed to get user data')
          }
        } catch (error) {
          // API 調用失敗，嘗試刷新 Token
          if (refreshTokenValue) {
            const refreshed = await refreshToken()

            if (refreshed) {
              // Token 刷新成功後也檢查故事推薦
              checkStoryPrompt()
            } else if (
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
  }, [isAuthenticated, pathname, refreshToken, router, setUser, checkStoryPrompt])

  // 追蹤前一次的認證狀態，用於偵測登入事件
  const prevIsAuthenticated = useRef(isAuthenticated)

  // 當用戶登入時（isAuthenticated 從 false 變成 true），檢查故事推薦
  useEffect(() => {
    // 偵測登入事件：從未認證變成已認證
    const justLoggedIn = isAuthenticated && !prevIsAuthenticated.current

    if (justLoggedIn) {
      // 重置檢查標記，允許重新檢查故事推薦
      hasCheckedStoryPrompt.current = false
    }

    // 更新前一次狀態
    prevIsAuthenticated.current = isAuthenticated

    // 如果已認證且尚未檢查過，執行檢查
    if (isAuthenticated && !hasCheckedStoryPrompt.current) {
      checkStoryPrompt()
    }
  }, [isAuthenticated, checkStoryPrompt])

  // 此組件不渲染任何內容
  return null
}
