/**
 * 類型定義檔案
 * 此檔案為專案的單一類型定義來源
 */

// ============================================
// 使用者相關
// ============================================

/**
 * 使用者介面
 */
export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  avatarStyle?: string
  bio?: string
  createdAt: Date
  updatedAt?: Date
  displayName?: string
  climbingStartYear?: string
  frequentGym?: string
  favoriteRouteType?: string
  authProvider?: 'local' | 'google'
  socialLinks?: {
    instagram?: string
    facebook?: string
    twitter?: string
    website?: string
  }
}

/**
 * 後端 User 資料格式 (snake_case)
 */
export interface BackendUser {
  id: string
  email: string
  username: string
  display_name?: string
  avatar_url?: string
  bio?: string
  climbing_start_year?: string
  frequent_gym?: string
  favorite_route_type?: string
  role: 'user' | 'admin' | 'moderator'
  is_active?: number
  email_verified?: number
  google_id?: string
  auth_provider?: 'local' | 'google'
  created_at: string
  updated_at?: string
}

/**
 * 將後端 User 格式轉換為前端格式
 */
export function mapBackendUserToUser(backendUser: BackendUser): User {
  return {
    id: backendUser.id,
    email: backendUser.email,
    username: backendUser.username,
    displayName: backendUser.display_name,
    avatar: backendUser.avatar_url,
    bio: backendUser.bio,
    climbingStartYear: backendUser.climbing_start_year,
    frequentGym: backendUser.frequent_gym,
    favoriteRouteType: backendUser.favorite_route_type,
    authProvider: backendUser.auth_provider,
    createdAt: new Date(backendUser.created_at),
  }
}

