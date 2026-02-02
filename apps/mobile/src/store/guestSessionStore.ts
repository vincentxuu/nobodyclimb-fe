/**
 * 訪客 Session 管理
 *
 * 對應 apps/web/src/store/guestSessionStore.ts
 */
import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiClient } from '@/lib/api'

const GUEST_SESSION_KEY = 'guest_session'
const GUEST_SESSION_DATA_KEY = 'guest_session_data'

// 同步間隔（毫秒）
const SYNC_INTERVAL = 30000 // 30 秒
const TIME_TRACK_INTERVAL = 10000 // 10 秒

// 分享資格門檻
const SHARE_ELIGIBILITY_THRESHOLD = 3 // 瀏覽 3 個傳記後可分享

export interface GuestInteraction {
  type: 'view' | 'like' | 'bookmark' | 'comment'
  targetType: 'article' | 'biography' | 'story' | 'crag' | 'gym'
  targetId: string
  timestamp: number
}

export interface GuestSession {
  id: string
  createdAt: number
  lastActiveAt: number
  pageViews: number
  timeSpentSeconds: number
  biographyViews: number
  isEligibleToShare: boolean
  isClaimed: boolean
  interactions: GuestInteraction[]
}

interface GuestSessionState {
  session: GuestSession | null
  isLoading: boolean
  isInitialized: boolean
  justBecameEligible: boolean
  _pendingPageViews: number
  _pendingTimeSpent: number
  _pendingBiographyViews: number
}

interface GuestSessionActions {
  // Session 管理
  initSession: () => Promise<void>
  getOrCreateSession: () => Promise<GuestSession>
  clearSession: () => Promise<void>
  getSessionId: () => string | null

  // 追蹤功能
  trackPageView: (isAuthenticated: boolean) => void
  trackBiographyView: (isAuthenticated: boolean) => Promise<void>
  syncToBackend: (isAuthenticated: boolean) => Promise<void>

  // 互動追蹤
  trackInteraction: (interaction: Omit<GuestInteraction, 'timestamp'>) => Promise<void>
  getInteractions: (type?: GuestInteraction['type']) => GuestInteraction[]
  hasInteracted: (
    targetType: GuestInteraction['targetType'],
    targetId: string,
    interactionType?: GuestInteraction['type']
  ) => boolean

  // 狀態管理
  setJustBecameEligible: (value: boolean) => void
  _incrementPendingTime: (seconds: number) => void

  // 轉換為已登入用戶
  migrateToUser: (userId: string) => Promise<GuestInteraction[]>
}

type GuestSessionStore = GuestSessionState & GuestSessionActions

