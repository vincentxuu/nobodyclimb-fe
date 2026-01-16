/**
 * About 頁面統計資料 Hook
 * - 靜態 JSON (build 時生成)：岩館、岩場、路線、影片
 * - 後端 API：人物誌
 */

import { useMemo } from 'react'
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
}

/**
 * 預設統計值
 */
const DEFAULT_LOCAL_STATS = {
  gyms: 39,
  crags: 5,
  routes: 946,
  videos: 6500,
}

const DEFAULT_DB_STATS = {
  biographies: 50,
}

/**
 * 本地統計資料格式（從 stats.json 讀取）
 */
interface LocalStatsData {
  gyms: number
  crags: number
  routes: number
  videos: number
  generatedAt: string
}

/**
 * 取得 About 頁面統計資料的 Hook
 */
export function useAboutStats() {
  // 從 /data/stats.json 讀取本地統計
  const localQuery = useQuery({
    queryKey: ['local-stats'],
    queryFn: async () => {
      const response = await fetch('/data/stats.json')
      if (!response.ok) {
        throw new Error('Failed to fetch local stats')
      }
      return response.json() as Promise<LocalStatsData>
    },
    staleTime: STATS_STALE_TIME,
    gcTime: STATS_STALE_TIME * 2,
    retry: 1,
  })

  // 從後端 API 讀取人物誌統計
  const dbQuery = useQuery({
    queryKey: ['site-stats-db'],
    queryFn: async () => {
      const response = await statsService.getStats()
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch stats')
      }
      return {
        biographies: response.data.biographies,
      }
    },
    staleTime: STATS_STALE_TIME,
    gcTime: STATS_STALE_TIME * 2,
    retry: 2,
    retryDelay: 1000,
  })

  // 合併統計數據
  const stats: AboutStats = useMemo(() => {
    const localStats = localQuery.data ?? DEFAULT_LOCAL_STATS
    const dbStats = dbQuery.data ?? DEFAULT_DB_STATS

    return {
      gyms: localStats.gyms,
      crags: localStats.crags,
      routes: localStats.routes,
      videos: localStats.videos,
      biographies: dbStats.biographies,
    }
  }, [localQuery.data, dbQuery.data])

  return {
    stats,
    isLoading: localQuery.isLoading || dbQuery.isLoading,
    isFetching: localQuery.isFetching || dbQuery.isFetching,
    error: localQuery.error || dbQuery.error,
  }
}
