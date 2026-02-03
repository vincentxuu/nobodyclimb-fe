/**
 * AuthInitializer 組件
 *
 * 認證初始化組件，對應 apps/web/src/components/shared/auth-initializer.tsx
 * 在應用程序啟動時檢查使用者認證狀態
 */
import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { tokenStorage } from '@/lib/tokenStorage'

/** 故事推薦彈窗顯示延遲時間（毫秒） */
const STORY_PROMPT_SHOW_DELAY = 1500

/**
 * 認證初始化組件
 * 使用 hydrate 方法恢復認證狀態
 */
export function AuthInitializer() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hydrate = useAuthStore((state) => state.hydrate)
  const { openStoryPrompt } = useUIStore()

  // 追蹤是否已經檢查過故事推薦
  const hasCheckedStoryPrompt = useRef(false)
  const hasHydrated = useRef(false)

  // 檢查是否應該顯示故事推薦彈窗
  const checkStoryPrompt = useCallback(async () => {
    // 避免重複檢查
    if (hasCheckedStoryPrompt.current) return
    hasCheckedStoryPrompt.current = true

    // 確保有 access token 才發送請求，避免未登入時產生錯誤
    const token = await tokenStorage.getAccessToken()
    if (!token) {
      return
    }

    try {
      // TODO: 整合 storyPromptService
      // const response = await storyPromptService.shouldPrompt()
      // if (response.success && response.data?.should_prompt) {
      //   setTimeout(() => {
      //     openStoryPrompt()
      //   }, STORY_PROMPT_SHOW_DELAY)
      // }
    } catch (error) {
      // 靜默處理錯誤 - 這是非關鍵功能
      if (__DEV__) {
        console.error('檢查故事推薦失敗:', error)
      }
    }
  }, [openStoryPrompt])

  // 在組件掛載時使用 hydrate 恢復認證狀態
  useEffect(() => {
    const initAuth = async () => {
      if (hasHydrated.current) return
      hasHydrated.current = true

      // 使用 hydrate 恢復認證狀態
      await hydrate()
    }

    initAuth()
  }, [hydrate])

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

export default AuthInitializer
