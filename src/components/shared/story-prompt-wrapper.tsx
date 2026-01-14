'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { biographyService, storyPromptService } from '@/lib/api/services'
import { Biography } from '@/lib/types'
import StoryPromptModal from '@/components/biography/story-prompt-modal'

/**
 * 全域故事推薦彈窗包裝器
 * 在 layout 中渲染，負責管理故事推薦彈窗的顯示邏輯
 */
export function StoryPromptWrapper() {
  const { isAuthenticated, user } = useAuthStore()
  const { isStoryPromptOpen, closeStoryPrompt } = useUIStore()
  const [biography, setBiography] = useState<Biography | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 當彈窗打開時，獲取用戶的人物誌資料
  useEffect(() => {
    const fetchBiography = async () => {
      if (isStoryPromptOpen && isAuthenticated && !biography) {
        setIsLoading(true)
        try {
          const response = await biographyService.getMyBiography()
          if (response.success && response.data) {
            setBiography(response.data)
          }
        } catch (error) {
          console.error('獲取人物誌失敗:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchBiography()
  }, [isStoryPromptOpen, isAuthenticated, biography])

  // 儲存故事
  const handleSave = useCallback(async (storyField: string, storyValue: string) => {
    if (!biography) return

    try {
      // 更新人物誌資料
      await biographyService.updateMyBiography({
        [storyField]: storyValue,
      })

      // 記錄完成
      await storyPromptService.completePrompt(storyField)

      // 更新本地狀態
      setBiography((prev) =>
        prev ? { ...prev, [storyField]: storyValue } : null
      )
    } catch (error) {
      console.error('儲存故事失敗:', error)
      throw error
    }
  }, [biography])

  // 跳過
  const handleSkip = useCallback(async (skippedField: string) => {
    try {
      await storyPromptService.dismissPrompt(skippedField)
    } catch (error) {
      console.error('記錄跳過失敗:', error)
    }
  }, [])

  // 關閉彈窗
  const handleClose = useCallback(() => {
    closeStoryPrompt()
  }, [closeStoryPrompt])

  // 如果未登入或正在加載，不顯示彈窗
  if (!isAuthenticated || isLoading || !biography) {
    return null
  }

  return (
    <StoryPromptModal
      biography={biography as unknown as Record<string, unknown>}
      userName={user?.displayName || user?.username || '你'}
      isOpen={isStoryPromptOpen}
      onClose={handleClose}
      onSave={handleSave}
      onSkip={handleSkip}
      strategy="easy_first"
    />
  )
}

export default StoryPromptWrapper
