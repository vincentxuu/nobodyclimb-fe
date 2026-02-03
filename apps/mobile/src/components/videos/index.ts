/**
 * 影片組件統一導出
 *
 * 對應 apps/web/src/components/videos/
 */

// 過濾器組件
export { ChannelFilter, type ChannelFilterProps } from './ChannelFilter'
export { DurationFilter, type DurationFilterProps, VIDEO_DURATION_OPTIONS } from './DurationFilter'
export { PopularityFilter, type PopularityFilterProps, VIDEO_POPULARITY_OPTIONS } from './PopularityFilter'
export { VideoFilters, type VideoFiltersProps } from './VideoFilters'

// 影片顯示組件
export { VideoCard, type VideoCardProps } from './VideoCard'
export { VideoGrid, type VideoGridProps } from './VideoGrid'
export { VideoPlayer, type VideoPlayerProps } from './VideoPlayer'

// 類型定義
export type {
  Video,
  VideoCategory,
  VideoDuration,
  VideoPopularity,
} from './types'
