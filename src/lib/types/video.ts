/**
 * 影片相關類型定義
 */

/**
 * 影片分類
 */
export type VideoCategory =
  | '戶外攀岩'
  | '室內攀岩'
  | '競技攀岩'
  | '抱石'
  | '教學影片'
  | '紀錄片'
  | '裝備評測'

/**
 * 影片時長分類
 */
export type VideoDuration = 'short' | 'medium' | 'long' // <5min, 5-20min, >20min

/**
 * 影片時長篩選選項
 */
export const VIDEO_DURATION_OPTIONS: { value: VideoDuration | 'all'; label: string }[] = [
  { value: 'all', label: '全部時長' },
  { value: 'short', label: '短片 (<5分鐘)' },
  { value: 'medium', label: '中片 (5-20分鐘)' },
  { value: 'long', label: '長片 (>20分鐘)' },
]

/**
 * 影片熱門程度分類
 */
export type VideoPopularity = 'viral' | 'popular' | 'normal' | 'niche' // 100萬+, 10萬-100萬, 1萬-10萬, <1萬

/**
 * 影片熱門程度篩選選項
 */
export const VIDEO_POPULARITY_OPTIONS: { value: VideoPopularity | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'viral', label: '百萬點閱' },
  { value: 'popular', label: '熱門' },
  { value: 'normal', label: '一般' },
  { value: 'niche', label: '小眾' },
]

/**
 * 影片介面
 */
export interface Video {
  id: string
  youtubeId: string
  title: string
  description: string
  thumbnailUrl: string
  channel: string
  channelId?: string
  publishedAt: string
  duration: string // 格式: "MM:SS" 或 "HH:MM:SS"
  durationCategory: VideoDuration
  viewCount: string
  category: VideoCategory
  tags?: string[]
  featured?: boolean
}
