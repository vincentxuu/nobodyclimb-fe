/**
 * 內容相關類型定義
 * 包含：Post, Gym, Gallery, Biography, BucketList, Crag, Route 等
 */

import type { User } from './user'

// ============================================
// 文章相關
// ============================================

/**
 * 文章介面
 */
export interface Post {
  id: string
  title: string
  slug: string
  content: string
  summary: string
  coverImage: string
  images?: string[]
  createdAt: Date
  updatedAt?: Date
  authorId: string
  author?: User
  tags: string[]
  likes: number
  comments: number
  views: number
}

/**
 * 文章分類 (URL 參數值)
 */
export type PostCategory =
  | 'beginner'
  | 'news'
  | 'gear'
  | 'skills'
  | 'training'
  | 'routes'
  | 'crags'
  | 'gyms'
  | 'travel'
  | 'competition'
  | 'events'
  | 'community'
  | 'injury'

/**
 * 文章分類選項（含顯示名稱）
 */
export const POST_CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'beginner', label: '新手入門' },
  { value: 'news', label: '新聞動態' },
  { value: 'gear', label: '裝備分享' },
  { value: 'skills', label: '技巧分享' },
  { value: 'training', label: '訓練計畫' },
  { value: 'routes', label: '路線攻略' },
  { value: 'crags', label: '岩場開箱' },
  { value: 'gyms', label: '岩館開箱' },
  { value: 'travel', label: '攀岩旅遊' },
  { value: 'competition', label: '賽事介紹' },
  { value: 'events', label: '活動介紹' },
  { value: 'community', label: '社群資源' },
  { value: 'injury', label: '傷害防護' },
]

/**
 * 根據分類值取得顯示標籤
 */
export const getCategoryLabel = (value: PostCategory | null | undefined): string => {
  if (!value) return ''
  return POST_CATEGORIES.find((c) => c.value === value)?.label || value
}

/**
 * 後端文章資料格式 (snake_case)
 */
export interface BackendPost {
  id: string
  author_id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image: string | null
  category: PostCategory | null
  status: 'draft' | 'published' | 'archived'
  is_featured: number
  view_count: number
  published_at: string | null
  created_at: string
  updated_at: string
  tags?: string[]
  username?: string
  display_name?: string
  author_avatar?: string
}

// ============================================
// 攀岩館相關
// ============================================

/**
 * 攀岩館介面
 */
export interface Gym {
  id: string
  name: string
  slug: string
  description: string
  address: string
  coverImage: string
  images?: string[]
  website?: string
  phone?: string
  openingHours?: {
    monday?: string
    tuesday?: string
    wednesday?: string
    thursday?: string
    friday?: string
    saturday?: string
    sunday?: string
  }
  createdAt: Date
  updatedAt?: Date
  facilities?: string[]
  likes: number
  reviews: number
  rating: number
}

// ============================================
// 相簿相關
// ============================================

/**
 * 相簿介面
 */
export interface Gallery {
  id: string
  title: string
  slug: string
  description?: string
  coverImage: string
  images: string[]
  createdAt: Date
  updatedAt?: Date
  authorId: string
  author?: User
  likes: number
  views: number
}

/**
 * 攝影集照片介面（單張照片含上傳者資訊）
 */
export interface GalleryPhoto {
  id: string
  image_url: string
  thumbnail_url?: string
  caption?: string
  location_country?: string
  location_city?: string
  location_spot?: string
  created_at: string
  author_id: string
  username: string
  display_name?: string
  author_avatar?: string
}

/**
 * 上傳照片請求介面
 */
export interface UploadPhotoInput {
  image_url: string
  thumbnail_url?: string
  caption?: string
  location_country?: string
  location_city?: string
  location_spot?: string
}

// ============================================
// 評論相關
// ============================================

/**
 * 評論介面
 */
export interface Comment {
  id: string
  content: string
  createdAt: Date
  updatedAt?: Date
  authorId: string
  author?: User
  postId?: string
  gymId?: string
  galleryId?: string
  likes: number
  replies?: Comment[]
}

