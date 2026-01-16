/**
 * About 頁面統計資料 Hook
 * 從後端 API 取得即時統計數據，支援 10 分鐘快取
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { statsService, SiteStats } from '@/lib/api/services'

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
}

/**
 * 預設統計值（用於載入中或錯誤時的 fallback）
 */
export const DEFAULT_STATS: AboutStats = {
  crags: 5,
  routes: 600,
  biographies: 50,
  videos: 100,
}

/**
 * 取得 About 頁面統計資料的 Hook
 *
 * @returns 包含統計資料、載入狀態和錯誤的物件
 *
 * @example
 * ```tsx
 * const { stats, isLoading, error } = useAboutStats()
 *
 * if (isLoading) return <Skeleton />
 * return <div>{stats.crags} 個岩場</div>
 * ```
 */
export function useAboutStats() {
  const query = useQuery({
    queryKey: ['site-stats'],
    queryFn: async () => {
      const response = await statsService.getStats()
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch stats')
      }
      return response.data
    },
    staleTime: STATS_STALE_TIME,
    gcTime: STATS_STALE_TIME * 2, // 保留快取時間
    retry: 2,
    retryDelay: 1000,
  })

  // 轉換為 About 頁面需要的格式（使用 useMemo 優化）
  const stats: AboutStats = useMemo(() => {
    if (!query.data) {
      return DEFAULT_STATS
    }
    return {
      crags: query.data.crags,
      routes: query.data.routes,
      biographies: query.data.biographies,
      videos: query.data.videos,
    }
  }, [query.data])

  return {
    stats,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    // 原始資料（包含完整統計）
    rawData: query.data as SiteStats | undefined,
  }
}
