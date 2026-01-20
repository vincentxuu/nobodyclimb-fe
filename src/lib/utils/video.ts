import type { VideoDuration, VideoPopularity } from '@/lib/types'

/**
 * 解析時長字串為分鐘數
 * @param duration - 時長字串，格式為 "MM:SS" 或 "HH:MM:SS"
 * @returns 分鐘數
 */
export const parseDuration = (duration: string): number => {
  const parts = duration.split(':').map(Number)
  if (parts.length === 2) {
    return parts[0] // MM:SS -> 返回分鐘數
  } else if (parts.length === 3) {
    return parts[0] * 60 + parts[1] // HH:MM:SS -> 轉為分鐘
  }
  return 0
}

/**
 * 根據分鐘數取得時長分類
 * @param minutes - 分鐘數
 * @returns 時長分類
 */
export const getDurationCategory = (minutes: number): VideoDuration => {
  if (minutes < 5) return 'short'
  if (minutes < 20) return 'medium'
  return 'long'
}

/**
 * 解析觀看次數字串為數字
 * @param viewCount - 觀看次數字串，可能包含 "K" 或 "M" 後綴
 * @returns 數字
 */
export const parseViewCount = (viewCount: string): number => {
  const value = viewCount.replace(/,/g, '')
  if (value.endsWith('M')) {
    return parseFloat(value.slice(0, -1)) * 1000000
  }
  if (value.endsWith('K')) {
    return parseFloat(value.slice(0, -1)) * 1000
  }
  return parseInt(value, 10) || 0
}

/**
 * 根據觀看次數取得熱門程度分類
 * @param views - 觀看次數
 * @returns 熱門程度分類
 */
export const getPopularityCategory = (views: number): VideoPopularity => {
  if (views >= 1000000) return 'viral'
  if (views >= 100000) return 'popular'
  if (views >= 10000) return 'normal'
  return 'niche'
}
