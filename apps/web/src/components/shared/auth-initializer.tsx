'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { storyPromptService } from '@/lib/api/services'
import { toast } from '@/components/ui/use-toast'
import { getAccessToken } from '@/lib/utils/tokenStorage'

/** 故事推薦彈窗顯示延遲時間（毫秒） */
const STORY_PROMPT_SHOW_DELAY = 1500

/** 建立人物誌提示的 localStorage key */
const BIOGRAPHY_PROMPT_KEY = 'nobodyclimb_biography_prompt_shown'

/**
 * 認證初始化組件
 * 在應用程序啟動時檢查使用者認證狀態
 *
 * 使用 @nobodyclimb/hooks 的 hydrate 方法恢復認證狀態
 */
export function AuthInitializer() {
  const status = useAuthStore((state) => state.status)
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
    const token = getAccessToken()
    if (!token) {
      return
    }

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
      // 靜默處理錯誤 - 這是非關鍵功能
      // 僅在開發環境記錄錯誤
      if (process.env.NODE_ENV === 'development') {
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
  const prevStatus = useRef(status)

  // 當用戶登入時（status 變成 'signIn'），檢查故事推薦
  useEffect(() => {
    // 偵測登入事件：從未認證變成已認證
    const justLoggedIn = status === 'signIn' && prevStatus.current !== 'signIn'

    if (justLoggedIn) {
      // 重置檢查標記，允許重新檢查故事推薦
      hasCheckedStoryPrompt.current = false
    }

    // 更新前一次狀態
    prevStatus.current = status

    // 如果已認證且尚未檢查過，執行檢查
    if (status === 'signIn' && !hasCheckedStoryPrompt.current) {
      checkStoryPrompt()
    }
  }, [status, checkStoryPrompt])

  // 此組件不渲染任何內容
  return null
}
