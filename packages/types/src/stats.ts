/**
 * 統計與徽章相關類型定義
 */

/**
 * 故事欄位數量常數
 */
export const STORY_FIELD_COUNTS = {
  /** 核心故事數量 */
  CORE: 3,
  /** 進階故事數量 */
  ADVANCED: 31,
  /** 總故事數量 */
  TOTAL: 34,
} as const

/**
 * 人物誌統計數據
 */
export interface BiographyStats {
  total_likes: number
  total_views: number
  follower_count: number
  following_count: number
  bucket_list: {
    total: number
    active: number
    completed: number
  }
  stories: {
    total: number
    core_completed: number
    advanced_completed: number
  }
  locations_count: number
}

/**
 * 社群總體統計
 */
export interface CommunityStats {
  total_biographies: number
  total_goals: number
  completed_goals: number
  total_stories: number
  active_users_this_week: number
  trending_categories: Array<{
    category: string
    count: number
  }>
}

/**
 * 使用者徽章記錄
 */
export interface UserBadgeRecord {
  id: string
  user_id: string
  badge_id: string
  unlocked_at: string
  created_at: string
}

/**
 * 徽章進度
 */
export interface BadgeProgress {
  badge_id: string
  current_value: number
  target_value: number
  progress: number
  unlocked: boolean
  unlocked_at: string | null
}

/**
 * 使用者徽章列表回應
 */
export interface UserBadgesResponse {
  unlocked: UserBadgeRecord[]
  progress: BadgeProgress[]
}

/**
 * 排行榜項目
 */
export interface LeaderboardItem {
  rank: number
  biography_id: string
  name: string
  avatar_url: string | null
  value: number
}

/**
 * 排行榜類型
 */
export type LeaderboardType = 'goals_completed' | 'followers' | 'likes_received'

/**
 * 活動時間線項目
 */
export interface ActivityTimelineItem {
  id: string
  type: 'goal_completed' | 'story_added' | 'badge_earned' | 'location_added'
  actor_id: string
  actor_name: string
  actor_avatar: string | null
  target_id: string | null
  target_title: string | null
  created_at: string
}
