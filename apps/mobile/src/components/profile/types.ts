/**
 * Profile 組件類型定義
 * 與 Web 端保持一致
 */

/**
 * 社群連結
 */
export interface SocialLinks {
  instagram: string
  youtube_channel: string
}

/**
 * 人物誌圖片
 */
export interface ProfileImage {
  id: string
  url: string
  caption?: string
  order: number
}

/**
 * 圖片排版模式
 */
export type ImageLayout = 'single' | 'double' | 'grid'

/**
 * 進階故事資料
 */
export interface AdvancedStories {
  // A. 成長與突破
  memorable_moment: string
  biggest_challenge: string
  breakthrough_story: string
  first_outdoor: string
  first_grade: string
  frustrating_climb: string
  // B. 心理與哲學
  fear_management: string
  climbing_lesson: string
  failure_perspective: string
  flow_moment: string
  life_balance: string
  unexpected_gain: string
  // C. 社群與連結
  climbing_mentor: string
  climbing_partner: string
  funny_moment: string
  favorite_spot: string
  advice_to_group: string
  climbing_space: string
  // D. 實用分享
  injury_recovery: string
  memorable_route: string
  training_method: string
  effective_practice: string
  technique_tip: string
  gear_choice: string
  // E. 夢想與探索
  dream_climb: string
  climbing_trip: string
  bucket_list_story: string
  climbing_goal: string
  climbing_style: string
  climbing_inspiration: string
  // F. 生活整合
  life_outside_climbing: string
}

export interface ProfileData {
  // 人物誌 ID（用於媒體整合）
  biographyId: string | null
  // 基本資訊
  name: string
  title: string
  startYear: string
  frequentGyms: string
  favoriteRouteType: string
  // 核心故事
  climbingReason: string
  climbingMeaning: string
  climbingBucketList: string
  adviceForBeginners: string
  // 進階故事
  advancedStories: AdvancedStories
  // 社群連結
  socialLinks: SocialLinks
  // 設定
  isPublic: boolean
  // 圖片相關
  avatarUrl: string | null // 人物誌頭像
  coverImageUrl: string | null // 人物誌封面照片
}

// 圖片限制常數
export const IMAGE_CONSTRAINTS = {
  maxCount: 5,
  maxSizeBytes: 500 * 1024, // 500KB
  maxSizeMB: 0.5,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  acceptedExtensions: '.jpg,.jpeg,.png,.webp',
}

// 初始進階故事資料
export const initialAdvancedStories: AdvancedStories = {
  // A. 成長與突破
  memorable_moment: '',
  biggest_challenge: '',
  breakthrough_story: '',
  first_outdoor: '',
  first_grade: '',
  frustrating_climb: '',
  // B. 心理與哲學
  fear_management: '',
  climbing_lesson: '',
  failure_perspective: '',
  flow_moment: '',
  life_balance: '',
  unexpected_gain: '',
  // C. 社群與連結
  climbing_mentor: '',
  climbing_partner: '',
  funny_moment: '',
  favorite_spot: '',
  advice_to_group: '',
  climbing_space: '',
  // D. 實用分享
  injury_recovery: '',
  memorable_route: '',
  training_method: '',
  effective_practice: '',
  technique_tip: '',
  gear_choice: '',
  // E. 夢想與探索
  dream_climb: '',
  climbing_trip: '',
  bucket_list_story: '',
  climbing_goal: '',
  climbing_style: '',
  climbing_inspiration: '',
  // F. 生活整合
  life_outside_climbing: '',
}

// 初始社群連結
export const initialSocialLinks: SocialLinks = {
  instagram: '',
  youtube_channel: '',
}

// 初始資料
export const initialProfileData: ProfileData = {
  biographyId: null,
  name: '',
  title: '',
  startYear: '',
  frequentGyms: '',
  favoriteRouteType: '',
  climbingReason: '',
  climbingMeaning: '',
  climbingBucketList: '',
  adviceForBeginners: '',
  advancedStories: initialAdvancedStories,
  socialLinks: initialSocialLinks,
  isPublic: true,
  avatarUrl: null,
  coverImageUrl: null,
}

/**
 * 編輯面板類型
 */
export type EditPanelType =
  | 'avatar'
  | 'basic'
  | 'climbing'
  | 'social'
  | 'core-stories'
  | 'advanced-stories'
  | 'footprints'
  | 'settings'
  | null

/**
 * Dashboard Card Props
 */
export interface DashboardCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onPress: () => void
  isComplete?: boolean
  progress?: { current: number; total: number }
  preview?: React.ReactNode
  size?: 'normal' | 'large'
}
