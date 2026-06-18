import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const GUEST_SESSION_ID_KEY = 'guest_session'
const GUEST_SESSION_DATA_KEY = 'guest_session_data'

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

export function useContentClaim(): ContentClaimApi {
  const { status, user } = useAuthStore()
  const [unclaimedContent, setUnclaimedContent] = useState<UnclaimedContent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasDismissed, setHasDismissed] = useState(false)

  const checkForUnclaimedContent = useCallback(async () => {
    if (status !== 'signIn' || hasDismissed) return

    const sessionId = await AsyncStorage.getItem(GUEST_SESSION_ID_KEY)
    const email = user?.email

    if (!sessionId && !email) return

    setIsLoading(true)

    try {
      const params: Record<string, string> = {}
      if (sessionId) params.session_id = sessionId
      if (email) params.email = email

      const response = await apiClient.get('/guest/claim/check', { params })
      const unclaimed = response.data?.unclaimed ?? response.data?.data?.unclaimed ?? []

      setUnclaimedContent(
        unclaimed.map((item: any) => ({
          id: item.id,
          anonymousName: item.anonymous_name,
          storyCount: item.story_count,
          createdAt: item.created_at,
        }))
      )
    } catch (error) {
      console.error('Failed to check for unclaimed content:', error)
    } finally {
      setIsLoading(false)
    }
  }, [hasDismissed, status, user?.email])

  const clearGuestSession = useCallback(async () => {
    await AsyncStorage.multiRemove([GUEST_SESSION_ID_KEY, GUEST_SESSION_DATA_KEY])
  }, [])

  const claimBiography = useCallback(
    async (biographyId: string, keepAnonymous: boolean = false): Promise<ClaimResult> => {
      try {
        const response = await apiClient.post(`/guest/claim/biography/${biographyId}`, {
          keep_anonymous: keepAnonymous,
        })

        if (response.data?.success) {
          await clearGuestSession()
          setUnclaimedContent((current) => current.filter((item) => item.id !== biographyId))
          return {
            success: true,
            biographyId: response.data.biography_id,
            isAnonymous: response.data.is_anonymous,
          }
        }

        return { success: false, error: response.data?.error || '認領失敗' }
      } catch (error: any) {
        if (error.response?.status === 409) {
          return {
            success: false,
            error: error.response.data?.error || '你已有人物誌',
            biographyId: error.response.data?.existing_biography_id,
          }
        }

        return {
          success: false,
          error: error.response?.data?.error || '認領失敗',
        }
      }
    },
    [clearGuestSession]
  )

  const mergeBiography = useCallback(
    async (sourceId: string): Promise<ClaimResult> => {
      try {
        const response = await apiClient.post(`/guest/claim/merge/${sourceId}`)

        if (response.data?.success) {
          await clearGuestSession()
          setUnclaimedContent((current) => current.filter((item) => item.id !== sourceId))
          return {
            success: true,
            biographyId: response.data.merged_to_biography_id,
          }
        }

        return { success: false, error: response.data?.error || '合併失敗' }
      } catch (error: any) {
        return {
          success: false,
          error: error.response?.data?.error || '合併失敗',
        }
      }
    },
    [clearGuestSession]
  )

  const dismissClaim = useCallback(() => {
    setHasDismissed(true)
    setUnclaimedContent([])
  }, [])

  useEffect(() => {
    if (status !== 'signIn' || hasDismissed) return

    const timer = setTimeout(() => {
      checkForUnclaimedContent()
    }, 1000)

    return () => clearTimeout(timer)
  }, [checkForUnclaimedContent, hasDismissed, status])

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