// ============================================
// 內容相關
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

  // ═══════════════════════════════════════════
  // 第一層：攀岩基本資訊（必填）
  // ═══════════════════════════════════════════
  climbing_start_year: string | null // 哪一年開始攀岩
  frequent_locations: string | null // 平常出沒的地方 (逗號分隔)
  favorite_route_type: string | null // 喜歡的路線型態 (抱石/先鋒/速度/傳攀)

  // ═══════════════════════════════════════════
  // 第二層：核心故事（強烈建議填寫）
  // ═══════════════════════════════════════════
  climbing_origin: string | null // 你與攀岩的相遇 (原 climbing_reason)
  climbing_meaning: string | null // 攀岩對你來說是什麼
  advice_to_self: string | null // 給剛開始攀岩的自己 (原 advice)

  // ═══════════════════════════════════════════
  // 第三層：進階故事（選填 30 題）
  // ═══════════════════════════════════════════

  // A. 成長與突破（6題）
  memorable_moment: string | null // 最難忘的攀登經歷
  biggest_challenge: string | null // 遇到的最大挑戰與如何面對
  breakthrough_story: string | null // 最大的突破經歷
  first_outdoor: string | null // 第一次戶外攀岩的經歷
  first_grade: string | null // 第一次完攀某個難度的感覺
  frustrating_climb: string | null // 最挫折的一次攀登經歷

  // B. 心理與哲學（6題）
  fear_management: string | null // 如何克服攀岩中的恐懼
  climbing_lesson: string | null // 攀岩教會你最重要的一件事
  failure_perspective: string | null // 攀岩如何改變你看待失敗
  flow_moment: string | null // 在岩壁上的心流時刻
  life_balance: string | null // 攀岩與生活的平衡
  unexpected_gain: string | null // 攀岩帶給你的意外收穫

  // C. 社群與連結（6題）
  climbing_mentor: string | null // 攀岩路上的貴人
  climbing_partner: string | null // 最喜歡的攀岩夥伴與故事
  funny_moment: string | null // 攀岩時最尷尬或搞笑的時刻
  favorite_spot: string | null // 最推薦的攀岩地點與原因
  advice_to_group: string | null // 想對某個族群說的話
  climbing_space: string | null // 最難忘的岩館或攀岩空間

  // D. 實用分享（6題）
  injury_recovery: string | null // 一次受傷經歷與從中學到的事
  memorable_route: string | null // 最想分享的一次攀登經驗
  training_method: string | null // 你的訓練方式與心得
  effective_practice: string | null // 對你最有效的練習方法
  technique_tip: string | null // 一個對你很有幫助的技巧
  gear_choice: string | null // 攀岩裝備的選擇心得

  // E. 夢想與探索（6題）
  dream_climb: string | null // 夢想中的攀登
  climbing_trip: string | null // 一次特別的攀岩旅行
  bucket_list_story: string | null // 完成人生清單中某個目標的故事
  climbing_goal: string | null // 目前最想達成的攀岩目標
  climbing_style: string | null // 最吸引你的攀岩風格
  climbing_inspiration: string | null // 啟發你的攀岩者或影片

  // F. 生活整合（1題）
  life_outside_climbing: string | null // 除了攀岩，還讓我著迷的事

  // ═══════════════════════════════════════════
  // 媒體與社群
  // ═══════════════════════════════════════════
  gallery_images?: string | null // JSON 格式的圖片資料（可選）
  social_links: string | null // JSON object
  youtube_channel_id: string | null // YT 頻道 ID
  featured_video_id: string | null // 精選影片 ID

  // ═══════════════════════════════════════════
  // 狀態
  // ═══════════════════════════════════════════
  achievements: string | null
  is_featured: number | string // D1 可能回傳字串
  is_public: number | string // D1 可能回傳字串
  published_at: string | null
  created_at: string
  updated_at: string

  // ═══════════════════════════════════════════
  // 統計
  // ═══════════════════════════════════════════
  total_likes: number
  total_views: number
  follower_count: number
  comment_count: number

  // ═══════════════════════════════════════════
  // V2 欄位 - 漸進式揭露設計
  // ═══════════════════════════════════════════
  visibility?: 'private' | 'anonymous' | 'community' | 'public' | null
  tags_data?: string | null // JSON array of TagSelection
  one_liners_data?: string | null // JSON object of OneLinerData
  stories_data?: string | null // JSON object of StoriesData
  basic_info_data?: string | null // JSON object of BasicInfoData
  autosave_at?: string | null // 最後自動儲存時間
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
  location: string // 地點名稱
  country: string // 國家
  visit_year: string | null // 造訪年份
  notes: string | null // 心得筆記
  photos: string[] | null // 照片
  is_public: boolean // 是否公開
}

/**
 * 攀岩足跡地點 (正規化表格)
 */
export interface ClimbingLocationRecord {
  id: string
  biography_id: string
  location: string // 地點名稱
  country: string // 國家
  visit_year: string | null // 造訪年份
  notes: string | null // 心得筆記
  photos: string[] | null // 照片
  is_public: boolean // 是否公開
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
  field_name: string // 欄位名稱
  category: string // 分類
  prompted_at: string // 推題時間
  completed_at: string | null // 完成時間
  dismissed_count: number // 跳過次數
  last_dismissed_at: string | null // 最後跳過時間
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
 * 注意：visitors 為可選，新版 API 列表端點不回傳訪客詳情
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

/**
 * 人生清單分類
 */
export type BucketListCategory =
  | 'outdoor_route' // 戶外路線
  | 'indoor_grade' // 室內難度
  | 'competition' // 比賽目標
  | 'training' // 訓練目標
  | 'adventure' // 冒險挑戰（如海外攀岩）
  | 'skill' // 技能學習
  | 'injury_recovery' // 受傷復原
  | 'other' // 其他

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
  percentage: number // 20, 40, 60, 80, 100
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

  // 基本內容（必填）
  title: string // 目標標題
  category: BucketListCategory

  // 選填內容
  description: string | null // 詳細描述
  target_grade: string | null // 目標難度
  target_location: string | null // 目標地點
  target_date: string | null // 預計完成日期

  // 狀態（簡單三態）
  status: 'active' | 'completed' | 'archived'
  completed_at: string | null

