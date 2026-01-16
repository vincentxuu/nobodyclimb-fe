/**
 * About 頁面統計資料 Hook
 * 從本地 JSON 檔案計算統計數據
 */

import { useMemo } from 'react'
import { getLocalStats } from '@/lib/stats-data'

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
 * 取得 About 頁面統計資料的 Hook
 *
 * @returns 包含統計資料的物件
 *
 * @example
 * ```tsx
 * const { stats } = useAboutStats()
 * return <div>{stats.crags} 個岩場</div>
 * ```
 */
export function useAboutStats() {
  // 從本地 JSON 檔案計算統計數據
  const stats: AboutStats = useMemo(() => {
    const localStats = getLocalStats()
    return {
      crags: localStats.crags,
      routes: localStats.routes,
      biographies: localStats.biographies,
      videos: localStats.videos,
      gyms: localStats.gyms,
    }
  }, [])

  return {
    stats,
    isLoading: false, // 本地數據不需要載入
    isFetching: false,
    error: null,
  }
}
