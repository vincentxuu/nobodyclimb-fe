'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/lib/api/client'
import { API_BASE_URL } from '@/lib/constants'

// localStorage keys
const GUEST_SESSION_ID_KEY = 'guest_session_id'
const GUEST_SESSION_DATA_KEY = 'guest_session_data'

// 同步間隔（毫秒）
const SYNC_INTERVAL = 30000 // 30 秒
const TIME_TRACK_INTERVAL = 10000 // 10 秒

export interface GuestSession {
  id: string
  pageViews: number
  timeSpentSeconds: number
  biographyViews: number
  isEligibleToShare: boolean
  isClaimed: boolean
}

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
 */
export function useGuestSession(): GuestSessionApi {
  const { isAuthenticated } = useAuthStore()
  const [session, setSession] = useState<GuestSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [justBecameEligible, setJustBecameEligible] = useState(false)

  // 追蹤用的 refs
  const pendingPageViews = useRef(0)
  const pendingTimeSpent = useRef(0)
  const pendingBiographyViews = useRef(0)
  const lastSyncTime = useRef(Date.now())
  const isInitialized = useRef(false)

  // 從 localStorage 取得 session ID
  const getSessionId = useCallback((): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(GUEST_SESSION_ID_KEY)
  }, [])

  // 儲存 session 到 localStorage
  const saveSessionToLocal = useCallback((sessionData: GuestSession) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(GUEST_SESSION_ID_KEY, sessionData.id)
    localStorage.setItem(GUEST_SESSION_DATA_KEY, JSON.stringify(sessionData))
  }, [])

  // 從 localStorage 讀取 session
  const loadSessionFromLocal = useCallback((): GuestSession | null => {
    if (typeof window === 'undefined') return null
    const data = localStorage.getItem(GUEST_SESSION_DATA_KEY)
    if (!data) return null
    try {
      return JSON.parse(data)
    } catch {
      return null
    }
  }, [])

  // 清除 session
  const clearSession = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(GUEST_SESSION_ID_KEY)
    localStorage.removeItem(GUEST_SESSION_DATA_KEY)
    setSession(null)
  }, [])

  // 初始化或取得 session
  const initializeSession = useCallback(async () => {
    if (isAuthenticated) {
      // 已登入用戶不需要 guest session
      setIsLoading(false)
      return
    }

    const existingId = getSessionId()
    const localSession = loadSessionFromLocal()

    try {
      const response = await apiClient.post('/guest/session', {
        session_id: existingId || undefined,
      })

      if (response.data.success) {
        const newSession: GuestSession = {
          id: response.data.session.id,
          pageViews: response.data.session.page_views,
          timeSpentSeconds: response.data.session.time_spent_seconds,
          biographyViews: response.data.session.biography_views,
          isEligibleToShare: response.data.session.is_eligible_to_share,
          isClaimed: response.data.session.is_claimed,
        }
        setSession(newSession)
        saveSessionToLocal(newSession)
      }
    } catch (error) {
      // 如果 API 失敗，使用本地 session
      if (localSession) {
        setSession(localSession)
      } else {
        // 建立本地 session
        const newId = crypto.randomUUID()
        const newSession: GuestSession = {
          id: newId,
          pageViews: 0,
          timeSpentSeconds: 0,
          biographyViews: 0,
          isEligibleToShare: false,
          isClaimed: false,
        }
        setSession(newSession)
        saveSessionToLocal(newSession)
      }
    } finally {
      setIsLoading(false)
      isInitialized.current = true
    }
  }, [isAuthenticated, getSessionId, loadSessionFromLocal, saveSessionToLocal])

  // 同步到後端
  const syncToBackend = useCallback(async () => {
    if (!session || isAuthenticated) return
    if (pendingPageViews.current === 0 && pendingTimeSpent.current === 0 && pendingBiographyViews.current === 0) {
      return
    }

    try {
      const response = await apiClient.post('/guest/track', {
        session_id: session.id,
        page_views: pendingPageViews.current,
        time_spent_seconds: pendingTimeSpent.current,
        biography_views: pendingBiographyViews.current,
      })

      if (response.data.success) {
        const updatedSession: GuestSession = {
          ...session,
          pageViews: response.data.session.page_views,
          timeSpentSeconds: response.data.session.time_spent_seconds,
          biographyViews: response.data.session.biography_views,
          isEligibleToShare: response.data.session.is_eligible_to_share,
        }
        setSession(updatedSession)
        saveSessionToLocal(updatedSession)

        // 檢查是否剛達到資格
        if (response.data.session.just_became_eligible) {
          setJustBecameEligible(true)
        }

        // 清除 pending
        pendingPageViews.current = 0
        pendingTimeSpent.current = 0
        pendingBiographyViews.current = 0
        lastSyncTime.current = Date.now()
      }
    } catch (error) {
      console.error('Failed to sync guest session:', error)
    }
  }, [session, isAuthenticated, saveSessionToLocal])

  // 追蹤頁面瀏覽
  const trackPageView = useCallback(() => {
    if (isAuthenticated || !isInitialized.current) return
    pendingPageViews.current += 1

    // 更新本地狀態
    if (session) {
      const updated = {
        ...session,
        pageViews: session.pageViews + 1,
      }
      setSession(updated)
      saveSessionToLocal(updated)
    }
  }, [isAuthenticated, session, saveSessionToLocal])

  // 追蹤人物誌瀏覽
  const trackBiographyView = useCallback(async () => {
    if (isAuthenticated || !isInitialized.current) return
    pendingBiographyViews.current += 1

    // 更新本地狀態
    if (session) {
      const updated = {
        ...session,
        biographyViews: session.biographyViews + 1,
      }
      setSession(updated)
      saveSessionToLocal(updated)

      // 人物誌瀏覽對資格判定很重要，立即同步到後端
      try {
        const response = await apiClient.post('/guest/track', {
          session_id: session.id,
          page_views: pendingPageViews.current,
          time_spent_seconds: pendingTimeSpent.current,
          biography_views: pendingBiographyViews.current,
        })

        if (response.data.success) {
          const syncedSession: GuestSession = {
            ...session,
            pageViews: response.data.session.page_views,
            timeSpentSeconds: response.data.session.time_spent_seconds,
            biographyViews: response.data.session.biography_views,
            isEligibleToShare: response.data.session.is_eligible_to_share,
          }
          setSession(syncedSession)
          saveSessionToLocal(syncedSession)

          // 檢查是否剛達到資格
          if (response.data.session.just_became_eligible) {
            setJustBecameEligible(true)
          }

          // 清除 pending
          pendingPageViews.current = 0
          pendingTimeSpent.current = 0
          pendingBiographyViews.current = 0
          lastSyncTime.current = Date.now()
        }
      } catch (error) {
        console.error('Failed to sync after biography view:', error)
      }
    }
  }, [isAuthenticated, session, saveSessionToLocal])

  // 初始化
  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  // 時間追蹤（只累加 ref，不更新 state，避免不必要的重新渲染）
  useEffect(() => {
    if (isAuthenticated || !isInitialized.current) return

    const interval = setInterval(() => {
      pendingTimeSpent.current += TIME_TRACK_INTERVAL / 1000
    }, TIME_TRACK_INTERVAL)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  // 定期同步
  useEffect(() => {
    if (isAuthenticated || !isInitialized.current) return

    const interval = setInterval(() => {
      syncToBackend()
    }, SYNC_INTERVAL)

    return () => clearInterval(interval)
  }, [isAuthenticated, syncToBackend])

  // 頁面離開時同步
  useEffect(() => {
    if (isAuthenticated) return

    const handleBeforeUnload = () => {
      if (session && (pendingPageViews.current > 0 || pendingTimeSpent.current > 0 || pendingBiographyViews.current > 0)) {
        // 使用 sendBeacon 在頁面關閉時發送
        const data = JSON.stringify({
          session_id: session.id,
          page_views: pendingPageViews.current,
          time_spent_seconds: pendingTimeSpent.current,
          biography_views: pendingBiographyViews.current,
        })
        // 使用 Blob 設定正確的 Content-Type
        const blob = new Blob([data], { type: 'application/json' })
        navigator.sendBeacon(`${API_BASE_URL}/guest/track`, blob)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isAuthenticated, session])

  // 重置 justBecameEligible 狀態（顯示後 5 秒）
  useEffect(() => {
    if (justBecameEligible) {
      const timer = setTimeout(() => {
        setJustBecameEligible(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [justBecameEligible])

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
