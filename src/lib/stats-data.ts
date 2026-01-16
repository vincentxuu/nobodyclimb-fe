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
  videos: number
  biographies: number
}

/**
 * 從本地 JSON 檔案計算統計數據
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

  // 影片和人物誌目前使用預設值（可以之後擴充）
  // 影片數量較大（6500+），暫時用預設值
  const videosCount = 6500
  const biographiesCount = 50

  return {
    gyms: gymsCount,
    crags: cragsCount,
    routes: routesCount,
    videos: videosCount,
    biographies: biographiesCount,
  }
}
