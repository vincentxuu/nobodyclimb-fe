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
  // 攀岩相關字段
  climbing_start_year: string | null
  frequent_locations: string | null
  favorite_route_type: string | null
  climbing_reason: string | null
  climbing_meaning: string | null
  bucket_list: string | null
  advice: string | null
  achievements: string | null
  social_links: string | null
  gallery_images?: string | null // JSON 格式的圖片資料（可選）
  is_featured: number
  is_public: number
  published_at: string | null
  created_at: string
  updated_at: string
}

/**
 * 人物誌相鄰記錄介面（上一篇/下一篇）
 */
export interface BiographyAdjacent {
  previous: {
    id: string
    name: string
    avatar_url: string | null
  } | null
  next: {
    id: string
    name: string
    avatar_url: string | null
  } | null
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
  climbing_reason?: string
  climbing_meaning?: string
  bucket_list?: string
  advice?: string
  achievements?: string
  social_links?: string
  is_public?: number
  gallery_images?: string // JSON 格式的圖片資料
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
 * 天氣資訊介面
 */
export interface Weather {
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
