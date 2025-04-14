import { create } from 'zustand'

interface UIState {
  theme: 'light' | 'dark' | 'system'
  isNavbarOpen: boolean
  isSearchOpen: boolean
  scrollProgress: number
  searchQuery: string
  // 動作
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleNavbar: () => void
  openNavbar: () => void
  closeNavbar: () => void
  toggleSearch: () => void
  openSearch: () => void
  closeSearch: () => void
  openNavbarWithSearch: () => void
  setSearchQuery: (query: string) => void
  setScrollProgress: (progress: number) => void
}

/**
 * UI 狀態管理 Store
 * 處理導航欄、搜尋框、主題等 UI 狀態
 */
export const useUIStore = create<UIState>((set) => ({
  theme: 'system',
  isNavbarOpen: false,
  isSearchOpen: false,
  scrollProgress: 0,
  searchQuery: '',
  
  setTheme: (theme) => set({ theme }),
  
  toggleNavbar: () => set((state) => ({ isNavbarOpen: !state.isNavbarOpen })),
  
  openNavbar: () => set({ isNavbarOpen: true }),
  
  closeNavbar: () => set({ isNavbarOpen: false }),
  
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  
  openSearch: () => set({ isSearchOpen: true }),
  
  closeSearch: () => set({ 
    isSearchOpen: false,
    searchQuery: '' // 關閉搜尋時清空查詢
  }),
  
  // 同時打開導航欄和搜尋框
  openNavbarWithSearch: () => set({ 
    isNavbarOpen: true,
    isSearchOpen: true
  }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
}))
