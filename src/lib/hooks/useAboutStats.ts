/**
 * About 頁面統計資料 Hook
 * 混合使用本地 JSON 和後端 API
 * - 本地 JSON：岩館、岩場、路線
 * - 靜態 JSON (fetch)：影片
 * - 後端 API：文章、人物誌
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLocalStats } from '@/lib/stats-data'
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
 * 預設統計值（用於載入中或錯誤時的 fallback）
 */
const DEFAULT_DB_STATS = {
  biographies: 50,
  posts: 0,
}

const DEFAULT_VIDEOS_COUNT = 6500

/**
 * 取得 About 頁面統計資料的 Hook
 *
 * @returns 包含統計資料的物件
 *
 * @example
 * ```tsx
 * const { stats, isLoading } = useAboutStats()
 * return <div>{stats.crags} 個岩場</div>
 * ```
 */
export function useAboutStats() {
  // 從本地 JSON 檔案取得統計（岩館、岩場、路線）
  const localStats = useMemo(() => getLocalStats(), [])

  // 從後端 API 取得統計（文章、人物誌）
  const dbQuery = useQuery({
    queryKey: ['site-stats-db'],
    queryFn: async () => {
      const response = await statsService.getStats()
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch stats')
      }
      return {
        biographies: response.data.biographies,
        posts: response.data.posts,
      }
    },
    staleTime: STATS_STALE_TIME,
    gcTime: STATS_STALE_TIME * 2,
    retry: 2,
    retryDelay: 1000,
  })

  // 從 public/data/videos.json 取得影片數量
  const videosQuery = useQuery({
    queryKey: ['videos-count'],
    queryFn: async () => {
      const response = await fetch('/data/videos.json')
      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }
      const videos = await response.json() as unknown[]
      return videos.length
    },
    staleTime: STATS_STALE_TIME,
    gcTime: STATS_STALE_TIME * 2,
    retry: 2,
    retryDelay: 1000,
  })

  // 合併本地和 API 數據
  const stats: AboutStats = useMemo(() => {
    const dbStats = dbQuery.data ?? DEFAULT_DB_STATS
    const videosCount = videosQuery.data ?? DEFAULT_VIDEOS_COUNT

    return {
      gyms: localStats.gyms,
      crags: localStats.crags,
      routes: localStats.routes,
      videos: videosCount,
      biographies: dbStats.biographies,
    }
  }, [localStats, dbQuery.data, videosQuery.data])

  return {
    stats,
    isLoading: dbQuery.isLoading || videosQuery.isLoading,
    isFetching: dbQuery.isFetching || videosQuery.isFetching,
    error: dbQuery.error || videosQuery.error,
  }
}
