/**
 * 人物誌相關類型定義
 */

// ============================================
// 人生清單分類
// ============================================

/**
 * 人生清單分類
 */
export type BucketListCategory =
  | 'outdoor_route'
  | 'indoor_grade'
  | 'competition'
  | 'training'
  | 'adventure'
  | 'skill'
  | 'injury_recovery'
  | 'other'

// ============================================
// 人物誌主要類型
// ============================================

/**
 * 人物誌介面 (後端格式)
 */
export interface Biography {
  id: string
  user_id: string | null
  name: string
  slug: string
  title: string | null
  bio: string | null
  avatar_url: string | null
  cover_image: string | null

  // 媒體與社群
  social_links: string | null
  youtube_channel_id: string | null
  featured_video_id: string | null

  // 狀態
  achievements: string | null
  is_featured: number
  published_at: string | null
  created_at: string
  updated_at: string

  // 統計
  total_likes: number
  total_views: number
  follower_count: number
  comment_count: number

  // V2 欄位
  visibility: 'private' | 'anonymous' | 'community' | 'public' | null
  tags_data: string | null
  basic_info_data: string | null
  one_liners_data: string | null
  stories_data: string | null
  autosave_at: string | null
}

/**
 * 人物誌相鄰記錄介面
 */
export interface BiographyAdjacent {
  previous: {
    id: string
    slug?: string
    name: string
    avatar_url: string | null
  } | null
  next: {
    id: string
    slug?: string
    name: string
    avatar_url: string | null
  } | null
}

// ============================================
// 核心故事相關
// ============================================

/**
 * 核心故事問題
 */
export interface CoreStoryQuestion {
  id: string
  title: string
  subtitle: string | null
  placeholder: string | null
  display_order: number
  is_active: number
}

/**
 * 人物誌核心故事
 */
export interface BiographyCoreStory {
  id: string
  biography_id: string
  question_id: string
  content: string
  is_hidden: number
  like_count: number
  comment_count: number
  display_order: number
  created_at: string
  updated_at: string
}

// ============================================
// 一句話問答相關
// ============================================

/**
 * 一句話問題
 */
export interface OneLinerQuestion {
  id: string
  question: string
  format_hint: string | null
  placeholder: string | null
  display_order: number
  is_active: number
  source?: 'system' | 'user'
  order?: number
}

/**
 * 人物誌一句話
 */
export interface BiographyOneLiner {
  id: string
  biography_id: string
  question_id: string
  question_text: string | null
  answer: string
  source: string
  is_hidden: number
  like_count: number
  comment_count: number
  display_order: number
  created_at: string
  updated_at: string
}

// ============================================
// 深度故事相關
// ============================================

/**
 * 故事分類
 */
export interface StoryCategory {
  id: string
  name: string
  icon: string | null
  description: string | null
  display_order: number
  is_active: number
}

/**
 * 故事問題
 */
export interface StoryQuestion {
  id: string
  category_id: string
  title: string
  subtitle: string | null
  placeholder: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  display_order: number
  is_active: number
  source?: 'system' | 'user'
  order?: number
}

/**
 * 人物誌故事
 */
export interface BiographyStory {
  id: string
  biography_id: string
  question_id: string
  question_text: string | null
  category_id: string | null
  content: string
  source: string
  character_count: number
  is_hidden: number
  like_count: number
  comment_count: number
  display_order: number
  created_at: string
  updated_at: string
}

// ============================================
// 按讚與留言相關
// ============================================

/**
 * 內容按讚基礎介面
 */
export interface ContentLike {
  id: string
  user_id: string
  created_at: string
}

/**
 * 核心故事按讚
 */
export interface CoreStoryLike extends ContentLike {
  core_story_id: string
}

/**
 * 一句話按讚
 */
export interface OneLinerLike extends ContentLike {
  one_liner_id: string
}

/**
 * 故事按讚
 */
export interface StoryLike extends ContentLike {
  story_id: string
}

/**
 * 內容留言基礎介面
 */
export interface ContentComment {
  id: string
  user_id?: string
  user_name?: string
  content: string
  parent_id?: string | null
  created_at: string
  updated_at?: string
}

/**
 * 核心故事留言
 */
export interface CoreStoryComment extends ContentComment {
  core_story_id: string
}

/**
 * 一句話留言
 */
export interface OneLinerComment extends ContentComment {
  one_liner_id: string
}

/**
 * 故事留言
 */
export interface StoryComment extends ContentComment {
  story_id: string
}

/**
 * 帶使用者資訊的留言
 */
export interface CommentWithUser extends ContentComment {
  username: string
  display_name: string | null
  avatar_url: string | null
}