// ============================================
// 人物誌相關
// ============================================

/**
 * 人物誌介面
 * 三層式設計：
 * - 第一層：基本資訊（必填）
 * - 第二層：核心故事（強烈建議）
 * - 第三層：進階故事（選填 30 題）
 */
export interface Biography {
  id: string
  user_id: string | null
  slug: string
  name: string
  title: string | null
  bio: string | null
  avatar_url: string | null
  cover_image: string | null

  // 第一層：攀岩基本資訊（必填）
  climbing_start_year: string | null
  frequent_locations: string | null
  favorite_route_type: string | null

  // 第二層：核心故事（強烈建議填寫）
  climbing_origin: string | null
  climbing_meaning: string | null
  advice_to_self: string | null

  // 第三層：進階故事（選填 30 題）
  // A. 成長與突破（6題）
  memorable_moment: string | null
  biggest_challenge: string | null
  breakthrough_story: string | null
  first_outdoor: string | null
  first_grade: string | null
  frustrating_climb: string | null

  // B. 心理與哲學（6題）
  fear_management: string | null
  climbing_lesson: string | null
  failure_perspective: string | null
  flow_moment: string | null
  life_balance: string | null
  unexpected_gain: string | null

  // C. 社群與連結（6題）
  climbing_mentor: string | null
  climbing_partner: string | null
  funny_moment: string | null
  favorite_spot: string | null
  advice_to_group: string | null
  climbing_space: string | null

  // D. 實用分享（6題）
  injury_recovery: string | null
  memorable_route: string | null
  training_method: string | null
  effective_practice: string | null
  technique_tip: string | null
  gear_choice: string | null

  // E. 夢想與探索（6題）
  dream_climb: string | null
  climbing_trip: string | null
  bucket_list_story: string | null
  climbing_goal: string | null
  climbing_style: string | null
  climbing_inspiration: string | null

  // F. 生活整合（1題）
  life_outside_climbing: string | null

  // 媒體與社群
  gallery_images?: string | null
  social_links: string | null
  youtube_channel_id: string | null
  featured_video_id: string | null

  // 狀態
  achievements: string | null
  is_featured: number | string
  is_public: number | string
  published_at: string | null
  created_at: string
  updated_at: string

  // 統計
  total_likes: number
  total_views: number
  follower_count: number
  comment_count: number

  // V2 欄位 - 漸進式揭露設計
  visibility?: 'private' | 'anonymous' | 'community' | 'public' | null
  tags_data?: string | null
  one_liners_data?: string | null
  stories_data?: string | null
  basic_info_data?: string | null
  autosave_at?: string | null
}

/**
 * 人物誌相鄰記錄介面（上一篇/下一篇）
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
 * 攀岩足跡地點 (正規化表格)
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

/**
 * 故事推題記錄
 */
export interface StoryPrompt {
  id: string
  user_id: string
  biography_id: string
  field_name: string
  category: string
  prompted_at: string
  completed_at: string | null
  dismissed_count: number
  last_dismissed_at: string | null
}

/**
 * 故事推題進度統計
 */
export interface StoryPromptStats {
  total_prompted: number
  total_completed: number
  permanently_dismissed: number
}

/**
 * 人物誌瀏覽記錄
 */
export interface BiographyView {
  id: string
  user_id: string
  biography_id: string
  view_count: number
  first_viewed_at: string
  last_viewed_at: string
}

/**
 * 地點探索 - 地點統計
 */
export interface LocationStat {
  location: string
  country: string
  visitor_count: number
  visitors?: Array<{
    biography_id: string
    name: string
    avatar_url: string | null
    visit_year: string | null
  }>
}

/**
 * 地點探索 - 地點詳情
 */
export interface LocationDetail {
  location: string
  country: string
  visitor_count: number
  visitors: Array<{
    biography_id: string
    biography_name: string
    biography_slug: string
    avatar_url: string | null
    visit_year: string | null
    notes: string | null
  }>
}

