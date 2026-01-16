/**
 * 統計資料服務層
 * 從本地 JSON 檔案計算統計數據
 */

import gymsData from '@/data/gyms.json'
import longdongData from '@/data/crags/longdong.json'
import defulanData from '@/data/crags/defulan.json'
import guanzilingData from '@/data/crags/guanziling.json'
import shoushanData from '@/data/crags/shoushan.json'
import kentingData from '@/data/crags/kenting.json'

// 所有岩場資料
const allCragsData = [
  longdongData,
  defulanData,
  guanzilingData,
  shoushanData,
  kentingData,
]

export interface LocalStats {
  gyms: number
  crags: number
  routes: number
}

/**
 * 從本地 JSON 檔案計算統計數據
 * 注意：影片從 public/data/videos.json fetch，文章和人物誌從後端 API 讀取
 */
export function getLocalStats(): LocalStats {
  // 岩館數量
  const gymsCount = (gymsData as { gyms: unknown[] }).gyms?.length ?? 0

  // 岩場數量
  const cragsCount = allCragsData.length

  // 路線總數（從各岩場的 routesCount 加總）
  const routesCount = allCragsData.reduce((total, cragData) => {
    const count = (cragData as { crag: { routesCount?: number } }).crag?.routesCount ?? 0
    return total + count
  }, 0)

  return {
    gyms: gymsCount,
    crags: cragsCount,
    routes: routesCount,
  }
}
