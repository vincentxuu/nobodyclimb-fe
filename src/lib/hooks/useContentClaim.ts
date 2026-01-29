'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/lib/api/client'

const GUEST_SESSION_ID_KEY = 'guest_session_id'

export interface UnclaimedContent {
  id: string
  anonymousName: string
  storyCount: number
  createdAt: string
}

export interface ClaimResult {
  success: boolean
  biographyId?: string
  isAnonymous?: boolean
  error?: string
}

interface ContentClaimApi {
  unclaimedContent: UnclaimedContent[]
  isLoading: boolean
  hasUnclaimedContent: boolean
  checkForUnclaimedContent: () => Promise<void>
  claimBiography: (biographyId: string, keepAnonymous?: boolean) => Promise<ClaimResult>
  mergeBiography: (sourceId: string) => Promise<ClaimResult>
  dismissClaim: () => void
}

/**
 * Content Claim Hook
 * 用於檢查和認領匿名內容
 */
export function useContentClaim(): ContentClaimApi {
  const { isAuthenticated, user } = useAuthStore()
  const [unclaimedContent, setUnclaimedContent] = useState<UnclaimedContent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasDismissed, setHasDismissed] = useState(false)

  // 檢查是否有可認領的內容
  const checkForUnclaimedContent = useCallback(async () => {
    if (!isAuthenticated || hasDismissed) return

    const sessionId = typeof window !== 'undefined'
      ? localStorage.getItem(GUEST_SESSION_ID_KEY)
      : null

    if (!sessionId && !user?.email) return

    setIsLoading(true)

    try {
      const params: Record<string, string> = {}
      if (sessionId) params.session_id = sessionId
      if (user?.email) params.email = user.email

      const response = await apiClient.get('/guest/claim/check', { params })

      if (response.data.success && response.data.unclaimed.length > 0) {
        setUnclaimedContent(
          response.data.unclaimed.map((item: any) => ({
            id: item.id,
            anonymousName: item.anonymous_name,
            storyCount: item.story_count,
            createdAt: item.created_at,
          }))
        )
      }
    } catch (error) {
      console.error('Failed to check for unclaimed content:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user?.email, hasDismissed])

  // 認領人物誌
  const claimBiography = useCallback(async (
    biographyId: string,
    keepAnonymous: boolean = false
  ): Promise<ClaimResult> => {
    try {
      const response = await apiClient.post(`/guest/claim/biography/${biographyId}`, {
        keep_anonymous: keepAnonymous,
      })

      if (response.data.success) {
        // 清除 localStorage 中的 guest session
        if (typeof window !== 'undefined') {
          localStorage.removeItem(GUEST_SESSION_ID_KEY)
          localStorage.removeItem('guest_session_data')
        }

        // 從列表中移除已認領的內容
        setUnclaimedContent(prev => prev.filter(item => item.id !== biographyId))

        return {
          success: true,
          biographyId: response.data.biography_id,
          isAnonymous: response.data.is_anonymous,
        }
      }

      return { success: false, error: '認領失敗' }
    } catch (error: any) {
      if (error.response?.status === 409) {
        // 用戶已有人物誌
        return {
          success: false,
          error: error.response.data.error,
          biographyId: error.response.data.existing_biography_id,
        }
      }
      return {
        success: false,
        error: error.response?.data?.error || '認領失敗',
      }
    }
  }, [])

  // 合併到現有人物誌
  const mergeBiography = useCallback(async (sourceId: string): Promise<ClaimResult> => {
    try {
      const response = await apiClient.post(`/guest/claim/merge/${sourceId}`)

      if (response.data.success) {
        // 清除 localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem(GUEST_SESSION_ID_KEY)
          localStorage.removeItem('guest_session_data')
        }

        // 從列表中移除
        setUnclaimedContent(prev => prev.filter(item => item.id !== sourceId))

        return {
          success: true,
          biographyId: response.data.merged_to_biography_id,
        }
      }

      return { success: false, error: '合併失敗' }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || '合併失敗',
      }
    }
  }, [])

  // 忽略認領提示
  const dismissClaim = useCallback(() => {
    setHasDismissed(true)
    setUnclaimedContent([])
  }, [])

  // 登入後自動檢查
  useEffect(() => {
    if (isAuthenticated && !hasDismissed) {
      // 延遲一下，確保登入流程完成
      const timer = setTimeout(() => {
        checkForUnclaimedContent()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, checkForUnclaimedContent, hasDismissed])

  return {
    unclaimedContent,
    isLoading,
    hasUnclaimedContent: unclaimedContent.length > 0,
    checkForUnclaimedContent,
    claimBiography,
    mergeBiography,
    dismissClaim,
  }
}
