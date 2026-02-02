/**
 * 內容狀態管理
 *
 * 對應 apps/web/src/store/contentStore.ts
 */
import { create } from 'zustand'

interface ContentItem {
  id: string
  type: 'article' | 'biography' | 'crag' | 'gym' | 'video'
  title: string
  slug?: string
  viewedAt: number
}

interface BookmarkItem {
  id: string
  type: 'article' | 'biography' | 'crag' | 'gym'
  title: string
  bookmarkedAt: number
}

interface LikeItem {
  id: string
  type: 'article' | 'biography' | 'story' | 'comment'
  likedAt: number
}

interface ContentState {
  // 瀏覽歷史
  recentlyViewed: ContentItem[]
  addToRecentlyViewed: (item: Omit<ContentItem, 'viewedAt'>) => void
  clearRecentlyViewed: () => void

  // 收藏
  bookmarks: BookmarkItem[]
  addBookmark: (item: Omit<BookmarkItem, 'bookmarkedAt'>) => void
  removeBookmark: (id: string, type: BookmarkItem['type']) => void
  isBookmarked: (id: string, type: BookmarkItem['type']) => boolean
  clearBookmarks: () => void

  // 按讚
  likes: LikeItem[]
  addLike: (item: Omit<LikeItem, 'likedAt'>) => void
  removeLike: (id: string, type: LikeItem['type']) => void
  isLiked: (id: string, type: LikeItem['type']) => boolean
  clearLikes: () => void

  // 草稿
  drafts: Map<string, any>
  saveDraft: (key: string, content: any) => void
  getDraft: (key: string) => any | undefined
  deleteDraft: (key: string) => void
  clearDrafts: () => void

  // 搜尋歷史
  searchHistory: string[]
  addSearchHistory: (query: string) => void
  removeSearchHistory: (query: string) => void
  clearSearchHistory: () => void
}

const MAX_RECENTLY_VIEWED = 50
const MAX_SEARCH_HISTORY = 20

export const useContentStore = create<ContentState>((set, get) => ({
  // 瀏覽歷史
  recentlyViewed: [],

  addToRecentlyViewed: (item) => {
    set((state) => {
      // 移除重複項目
      const filtered = state.recentlyViewed.filter(
        (existing) => !(existing.id === item.id && existing.type === item.type)
      )

      const newItem: ContentItem = {
        ...item,
        viewedAt: Date.now(),
      }

      // 新項目放在最前面，限制最大數量
      return {
        recentlyViewed: [newItem, ...filtered].slice(0, MAX_RECENTLY_VIEWED),
      }
    })
  },

  clearRecentlyViewed: () => {
    set({ recentlyViewed: [] })
  },

  // 收藏
  bookmarks: [],

  addBookmark: (item) => {
    set((state) => {
      // 檢查是否已收藏
      const exists = state.bookmarks.some(
        (b) => b.id === item.id && b.type === item.type
      )
      if (exists) return state

      const newBookmark: BookmarkItem = {
        ...item,
        bookmarkedAt: Date.now(),
      }

      return {
        bookmarks: [newBookmark, ...state.bookmarks],
      }
    })
  },

  removeBookmark: (id, type) => {
    set((state) => ({
      bookmarks: state.bookmarks.filter(
        (b) => !(b.id === id && b.type === type)
      ),
    }))
  },

  isBookmarked: (id, type) => {
    return get().bookmarks.some((b) => b.id === id && b.type === type)
  },

  clearBookmarks: () => {
    set({ bookmarks: [] })
  },

  // 按讚
  likes: [],

  addLike: (item) => {
    set((state) => {
      const exists = state.likes.some(
        (l) => l.id === item.id && l.type === item.type
      )
      if (exists) return state

      const newLike: LikeItem = {
        ...item,
        likedAt: Date.now(),
      }

      return {
        likes: [newLike, ...state.likes],
      }
    })
  },

  removeLike: (id, type) => {
    set((state) => ({
      likes: state.likes.filter((l) => !(l.id === id && l.type === type)),
    }))
  },

  isLiked: (id, type) => {
    return get().likes.some((l) => l.id === id && l.type === type)
  },

  clearLikes: () => {
    set({ likes: [] })
  },

  // 草稿
  drafts: new Map(),

  saveDraft: (key, content) => {
    set((state) => {
      const newDrafts = new Map(state.drafts)
      newDrafts.set(key, {
        content,
        savedAt: Date.now(),
      })
      return { drafts: newDrafts }
    })
  },

  getDraft: (key) => {
    const draft = get().drafts.get(key)
    return draft?.content
  },

  deleteDraft: (key) => {
    set((state) => {
      const newDrafts = new Map(state.drafts)
      newDrafts.delete(key)
      return { drafts: newDrafts }
    })
  },

  clearDrafts: () => {
    set({ drafts: new Map() })
  },

  // 搜尋歷史
  searchHistory: [],

  addSearchHistory: (query) => {
    const trimmed = query.trim()
    if (!trimmed) return

    set((state) => {
      // 移除重複項目
      const filtered = state.searchHistory.filter((q) => q !== trimmed)

      // 新項目放在最前面，限制最大數量
      return {
        searchHistory: [trimmed, ...filtered].slice(0, MAX_SEARCH_HISTORY),
      }
    })
  },

  removeSearchHistory: (query) => {
    set((state) => ({
      searchHistory: state.searchHistory.filter((q) => q !== query),
    }))
  },

  clearSearchHistory: () => {
    set({ searchHistory: [] })
  },
}))