/**
 * 地點探索 - 國家統計
 */
export interface CountryStat {
  country: string
  location_count: number
  visitor_count: number
}

// ============================================
// 人生清單相關
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

/**
 * 人生清單分類選項
 */
export const BUCKET_LIST_CATEGORIES: { value: BucketListCategory; label: string }[] = [
  { value: 'outdoor_route', label: '戶外路線' },
  { value: 'indoor_grade', label: '室內難度' },
  { value: 'competition', label: '比賽目標' },
  { value: 'training', label: '訓練目標' },
  { value: 'adventure', label: '冒險挑戰' },
  { value: 'skill', label: '技能學習' },
  { value: 'injury_recovery', label: '受傷復原' },
  { value: 'other', label: '其他' },
]

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

/**
 * 創建人生清單項目請求
 */
export interface BucketListItemInput {
  title: string
  category?: BucketListCategory
  description?: string
  target_grade?: string
  target_location?: string
  target_date?: string
  status?: 'active' | 'completed' | 'archived'
  enable_progress?: boolean
  progress_mode?: 'manual' | 'milestone' | null
  progress?: number
  milestones?: Milestone[]
  is_public?: boolean
  sort_order?: number
}

/**
 * 完成人生清單目標請求
 */
export interface BucketListCompleteInput {
  completion_story?: string
  psychological_insights?: string
  technical_insights?: string
  completion_media?: {
    youtube_videos?: string[]
    instagram_posts?: string[]
    photos?: string[]
  }
}

// ============================================
// 媒體整合相關
// ============================================

/**
 * YouTube 影片關聯類型
 */
export type BiographyVideoRelationType =
  | 'own_content'
  | 'featured_in'
  | 'mentioned'
  | 'recommended'
  | 'completion_proof'

/**
 * YouTube 影片關聯
 */
export interface BiographyVideo {
  id: string
  biography_id: string
  video_id: string
  relation_type: BiographyVideoRelationType
  is_featured: boolean
  display_order: number
  created_at: string
}

/**
 * Instagram 媒體類型
 */
export type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REEL'

/**
 * Instagram 關聯類型
 */
export type BiographyInstagramRelationType =
  | 'own_post'
  | 'tagged'
  | 'mentioned'
  | 'completion_proof'

/**
 * Instagram 貼文關聯
 */
