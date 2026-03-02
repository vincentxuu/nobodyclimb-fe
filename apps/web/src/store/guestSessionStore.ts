import { create } from 'zustand'
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

interface GuestSessionState {
  session: GuestSession | null
  isLoading: boolean
  isInitialized: boolean
  justBecameEligible: boolean
}

interface GuestSessionActions {
  initialize: (isAuthenticated: boolean) => Promise<void>
  trackPageView: (isAuthenticated: boolean) => void
  trackBiographyView: (isAuthenticated: boolean) => Promise<void>
  syncToBackend: (isAuthenticated: boolean) => Promise<void>
  clearSession: () => void
  setJustBecameEligible: (value: boolean) => void
  getSessionId: () => string | null
}

type GuestSessionStore = GuestSessionState & GuestSessionActions & {
  // Internal state for pending counters
  _pendingPageViews: number
  _pendingTimeSpent: number
  _pendingBiographyViews: number
  _incrementPendingTime: (seconds: number) => void
}

// Helper functions
const saveSessionToLocal = (sessionData: GuestSession) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(GUEST_SESSION_ID_KEY, sessionData.id)
  localStorage.setItem(GUEST_SESSION_DATA_KEY, JSON.stringify(sessionData))
}

const loadSessionFromLocal = (): GuestSession | null => {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(GUEST_SESSION_DATA_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

const getSessionIdFromLocal = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(GUEST_SESSION_ID_KEY)
}

export const useGuestSessionStore = create<GuestSessionStore>((set, get) => ({
  // State
  session: null,
  isLoading: true,
  isInitialized: false,
  justBecameEligible: false,
  _pendingPageViews: 0,
  _pendingTimeSpent: 0,
  _pendingBiographyViews: 0,

  // Actions
  initialize: async (isAuthenticated: boolean) => {
    const state = get()
    if (state.isInitialized) return // 避免重複初始化

    if (status === 'signIn') {
      set({ isLoading: false, isInitialized: true })
      return
    }

    const existingId = getSessionIdFromLocal()
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
        saveSessionToLocal(newSession)
        set({ session: newSession, isLoading: false, isInitialized: true })
      }
    } catch (error) {
      console.error('Failed to initialize guest session:', error)
      if (localSession) {
        set({ session: localSession, isLoading: false, isInitialized: true })
      } else {
        const newId = crypto.randomUUID()
        const newSession: GuestSession = {
          id: newId,
          pageViews: 0,
          timeSpentSeconds: 0,
          biographyViews: 0,
          isEligibleToShare: false,
          isClaimed: false,
        }
        saveSessionToLocal(newSession)
        set({ session: newSession, isLoading: false, isInitialized: true })
      }
    }
  },

  trackPageView: (isAuthenticated: boolean) => {
    const state = get()
    if (isAuthenticated || !state.isInitialized || !state.session) return

    const updatedSession = {
      ...state.session,
      pageViews: state.session.pageViews + 1,
    }
    saveSessionToLocal(updatedSession)
    set({
      session: updatedSession,
      _pendingPageViews: state._pendingPageViews + 1,
    })
  },

  trackBiographyView: async (isAuthenticated: boolean) => {
    const state = get()
    if (isAuthenticated || !state.isInitialized || !state.session) return

    // 先更新本地狀態
    const updatedSession = {
      ...state.session,
      biographyViews: state.session.biographyViews + 1,
    }
    saveSessionToLocal(updatedSession)
    set({
      session: updatedSession,
      _pendingBiographyViews: state._pendingBiographyViews + 1,
    })

    // 立即同步到後端
    const currentState = get()
    if (!currentState.session) return

    try {
      const response = await apiClient.post('/guest/track', {
        session_id: currentState.session.id,
        page_views: currentState._pendingPageViews,
        time_spent_seconds: currentState._pendingTimeSpent,
        biography_views: currentState._pendingBiographyViews,
      })

      if (response.data.success) {
        const syncedSession: GuestSession = {
          ...currentState.session,
          pageViews: response.data.session.page_views,
          timeSpentSeconds: response.data.session.time_spent_seconds,
          biographyViews: response.data.session.biography_views,
          isEligibleToShare: response.data.session.is_eligible_to_share,
        }
        saveSessionToLocal(syncedSession)
        set({
          session: syncedSession,
          _pendingPageViews: 0,
          _pendingTimeSpent: 0,
          _pendingBiographyViews: 0,
          justBecameEligible: response.data.session.just_became_eligible || false,
        })
      }
    } catch (error) {
      console.error('Failed to sync after biography view:', error)
    }
  },

  syncToBackend: async (isAuthenticated: boolean) => {
    const state = get()
    if (!state.session || isAuthenticated) return
    if (
      state._pendingPageViews === 0 &&
      state._pendingTimeSpent === 0 &&
      state._pendingBiographyViews === 0
    ) {
      return
    }

    try {
      const response = await apiClient.post('/guest/track', {
        session_id: state.session.id,
        page_views: state._pendingPageViews,
        time_spent_seconds: state._pendingTimeSpent,
        biography_views: state._pendingBiographyViews,
      })

      if (response.data.success) {
        const updatedSession: GuestSession = {
          ...state.session,
          pageViews: response.data.session.page_views,
          timeSpentSeconds: response.data.session.time_spent_seconds,
          biographyViews: response.data.session.biography_views,
          isEligibleToShare: response.data.session.is_eligible_to_share,
        }
        saveSessionToLocal(updatedSession)
        set({
          session: updatedSession,
          _pendingPageViews: 0,
          _pendingTimeSpent: 0,
          _pendingBiographyViews: 0,
          justBecameEligible: response.data.session.just_became_eligible || false,
        })
      }
    } catch (error) {
      console.error('Failed to sync guest session:', error)
    }
  },

  clearSession: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_SESSION_ID_KEY)
      localStorage.removeItem(GUEST_SESSION_DATA_KEY)
    }
    set({
      session: null,
      isInitialized: false,
      _pendingPageViews: 0,
      _pendingTimeSpent: 0,
      _pendingBiographyViews: 0,
    })
  },

  setJustBecameEligible: (value: boolean) => {
    set({ justBecameEligible: value })
  },

  getSessionId: () => {
    return get().session?.id || null
  },

  _incrementPendingTime: (seconds: number) => {
    set((state) => ({
      _pendingTimeSpent: state._pendingTimeSpent + seconds,
    }))
  },
}))

// 導出常數供外部使用
export { SYNC_INTERVAL, TIME_TRACK_INTERVAL, API_BASE_URL as GUEST_API_BASE_URL }
