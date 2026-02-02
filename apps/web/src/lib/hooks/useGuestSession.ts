'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import {
  useGuestSessionStore,
  GuestSession,
  SYNC_INTERVAL,
  TIME_TRACK_INTERVAL,
  GUEST_API_BASE_URL,
} from '@/store/guestSessionStore'

export type { GuestSession }

interface GuestSessionApi {
  session: GuestSession | null
  isLoading: boolean
  isEligibleToShare: boolean
  justBecameEligible: boolean
  trackPageView: () => void
  trackBiographyView: () => void
  getSessionId: () => string | null
  clearSession: () => void
}

/**
 * Guest Session Hook
 * 追蹤未登入訪客的瀏覽行為，判斷是否達到分享資格
 * 使用 Zustand store 實現跨組件狀態同步
 */
export function useGuestSession(): GuestSessionApi {
  const { status } = useAuthStore()
  const isSignedIn = status === 'signIn'

  // 從 store 取得狀態和 actions
  const session = useGuestSessionStore((state) => state.session)
  const isLoading = useGuestSessionStore((state) => state.isLoading)
  const isInitialized = useGuestSessionStore((state) => state.isInitialized)
  const justBecameEligible = useGuestSessionStore((state) => state.justBecameEligible)

  const initialize = useGuestSessionStore((state) => state.initialize)
  const storeTrackPageView = useGuestSessionStore((state) => state.trackPageView)
  const storeTrackBiographyView = useGuestSessionStore((state) => state.trackBiographyView)
  const syncToBackend = useGuestSessionStore((state) => state.syncToBackend)
  const clearSession = useGuestSessionStore((state) => state.clearSession)
  const setJustBecameEligible = useGuestSessionStore((state) => state.setJustBecameEligible)
  const getSessionId = useGuestSessionStore((state) => state.getSessionId)
  const incrementPendingTime = useGuestSessionStore((state) => state._incrementPendingTime)

  // 初始化
  useEffect(() => {
    initialize(isSignedIn)
  }, [initialize, isSignedIn])

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

  // 頁面離開時同步
  useEffect(() => {
    if (isSignedIn) return

    const handleBeforeUnload = () => {
      const state = useGuestSessionStore.getState()
      if (
        state.session &&
        (state._pendingPageViews > 0 ||
          state._pendingTimeSpent > 0 ||
          state._pendingBiographyViews > 0)
      ) {
        const data = JSON.stringify({
          session_id: state.session.id,
          page_views: state._pendingPageViews,
          time_spent_seconds: state._pendingTimeSpent,
          biography_views: state._pendingBiographyViews,
        })
        const blob = new Blob([data], { type: 'application/json' })
        navigator.sendBeacon(`${GUEST_API_BASE_URL}/guest/track`, blob)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isSignedIn])

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

  const trackBiographyView = useCallback(() => {
    storeTrackBiographyView(isSignedIn)
  }, [storeTrackBiographyView, isSignedIn])

  return {
    session,
    isLoading,
    isEligibleToShare: session?.isEligibleToShare ?? false,
    justBecameEligible,
    trackPageView,
    trackBiographyView,
    getSessionId,
    clearSession,
  }
}
