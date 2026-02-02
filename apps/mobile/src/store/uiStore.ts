/**
 * UI 狀態管理
 *
 * 對應 apps/web/src/store/uiStore.ts
 */
import { create } from 'zustand'
import { Appearance, ColorSchemeName } from 'react-native'

type ThemeMode = 'light' | 'dark' | 'system'

interface ToastConfig {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

interface ModalConfig {
  id: string
  type: string
  props?: Record<string, any>
}

interface UIState {
  // 主題
  themeMode: ThemeMode
  resolvedTheme: 'light' | 'dark'
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void

  // 載入狀態
  isGlobalLoading: boolean
  loadingMessage: string | null
  setGlobalLoading: (loading: boolean, message?: string) => void

  // Toast 通知
  toasts: ToastConfig[]
  showToast: (config: Omit<ToastConfig, 'id'>) => void
  hideToast: (id: string) => void
  clearToasts: () => void

  // Modal 管理
  modals: ModalConfig[]
  openModal: (config: Omit<ModalConfig, 'id'>) => void
  closeModal: (id: string) => void
  closeAllModals: () => void

  // 側邊欄/抽屜
  isDrawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  toggleDrawer: () => void

  // 搜尋
  isSearchOpen: boolean
  setSearchOpen: (open: boolean) => void
  toggleSearch: () => void

  // 滾動位置
  scrollPositions: Map<string, number>
  saveScrollPosition: (key: string, position: number) => void
  getScrollPosition: (key: string) => number

  // 鍵盤狀態
  isKeyboardVisible: boolean
  keyboardHeight: number
  setKeyboardState: (visible: boolean, height: number) => void

  // 網路狀態
  isOnline: boolean
  setOnline: (online: boolean) => void

  // 重置
  reset: () => void
}

const getResolvedTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  }
  return mode
}

let toastIdCounter = 0
let modalIdCounter = 0

export const useUIStore = create<UIState>((set, get) => ({
  // 主題
  themeMode: 'system',
  resolvedTheme: getResolvedTheme('system'),

  setThemeMode: (mode) => {
    set({
      themeMode: mode,
      resolvedTheme: getResolvedTheme(mode),
    })
  },

  toggleTheme: () => {
    const { themeMode } = get()
    const newMode: ThemeMode =
      themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light'
    set({
      themeMode: newMode,
      resolvedTheme: getResolvedTheme(newMode),
    })
  },

  // 載入狀態
  isGlobalLoading: false,
  loadingMessage: null,

  setGlobalLoading: (loading, message) => {
    set({
      isGlobalLoading: loading,
      loadingMessage: message || null,
    })
  },

  // Toast 通知
  toasts: [],

  showToast: (config) => {
    const id = `toast-${++toastIdCounter}`
    const duration = config.duration || 3000

    set((state) => ({
      toasts: [...state.toasts, { ...config, id }],
    }))

    // 自動移除
    setTimeout(() => {
      get().hideToast(id)
    }, duration)
  },

  hideToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  clearToasts: () => {
    set({ toasts: [] })
  },

  // Modal 管理
  modals: [],

  openModal: (config) => {
    const id = `modal-${++modalIdCounter}`
    set((state) => ({
      modals: [...state.modals, { ...config, id }],
    }))
  },

  closeModal: (id) => {
    set((state) => ({
      modals: state.modals.filter((m) => m.id !== id),
    }))
  },

  closeAllModals: () => {
    set({ modals: [] })
  },

  // 側邊欄/抽屜
  isDrawerOpen: false,

  setDrawerOpen: (open) => {
    set({ isDrawerOpen: open })
  },

  toggleDrawer: () => {
    set((state) => ({ isDrawerOpen: !state.isDrawerOpen }))
  },

  // 搜尋
  isSearchOpen: false,

  setSearchOpen: (open) => {
    set({ isSearchOpen: open })
  },

  toggleSearch: () => {
    set((state) => ({ isSearchOpen: !state.isSearchOpen }))
  },

  // 滾動位置
  scrollPositions: new Map(),

  saveScrollPosition: (key, position) => {
    set((state) => {
      const newPositions = new Map(state.scrollPositions)
      newPositions.set(key, position)
      return { scrollPositions: newPositions }
    })
  },

  getScrollPosition: (key) => {
    return get().scrollPositions.get(key) || 0
  },

  // 鍵盤狀態
  isKeyboardVisible: false,
  keyboardHeight: 0,

  setKeyboardState: (visible, height) => {
    set({
      isKeyboardVisible: visible,
      keyboardHeight: height,
    })
  },

  // 網路狀態
  isOnline: true,

  setOnline: (online) => {
    set({ isOnline: online })
  },

  // 重置
  reset: () => {
    set({
      isGlobalLoading: false,
      loadingMessage: null,
      toasts: [],
      modals: [],
      isDrawerOpen: false,
      isSearchOpen: false,
      scrollPositions: new Map(),
    })
  },
}))