// ============================================
// 人生清單相關
// ============================================

/**
 * 里程碑
 */
export interface Milestone {
  id: string
  title: string
  percentage: number
  completed: boolean
  completed_at: string | null
  note: string | null
}

/**
 * 人生清單項目
 */
export interface BucketListItem {
  id: string
  biography_id: string
  title: string
  category: BucketListCategory
  description: string | null
  target_grade: string | null
  target_location: string | null
  target_date: string | null
  status: 'active' | 'completed' | 'archived'
  completed_at: string | null
  enable_progress: boolean
  progress_mode: 'manual' | 'milestone' | null
  progress: number
  milestones: Milestone[] | null
  completion_story: string | null
  psychological_insights: string | null
  technical_insights: string | null
  completion_media: {
    youtube_videos?: string[]
    instagram_posts?: string[]
    photos?: string[]
  } | null
  is_public: boolean
  likes_count: number
  inspired_count: number
  comments_count: number
  sort_order: number
  created_at: string
  updated_at: string
}

// ============================================
// 攀岩足跡相關
// ============================================

/**
 * 攀岩足跡地點
 */
export interface ClimbingLocation {
  location: string
  country: string
  visit_year: string | null
  notes: string | null
  photos: string[] | null
  is_public: boolean
}

/**
 * 攀岩足跡地點 (資料庫記錄)
 */
export interface ClimbingLocationRecord {
  id: string
  biography_id: string
  location: string
  country: string
  visit_year: string | null
  notes: string | null
  photos: string[] | null
  is_public: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// ============================================
// 社群連結相關
// ============================================

/**
 * 社群連結
 */
export interface BiographySocialLinks {
  instagram?: string
  youtube?: string
  youtube_channel?: string
  facebook?: string
  threads?: string
  website?: string
}

// ============================================
// 追蹤關係
// ============================================

/**
 * 追蹤關係
 */
export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

// ============================================
// V2 人物誌編輯器相關類型
// ============================================

/**
 * 可見性等級
 */
export type VisibilityLevel = 'private' | 'anonymous' | 'community' | 'public'

/**
 * 儲存狀態
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * 內容來源
 */
export type ContentSource = 'system' | 'user'

/**
 * 標籤選項
 */
export interface TagOption {
  id: string
  label: string
  description?: string
  source?: ContentSource
  dimension_id?: string
  order?: number
}

/**
 * 標籤維度
 */
export interface TagDimension {
  id: string
  name: string
  icon: string
  emoji?: string
  description?: string
  selection_mode: 'single' | 'multiple'
  options: TagOption[]
  source?: ContentSource
  order?: number
}

/**
 * 標籤選擇 (用於 BiographyV2.tags)
 */
export interface TagSelection {
  dimension_id: string
  tag_ids: string[]
}

/**
 * 社群連結 (簡化版別名)
 */
export type SocialLinks = BiographySocialLinks

/**
 * 一句話回答 (V2 編輯器格式)
 */
export interface OneLiner {
  id: string
  question_id: string
  question_text?: string
  answer: string
  source?: ContentSource
  is_hidden?: boolean
}

/**
 * 故事回答 (V2 編輯器格式)
 */
export interface Story {
  id: string
  question_id: string
  question_text?: string
  category_id?: string
  content: string
  source?: ContentSource
  is_hidden?: boolean
}

/**
 * 故事分類定義 (包含問題列表)
 */
export interface StoryCategoryDefinition {
  id: string
  name: string
  icon?: string
  description?: string
  questions: StoryQuestion[]
}

/**
 * 人物誌基本資訊 (V2)
 */
export interface BiographyBasicInfo {
  name: string
  title?: string
  bio?: string
  avatar_url?: string
  cover_image?: string
  climbing_years?: number
  home_crag?: string
  climbing_style?: string[]
  social_links?: SocialLinks
}

/**
 * 人物誌 V2 介面 (前端編輯器格式)
 */
export interface BiographyV2 {
  id: string
  user_id: string | null
  slug: string

  // 基本資訊
  basic_info: BiographyBasicInfo

  // 可見性
  visibility: VisibilityLevel

  // 標籤
  tags: TagSelection[]

  // 自訂標籤維度
  custom_dimensions?: TagDimension[]

  // 自訂標籤
  custom_tags?: TagOption[]

  // 一句話回答
  one_liners: OneLiner[]

  // 故事
  stories: Story[]

  // 時間戳
  created_at: string
  updated_at: string
  autosave_at?: string

  // 統計
  total_likes?: number
  total_views?: number
  follower_count?: number
  comment_count?: number
}
