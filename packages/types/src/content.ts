/**
 * 內容相關類型定義
 * 包含：Post, Gym, Gallery, Crag, Route, Video 等
 */

import type { User } from './user'

// ============================================
// 文章相關
// ============================================

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
 * 文章介面 (前端)
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
 * 攀岩館介面 (前端)
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
 * 後端攀岩館資料格式 (snake_case)
 */
export interface BackendGym {
  id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  city: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  email: string | null
  website: string | null
  cover_image: string | null
  is_featured: number
  opening_hours: string | null
  facilities: string | null
  price_info: string | null
  rating_avg: number
  review_count: number
  created_at: string
  updated_at: string
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
 * 後端相簿資料格式
 */
export interface BackendGallery {
  id: string
  author_id: string
  title: string
  slug: string
  description: string | null
  cover_image: string | null
  is_featured: number
  view_count: number
  created_at: string
  updated_at: string
}

/**
 * 攝影集照片介面
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

// ============================================
// 岩場相關
// ============================================

/**
 * 岩場介面 (前端)
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
 * 後端岩場資料格式
 */
export interface BackendCrag {
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
  climbing_types: string | null
  difficulty_range: string | null
  route_count: number
  bolt_count: number
  cover_image: string | null
  images: string | null
  is_featured: number
  access_info: string | null
  parking_info: string | null
  approach_time: number | null
  best_seasons: string | null
  restrictions: string | null
  rating_avg: number
  review_count: number
  created_at: string
  updated_at: string
}

/**
 * 路線介面 (前端)
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
 * 後端路線資料格式
 */
export interface BackendRoute {
  id: string
  crag_id: string
  name: string
  grade: string | null
  grade_system: string
  height: number | null
  bolt_count: number | null
  route_type: 'sport' | 'trad' | 'boulder' | 'mixed'
  description: string | null
  first_ascent: string | null
  created_at: string
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
 * 影片熱門程度分類
 */
export type VideoPopularity = 'viral' | 'popular' | 'normal' | 'niche'

/**
 * 影片介面 (前端)
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
  duration: string
  durationCategory: VideoDuration
  viewCount: string
  category: VideoCategory
  tags?: string[]
  featured?: boolean
}

/**
 * 後端影片資料格式
 */
export interface BackendVideo {
  id: string
  title: string
  slug: string
  description: string | null
  youtube_id: string | null
  vimeo_id: string | null
  thumbnail_url: string | null
  duration: number | null
  category: string | null
  tags: string | null
  is_featured: number
  view_count: number
  published_at: string | null
  created_at: string
  updated_at: string
}

// ============================================
// 評論相關
// ============================================

/**
 * 評論介面 (前端)
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
 * 後端評論資料格式
 */
export interface BackendComment {
  id: string
  user_id: string
  entity_type: 'post' | 'gallery' | 'video'
  entity_id: string
  parent_id: string | null
  content: string
  created_at: string
  updated_at: string
}

// ============================================
// 評價相關
// ============================================

/**
 * 後端評價資料格式
 */
export interface BackendReview {
  id: string
  user_id: string
  entity_type: 'gym' | 'crag'
  entity_id: string
  rating: number
  content: string | null
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
 * 後端天氣資料格式
 */
export interface WeatherData {
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