  // 進度追蹤（選填功能）
  enable_progress: boolean // 是否開啟進度追蹤
  progress_mode: 'manual' | 'milestone' | null
  progress: number // 手動模式：0-100
  milestones: Milestone[] | null // 里程碑模式

  // 完成故事（選填）- 對應社群需求的「路線心得」
  completion_story: string | null
  psychological_insights: string | null // 心理層面的感想
  technical_insights: string | null // 技術層面的心得
  completion_media: {
    youtube_videos?: string[] // YouTube 影片 ID
    instagram_posts?: string[] // IG 貼文 shortcode
    photos?: string[] // 照片
  } | null

  // 社群
  is_public: boolean
  likes_count: number
  inspired_count: number // 被加入清單次數
  comments_count: number

  // 其他
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

/**
 * YouTube 影片關聯類型
 */
export type BiographyVideoRelationType =
  | 'own_content' // 自己的內容
  | 'featured_in' // 被報導
  | 'mentioned' // 被提及
  | 'recommended' // 推薦
  | 'completion_proof' // 完成證明

/**
 * YouTube 影片關聯
 */
export interface BiographyVideo {
  id: string
  biography_id: string
  video_id: string // YouTube video ID
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
  | 'own_post' // 自己的貼文
  | 'tagged' // 被標記
  | 'mentioned' // 被提及
  | 'completion_proof' // 完成證明

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
  instagram?: string // IG 用戶名
  youtube_channel?: string // YT 頻道 ID/handle
  facebook?: string
  threads?: string
  website?: string
}

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
  // 關聯的用戶資訊（查詢時 join）
  username?: string
  display_name?: string
  avatar_url?: string
}

/**
 * 目標參考（我也想做）
 */
export interface BucketListReference {
  id: string
  source_item_id: string // 原始目標
  target_biography_id: string // 參考者
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
 * 通知類型
 */
export type NotificationType =
  | 'goal_completed'
  | 'goal_liked'
  | 'goal_commented'
  | 'goal_referenced'
  | 'new_follower'
  | 'story_featured'
  | 'biography_commented'
  | 'post_liked'
  | 'post_commented'

/**
 * 通知
 */
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  actor_id: string | null
  target_id: string | null
  title: string
  message: string
  is_read: boolean
  created_at: string
  // 關聯的 actor 資訊（查詢時 join）
  actor_name?: string
  actor_avatar?: string
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

  // 第一層：基本資訊
  climbing_start_year?: string
  frequent_locations?: string
  favorite_route_type?: string

  // 第二層：核心故事
  climbing_origin?: string
  climbing_meaning?: string
  advice_to_self?: string

  // 第三層：進階故事 - A. 成長與突破
  memorable_moment?: string
  biggest_challenge?: string
  breakthrough_story?: string
  first_outdoor?: string
  first_grade?: string
  frustrating_climb?: string

  // 第三層：進階故事 - B. 心理與哲學
  fear_management?: string
  climbing_lesson?: string
  failure_perspective?: string
  flow_moment?: string
  life_balance?: string
  unexpected_gain?: string

  // 第三層：進階故事 - C. 社群與連結
  climbing_mentor?: string
  climbing_partner?: string
  funny_moment?: string
  favorite_spot?: string
  advice_to_group?: string
  climbing_space?: string

  // 第三層：進階故事 - D. 實用分享
  injury_recovery?: string
  memorable_route?: string
  training_method?: string
  effective_practice?: string
  technique_tip?: string
  gear_choice?: string

  // 第三層：進階故事 - E. 夢想與探索
  dream_climb?: string
  climbing_trip?: string
  bucket_list_story?: string
  climbing_goal?: string
  climbing_style?: string
  climbing_inspiration?: string

  // 第三層：進階故事 - F. 生活整合
  life_outside_climbing?: string

  // 媒體與社群
  gallery_images?: string // JSON
  social_links?: string // JSON
  youtube_channel_id?: string
  featured_video_id?: string

