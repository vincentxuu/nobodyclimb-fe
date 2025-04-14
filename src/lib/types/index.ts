/**
 * 使用者介面
 */
export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  bio?: string
  createdAt: Date
  // 這些可以根據需求調整
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
 * 文章介面
 */
export interface Post {
  id: string
  title: string
  slug: string
  content: string
  summary: string
  coverImage: string
  createdAt: Date
  updatedAt?: Date
  authorId: string
  author?: User
  tags: string[]
  images?: string[]
  likes: number
  comments: number
  views: number
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
  facilities?: string[]
  createdAt: Date
  updatedAt?: Date
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
  postId?: string
  gymId?: string
  galleryId?: string
  authorId: string
  author?: User
  createdAt: Date
  updatedAt?: Date
  likes: number
  replies?: Comment[]
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
  }
}

/**
 * API響應介面
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 搜尋參數介面
 */
export interface SearchParams {
  query: string
  type?: 'post' | 'gym' | 'gallery' | 'user' | 'all'
  tags?: string[]
  page?: number
  limit?: number
  sortBy?: 'latest' | 'popular' | 'rating'
}