export interface BiographyInstagram {
  id: string
  biography_id: string
  instagram_url: string
  instagram_shortcode: string
  media_type: InstagramMediaType | null
  thumbnail_url: string | null
  caption: string | null
  posted_at: string | null
  relation_type: BiographyInstagramRelationType
  is_featured: boolean
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * 社群連結
 */
export interface BiographySocialLinks {
  instagram?: string
  youtube_channel?: string
  facebook?: string
  threads?: string
  website?: string
}

// ============================================
// 社群互動相關
// ============================================

/**
 * 人生清單按讚
 */
export interface BucketListLike {
  id: string
  bucket_list_item_id: string
  user_id: string
  created_at: string
}

/**
 * 人生清單留言
 */
export interface BucketListComment {
  id: string
  bucket_list_item_id: string
  user_id: string
  content: string
  created_at: string
  username?: string
  display_name?: string
  avatar_url?: string
}

/**
 * 目標參考（我也想做）
 */
export interface BucketListReference {
  id: string
  source_item_id: string
  target_biography_id: string
  created_at: string
}

/**
 * 追蹤關係
 */
export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

/**
 * 創建/更新人物誌請求介面
 */
export interface BiographyInput {
  name: string
  title?: string
  bio?: string
  avatar_url?: string
  cover_image?: string
  climbing_start_year?: string
  frequent_locations?: string
  favorite_route_type?: string
  climbing_origin?: string
  climbing_meaning?: string
  advice_to_self?: string
  memorable_moment?: string
  biggest_challenge?: string
  breakthrough_story?: string
  first_outdoor?: string
  first_grade?: string
  frustrating_climb?: string
  fear_management?: string
  climbing_lesson?: string
  failure_perspective?: string
  flow_moment?: string
  life_balance?: string
  unexpected_gain?: string
  climbing_mentor?: string
  climbing_partner?: string
  funny_moment?: string
  favorite_spot?: string
  advice_to_group?: string
  climbing_space?: string
  injury_recovery?: string
  memorable_route?: string
  training_method?: string
  effective_practice?: string
  technique_tip?: string
  gear_choice?: string
  dream_climb?: string
  climbing_trip?: string
  bucket_list_story?: string
  climbing_goal?: string
  climbing_style?: string
  climbing_inspiration?: string
  life_outside_climbing?: string
  gallery_images?: string
  social_links?: string
  youtube_channel_id?: string
  featured_video_id?: string
  achievements?: string
  is_public?: number
  visibility?: 'private' | 'anonymous' | 'community' | 'public'
  tags_data?: string
  one_liners_data?: string
  stories_data?: string
  basic_info_data?: string
}

// ============================================
// 岩場相關
// ============================================

/**
 * 岩場介面
 */
export interface Crag {
  id: string
  slug: string
  name: string
  description: string
  location: {
    latitude: number
    longitude: number
    googleMapsUrl: string
    address: string
    region: string
  }
  type: 'boulder' | 'sport' | 'trad' | 'mixed'
  difficulty: {
    min: string
    max: string
  }
  seasons: string[]
  access: {
    description: string
    parking: string
    approach: string
  }
  amenities: string[]
  photos: string[]
  featured: boolean
  rating: number
  reviews: Comment[]
  createdAt: string
  updatedAt: string
}

/**
 * Admin 岩場介面（後端格式）
 * 用於 admin API 回傳的資料
 */
export interface AdminCrag {
  id: string
  name: string
  slug: string
  description: string | null
  location: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
  altitude: number | null
  rock_type: string | null
  climbing_types: string[] | null
  difficulty_range: string | null
  route_count: number
  bolt_count: number
  cover_image: string | null
  images: string[] | null
  is_featured: number
  access_info: string | null
  parking_info: string | null
  approach_time: number | null
  best_seasons: string[] | null
  restrictions: string | null
  rating_avg: number
  review_count: number
  created_at: string
  updated_at: string
}

/**
 * 路線介面
 */
export interface Route {
  id: string
  cragId: string
  name: string
  grade: string
  type: 'boulder' | 'sport' | 'trad' | 'mixed'
  length: number
  description: string
  firstAscent: string
  photos: string[]
  rating: number
  reviews: Comment[]
  createdAt: string
  updatedAt: string
}

/**
 * 岩場區域介面（如龍洞的校門口、鐘塔、音樂廳等）
 */
export interface AdminArea {
  id: string
  crag_id: string
  name: string
  name_en: string | null
  slug: string | null
  description: string | null
  description_en: string | null
  image: string | null
  bolt_count: number
  route_count: number
  sort_order: number
  created_at: string
  updated_at: string
}

/**
 * 岩壁分區介面（如校門口的人面岩、門簷等）
 */
export interface AdminSector {
  id: string
  area_id: string
  name: string
  name_en: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

// ============================================
// 天氣相關
// ============================================

/**
 * 天氣資訊介面
 */
export interface Weather {
  location: string
  temperature: number | null
  minTemp: number | null
  maxTemp: number | null
  condition: string | null
  precipitation: number | null
  humidity?: number | null
  comfort?: string | null
  updatedAt: string
  forecast: Array<{
    date: string
    minTemp: number | null
    maxTemp: number | null
    condition: string | null
    precipitation: number | null
  }>
}

/**
 * 舊版天氣資訊介面
 * @deprecated 使用 Weather 介面替代
 */
export interface LegacyWeather {
  current: {
    temperature: number
    humidity: number
    windSpeed: number
    condition: string
    icon: string
  }
  forecast: Array<{
    date: string
    minTemp: number
    maxTemp: number
    condition: string
    icon: string
    precipitation: number
  }>
}
