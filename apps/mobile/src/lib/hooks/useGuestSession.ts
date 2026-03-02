/**
 * useGuestSession Hook
 *
 * 對應 apps/web/src/lib/hooks/useGuestSession.ts
 * 追蹤未登入訪客的瀏覽行為，判斷是否達到分享資格
 */
import { useEffect, useCallback } from 'react'
import {
  useGuestSessionStore,
  type GuestSession,
  SYNC_INTERVAL,
  TIME_TRACK_INTERVAL,
} from '@/store/guestSessionStore'
import { useAuthStore } from '@/store/authStore'

export type { GuestSession }

interface GuestSessionApi {
  // 狀態
  session: GuestSession | null
  isLoading: boolean
  isGuest: boolean
  isEligibleToShare: boolean
  justBecameEligible: boolean
  sessionId: string | null

  // 追蹤方法
  trackPageView: () => void
  trackBiographyView: () => Promise<void>
  trackView: (targetType: string, targetId: string) => Promise<void>
  trackLike: (targetType: string, targetId: string) => Promise<void>
  trackBookmark: (targetType: string, targetId: string) => Promise<void>

  // 查詢方法
  hasViewed: (targetType: string, targetId: string) => boolean
  hasLiked: (targetType: string, targetId: string) => boolean
  hasBookmarked: (targetType: string, targetId: string) => boolean

  // 工具方法
  getSessionId: () => string | null
  clearSession: () => Promise<void>
}

export function useGuestSession(): GuestSessionApi {
  const { isAuthenticated, user, status } = useAuthStore()
  const isSignedIn = status === 'signIn'

  // 從 store 取得狀態和 actions
  const session = useGuestSessionStore((state) => state.session)
  const isLoading = useGuestSessionStore((state) => state.isLoading)
  const isInitialized = useGuestSessionStore((state) => state.isInitialized)
  const justBecameEligible = useGuestSessionStore((state) => state.justBecameEligible)

  const initSession = useGuestSessionStore((state) => state.initSession)
  const storeTrackPageView = useGuestSessionStore((state) => state.trackPageView)
  const storeTrackBiographyView = useGuestSessionStore((state) => state.trackBiographyView)
  const storeTrackInteraction = useGuestSessionStore((state) => state.trackInteraction)
  const storeHasInteracted = useGuestSessionStore((state) => state.hasInteracted)
  const syncToBackend = useGuestSessionStore((state) => state.syncToBackend)
  const clearSession = useGuestSessionStore((state) => state.clearSession)
  const setJustBecameEligible = useGuestSessionStore((state) => state.setJustBecameEligible)
  const getSessionId = useGuestSessionStore((state) => state.getSessionId)
  const incrementPendingTime = useGuestSessionStore((state) => state._incrementPendingTime)
  const migrateToUser = useGuestSessionStore((state) => state.migrateToUser)

  const isGuest = !isAuthenticated

  // 初始化
  useEffect(() => {
    if (!isInitialized && !isSignedIn) {
      initSession()
    }
  }, [initSession, isSignedIn, isInitialized])

  // 時間追蹤
  useEffect(() => {
    if (isSignedIn || !isInitialized) return

    const interval = setInterval(() => {
      incrementPendingTime(TIME_TRACK_INTERVAL / 1000)
    }, TIME_TRACK_INTERVAL)

    return () => clearInterval(interval)
  }, [isSignedIn, isInitialized, incrementPendingTime])

  // 定期同步
  useEffect(() => {
    if (isSignedIn || !isInitialized) return

    const interval = setInterval(() => {
      syncToBackend(isSignedIn)
    }, SYNC_INTERVAL)

    return () => clearInterval(interval)
  }, [isSignedIn, isInitialized, syncToBackend])

  // 登入後遷移訪客資料
  useEffect(() => {
    if (isAuthenticated && user && session) {
      migrateToUser(user.id)
    }
  }, [isAuthenticated, user, session, migrateToUser])

  // 重置 justBecameEligible 狀態（顯示後 5 秒）
  useEffect(() => {
    if (justBecameEligible) {
      const timer = setTimeout(() => {
        setJustBecameEligible(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [justBecameEligible, setJustBecameEligible])

  // Wrapped actions
  const trackPageView = useCallback(() => {
    storeTrackPageView(isSignedIn)
  }, [storeTrackPageView, isSignedIn])

  const trackBiographyView = useCallback(async () => {
    await storeTrackBiographyView(isSignedIn)
  }, [storeTrackBiographyView, isSignedIn])

  const trackView = useCallback(
    async (targetType: string, targetId: string) => {
      if (isGuest) {
        await storeTrackInteraction({
          type: 'view',
          targetType: targetType as any,
          targetId,
        })
      }
    },
    [isGuest, storeTrackInteraction]
  )

  const trackLike = useCallback(
    async (targetType: string, targetId: string) => {
      if (isGuest) {
        await storeTrackInteraction({
          type: 'like',
          targetType: targetType as any,
          targetId,
        })
      }
    },
    [isGuest, storeTrackInteraction]
  )

  const trackBookmark = useCallback(
    async (targetType: string, targetId: string) => {
      if (isGuest) {
        await storeTrackInteraction({
          type: 'bookmark',
          targetType: targetType as any,
          targetId,
        })
      }
    },
    [isGuest, storeTrackInteraction]
  )

  const hasViewed = useCallback(
    (targetType: string, targetId: string) => {
      if (!isGuest) return false
      return storeHasInteracted(targetType as any, targetId, 'view')
    },
    [isGuest, storeHasInteracted]
  )

  const hasLiked = useCallback(
    (targetType: string, targetId: string) => {
      if (!isGuest) return false
      return storeHasInteracted(targetType as any, targetId, 'like')
    },
    [isGuest, storeHasInteracted]
  )

  const hasBookmarked = useCallback(
    (targetType: string, targetId: string) => {
      if (!isGuest) return false
      return storeHasInteracted(targetType as any, targetId, 'bookmark')
    },
    [isGuest, storeHasInteracted]
  )

  return {
    session,
    isLoading,
    isGuest,
    isEligibleToShare: session?.isEligibleToShare ?? false,
    justBecameEligible,
    sessionId: session?.id ?? null,
    trackPageView,
    trackBiographyView,
    trackView,
    trackLike,
    trackBookmark,
    hasViewed,
    hasLiked,
    hasBookmarked,
    getSessionId,
    clearSession,
  }
}
