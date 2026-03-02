/**
 * About 頁面統計資料 Hook
 * 從後端 API 取得所有統計數據
 */

import { useQuery } from '@tanstack/react-query'
import { statsService } from '@/lib/api/services'

// 快取時間：10 分鐘
const STATS_STALE_TIME = 10 * 60 * 1000

/**
 * About 頁面顯示用的統計資料格式
 */
export interface AboutStats {
  crags: number
  routes: number
  biographies: number
  videos: number
  gyms: number
  posts: number
}

/**
 * 預設統計值（API 失敗時的 fallback）
 */
const DEFAULT_STATS: AboutStats = {
  gyms: 39,
  crags: 5,
  routes: 946,
  videos: 6500,
  biographies: 50,
  posts: 0,
}

/**
 * 取得 About 頁面統計資料的 Hook
 */
export function useAboutStats() {
  const query = useQuery({
    queryKey: ['site-stats'],
    queryFn: async () => {
      const response = await statsService.getStats()
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch stats')
      }
      return {
        gyms: response.data.gyms,
        crags: response.data.crags,
        routes: response.data.routes,
        videos: response.data.videos,
        biographies: response.data.biographies,
        posts: response.data.posts,
      }
    },
    staleTime: STATS_STALE_TIME,
    gcTime: STATS_STALE_TIME * 2,
    retry: 2,
    retryDelay: 1000,
  })

  return {
    stats: query.data ?? DEFAULT_STATS,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  }
}
