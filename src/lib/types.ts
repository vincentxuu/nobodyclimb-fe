// 使用者介面
export interface User {
  id: string
  username: string
  email: string
  avatar?: string
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

// 文章介面
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

// 攀岩館介面
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
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
  }
  createdAt: Date
  updatedAt?: Date
  facilities?: string[]
  likes: number
  reviews: number
  rating: number
}

// 相簿介面
export interface Gallery {
  id: string
  title: string
  slug: string
  description: string
  coverImage: string
  images: string[]
  createdAt: Date
  updatedAt?: Date
  authorId: string
  author?: User
  likes: number
  views: number
}

// 評論介面
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
}

// 分頁回應介面
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasMore: boolean
  }
}

// 搜尋參數介面
export interface SearchParams {
  query: string
  type?: 'all' | 'post' | 'gym' | 'gallery' | 'user'
  tags?: string[]
  facilities?: string[]
  sortBy?: 'date' | 'popularity'
  page?: number
  limit?: number
}

// 認證介面
export interface AuthState {
  user: User | null
  isLoggedIn: boolean
  token: string | null
  loading: boolean
  error: string | null
}

// 登入表單介面
export interface LoginFormData {
  email: string
  password: string
  remember?: boolean
}

// 註冊表單介面
export interface RegisterFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

// 用戶資料更新表單介面
export interface UpdateProfileFormData {
  username?: string
  email?: string
  bio?: string
  currentPassword?: string
  newPassword?: string
  confirmNewPassword?: string
}

// API 回應介面
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
