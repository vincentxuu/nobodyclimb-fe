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
  // 從後端獲取的推薦題目欄位
  const [promptedField, setPromptedField] = useState<string | null>(null)

  // 當彈窗打開時，獲取用戶的人物誌資料和後端推薦的題目
  useEffect(() => {
    const fetchData = async () => {
      if (isStoryPromptOpen && isAuthenticated) {
        setIsLoading(true)
        try {
          // 並行獲取人物誌資料和後端推薦的題目
          const [biographyResponse, promptResponse] = await Promise.all([
            biography ? Promise.resolve({ success: true, data: biography }) : biographyService.getMyBiography(),
            storyPromptService.getNextPrompt('easy_first'),
          ])

          if (biographyResponse.success && biographyResponse.data) {
            setBiography(biographyResponse.data)
          }

          // 設置後端推薦的題目，讓頻率控制生效
          if (promptResponse.success && promptResponse.data) {
            setPromptedField(promptResponse.data.field)
          }
        } catch (error) {
          console.error('獲取資料失敗:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchData()
  }, [isStoryPromptOpen, isAuthenticated, biography])

  // 儲存故事
  const handleSave = useCallback(async (storyField: string, storyValue: string) => {
    if (!biography) {
      throw new Error('尚未載入人物誌資料，請稍後再試')
    }

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
    // 重置推薦題目，下次打開時會重新從後端獲取
    setPromptedField(null)
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
      initialField={promptedField}
    />
  )
}