  // 狀態
  achievements?: string
  is_public?: number

  // V2 欄位
  visibility?: 'private' | 'anonymous' | 'community' | 'public'
  tags_data?: string
  one_liners_data?: string
  stories_data?: string
  basic_info_data?: string
}

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
 * 天氣資訊介面（後端 API 回應格式）
 */
export interface Weather {
  location: string
  temperature: number | null
  minTemp: number | null
  maxTemp: number | null
  condition: string | null
  precipitation: number | null // 降雨機率 %
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
 * 舊版天氣資訊介面（用於相容性）
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

// ============================================
// API 相關
// ============================================

/**
 * API 回應介面
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * 分頁回應介面
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasMore?: boolean
  }
}

/**
 * 後端分頁資訊介面 (snake_case)
 */
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  total_pages: number
}

/**
 * 後端分頁回應介面 (snake_case)
 */
export interface BackendPaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
}

/**
 * 後端文章分頁回應介面
 * 後端實際返回 { success, data: [...], pagination: {...} }
 */
export interface BackendPostPaginatedResponse {
  success: boolean
  data: BackendPost[]
  pagination: PaginationInfo
}

/**
 * 搜尋參數介面
 */
export interface SearchParams {
  query: string
  type?: 'all' | 'post' | 'gym' | 'gallery' | 'user'
  tags?: string[]
  facilities?: string[]
  sortBy?: 'date' | 'popularity' | 'latest' | 'popular' | 'rating'
  page?: number
  limit?: number
}

// ============================================
// 認證相關
// ============================================

/**
 * 認證狀態介面
 */
export interface AuthState {
  user: User | null
  isLoggedIn: boolean
  token: string | null
  loading: boolean
  error: string | null
}

/**
 * 後端認證 Token 回應介面
 */
export interface AuthTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  is_new_user?: boolean // Only returned by Google auth
}

/**
 * 後端 Refresh Token 回應介面
 */
export interface RefreshTokenResponse {
  access_token: string
  expires_in: number
}

// ============================================
// 表單相關
// ============================================

/**
 * 登入表單介面
 */
export interface LoginFormData {
  email: string
  password: string
  remember?: boolean
}

/**
 * 註冊表單介面
 */
export interface RegisterFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

/**
 * 用戶資料更新表單介面
 */
export interface UpdateProfileFormData {
  username?: string
  email?: string
  bio?: string
  currentPassword?: string
  newPassword?: string
  confirmNewPassword?: string
}

/**
 * 認證 Session 介面
 */
export interface AuthSession {
  user: User
  expires: string
}

/**
 * 認證 Token 介面
 */
export interface AuthToken {
  token: string
  expiresAt: number
}

// ============================================
// 影片相關
// ============================================

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

// ============================================
// 統計與徽章相關 (Phase 8)
// ============================================

/**
 * 故事欄位數量常數
 * 與後端 biographies.ts 保持同步
 */
export const STORY_FIELD_COUNTS = {
  /** 核心故事數量 (climbing_origin, climbing_meaning, advice_to_self) */
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
 * 使用者徽章
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
  progress: number // 0-100
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

// ============================================
// 通知相關
// ============================================

/**
 * 通知類型枚舉
 * 與後端 notifications.ts 保持同步
 */
export enum NotificationType {
  GOAL_LIKED = 'goal_liked',
  GOAL_COMMENTED = 'goal_commented',
  GOAL_REFERENCED = 'goal_referenced',
  NEW_FOLLOWER = 'new_follower',
  STORY_FEATURED = 'story_featured',
  BIOGRAPHY_COMMENTED = 'biography_commented',
  POST_LIKED = 'post_liked',
  POST_COMMENTED = 'post_commented',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}

/**
 * 通知介面
 */
export interface Notification {
  id: string
  user_id: string
  type: NotificationType | string
  actor_id: string | null
  target_id: string | null
  title: string
  message: string
  is_read: number
  created_at: string
  actor_name?: string
  actor_avatar?: string
}