const generateSessionId = (): string => {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Helper functions
const saveSessionToLocal = async (sessionData: GuestSession) => {
  try {
    await AsyncStorage.setItem(GUEST_SESSION_KEY, sessionData.id)
    await AsyncStorage.setItem(GUEST_SESSION_DATA_KEY, JSON.stringify(sessionData))
  } catch (error) {
    console.error('Failed to save session to local:', error)
  }
}

const loadSessionFromLocal = async (): Promise<GuestSession | null> => {
  try {
    const data = await AsyncStorage.getItem(GUEST_SESSION_DATA_KEY)
    if (!data) return null
    return JSON.parse(data)
  } catch {
    return null
  }
}

const getSessionIdFromLocal = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(GUEST_SESSION_KEY)
  } catch {
    return null
  }
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

  initSession: async () => {
    const state = get()
    if (state.isInitialized) return // 避免重複初始化

    const existingId = await getSessionIdFromLocal()
    const localSession = await loadSessionFromLocal()

    try {
      const response = await apiClient.post('/guest/session', {
        session_id: existingId || undefined,
      })

      if (response.data.success) {
        const newSession: GuestSession = {
          id: response.data.session.id,
          createdAt: localSession?.createdAt || Date.now(),
          lastActiveAt: Date.now(),
          pageViews: response.data.session.page_views,
          timeSpentSeconds: response.data.session.time_spent_seconds,
          biographyViews: response.data.session.biography_views,
          isEligibleToShare: response.data.session.is_eligible_to_share,
          isClaimed: response.data.session.is_claimed,
          interactions: localSession?.interactions || [],
        }
        await saveSessionToLocal(newSession)
        set({ session: newSession, isLoading: false, isInitialized: true })
      }
    } catch (error) {
      console.error('Failed to initialize guest session:', error)
      if (localSession) {
        set({ session: localSession, isLoading: false, isInitialized: true })
      } else {
        const newId = generateSessionId()
        const newSession: GuestSession = {
          id: newId,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          pageViews: 0,
          timeSpentSeconds: 0,
          biographyViews: 0,
          isEligibleToShare: false,
          isClaimed: false,
          interactions: [],
        }
        await saveSessionToLocal(newSession)
        set({ session: newSession, isLoading: false, isInitialized: true })
      }
    }
  },

  getOrCreateSession: async () => {
    const { session, initSession } = get()

    if (session) {
      return session
    }

    await initSession()
    return get().session!
  },

  clearSession: async () => {
    try {
      await AsyncStorage.multiRemove([GUEST_SESSION_KEY, GUEST_SESSION_DATA_KEY])
      set({
        session: null,
        isInitialized: false,
        _pendingPageViews: 0,
        _pendingTimeSpent: 0,
        _pendingBiographyViews: 0,
      })
    } catch (error) {
      console.error('Failed to clear guest session:', error)
    }
  },

  getSessionId: () => {
    return get().session?.id || null
  },

  trackPageView: (isAuthenticated: boolean) => {
    const state = get()
    if (isAuthenticated || !state.isInitialized || !state.session) return

    const updatedSession = {
      ...state.session,
      pageViews: state.session.pageViews + 1,
      lastActiveAt: Date.now(),
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
    const newBiographyViews = state.session.biographyViews + 1
    const updatedSession: GuestSession = {
      ...state.session,
      biographyViews: newBiographyViews,
      lastActiveAt: Date.now(),
      // 本地也計算是否達到資格
      isEligibleToShare: newBiographyViews >= SHARE_ELIGIBILITY_THRESHOLD,
    }
    await saveSessionToLocal(updatedSession)

    const wasEligible = state.session.isEligibleToShare
    const nowEligible = updatedSession.isEligibleToShare

    set({
      session: updatedSession,
      _pendingBiographyViews: state._pendingBiographyViews + 1,
      justBecameEligible: !wasEligible && nowEligible,
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
        await saveSessionToLocal(syncedSession)
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
        await saveSessionToLocal(updatedSession)
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

  trackInteraction: async (interaction) => {
    const session = await get().getOrCreateSession()

    const newInteraction: GuestInteraction = {
      ...interaction,
      timestamp: Date.now(),
    }

    const updatedSession: GuestSession = {
      ...session,
      lastActiveAt: Date.now(),
      interactions: [...session.interactions, newInteraction],
    }

    try {
      await saveSessionToLocal(updatedSession)
      set({ session: updatedSession })
    } catch (error) {
      console.error('Failed to track interaction:', error)
    }
  },

  getInteractions: (type) => {
    const { session } = get()
    if (!session) return []

    if (type) {
      return session.interactions.filter((i) => i.type === type)
    }

    return session.interactions
  },

  hasInteracted: (targetType, targetId, interactionType) => {
    const { session } = get()
    if (!session) return false

    return session.interactions.some(
      (i) =>
        i.targetType === targetType &&
        i.targetId === targetId &&
        (!interactionType || i.type === interactionType)
    )
  },

  setJustBecameEligible: (value: boolean) => {
    set({ justBecameEligible: value })
  },

  _incrementPendingTime: (seconds: number) => {
    set((state) => ({
      _pendingTimeSpent: state._pendingTimeSpent + seconds,
    }))
  },

  migrateToUser: async (userId) => {
    const { session } = get()
    if (!session) return []

    const interactions = [...session.interactions]

    // 清除訪客 session
    await get().clearSession()

    // TODO: 發送互動記錄到後端進行合併
    // await apiClient.post('/guest/migrate', { user_id: userId, interactions })

    return interactions
  },
}))

// 導出常數供外部使用
export { SYNC_INTERVAL, TIME_TRACK_INTERVAL, SHARE_ELIGIBILITY_THRESHOLD }
