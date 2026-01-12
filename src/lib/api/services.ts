import apiClient from './client'
import {
  Post,
  PostCategory,
  BackendPost,
  BackendPaginatedResponse,
  BackendPostPaginatedResponse,
  PaginationInfo,
  Gym,
  Gallery,
  GalleryPhoto,
  UploadPhotoInput,
  User,
  Comment,
  PaginatedResponse,
  ApiResponse,
  SearchParams,
  Biography,
  BiographyAdjacent,
  BiographyInput,
  Crag,
  Route,
  Weather,
} from '@/lib/types'

/**
 * 建立/更新文章請求資料
 */
interface CreatePostData {
  title: string
  slug: string
  content: string
  summary?: string
  coverImage?: string
  category?: PostCategory
  tags?: string[]
  status?: 'draft' | 'published'
}

/**
 * 認證相關 API 服務
 */
export const authService = {
  /**
   * 用戶登入
   */
  login: async (email: string, password: string) => {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/login',
      {
        email,
        password,
      }
    )
    return response.data
  },

  /**
   * 用 Google OAuth 登入
   */
  loginWithGoogle: async (token: string) => {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/google',
      {
        token,
      }
    )
    return response.data
  },

  /**
   * 用戶註冊
   */
  register: async (username: string, email: string, password: string) => {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/register',
      {
        username,
        email,
        password,
      }
    )
    return response.data
  },

  /**
   * 重設密碼請求
   */
  forgotPassword: async (email: string) => {
    const response = await apiClient.post<ApiResponse<{}>>('/auth/forgot-password', { email })
    return response.data
  },

  /**
   * 重設密碼
   */
  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post<ApiResponse<{}>>('/auth/reset-password', {
      token,
      password,
    })
    return response.data
  },

  /**
   * 獲取當前用戶資料
   */
  getCurrentUser: async () => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me')
    return response.data
  },

  /**
   * 更新用戶資料
   */
  updateProfile: async (userData: Partial<User>) => {
    const response = await apiClient.put<ApiResponse<User>>('/auth/profile', userData)
    return response.data
  },

  /**
   * 更改密碼
   */
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.post<ApiResponse<{}>>('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return response.data
  },

  /**
   * 登出
   */
  logout: async () => {
    const response = await apiClient.post<ApiResponse<{}>>('/auth/logout')
    return response.data
  },
}

/**
 * 文章相關 API 服務
 */
export const postService = {
  /**
   * 獲取文章列表
   */
  getPosts: async (page = 1, limit = 10, tags?: string[]) => {
    const response = await apiClient.get<BackendPostPaginatedResponse>('/posts', {
      params: { page, limit, tags: tags?.join(',') },
    })
    return response.data
  },

  /**
   * 獲取當前用戶的文章列表（包含所有狀態：草稿、已發布、已封存）
   */
  getMyPosts: async (page = 1, limit = 50, status?: 'draft' | 'published' | 'archived') => {
    const response = await apiClient.get<ApiResponse<BackendPaginatedResponse<BackendPost>>>('/posts/me', {
      params: { page, limit, status },
    })
    return response.data
  },

  /**
   * 獲取文章詳情（通過ID）
   */
  getPostById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<BackendPost>>(`/posts/${id}`)
    return response.data
  },

  /**
   * 獲取文章詳情（通過 Slug）
   */
  getPostBySlug: async (slug: string) => {
    const response = await apiClient.get<ApiResponse<Post>>(`/posts/slug/${slug}`)
    return response.data
  },

  /**
   * 獲取精選文章
   */
  getFeaturedPosts: async () => {
    const response = await apiClient.get<ApiResponse<BackendPost[]>>('/posts/featured')
    return response.data
  },

  /**
   * 獲取相關文章
   */
  getRelatedPosts: async (id: string, limit = 3) => {
    const response = await apiClient.get<ApiResponse<BackendPost[]>>(`/posts/${id}/related`, {
      params: { limit },
    })
    return response.data
  },

  /**
   * 獲取熱門文章
   */
  getPopularPosts: async (limit = 5) => {
    const response = await apiClient.get<ApiResponse<BackendPost[]>>('/posts/popular', {
      params: { limit },
    })
    return response.data
  },

  /**
   * 創建文章
   */
  createPost: async (postData: CreatePostData) => {
    // 轉換欄位名稱為後端格式
    const backendData = {
      title: postData.title,
      slug: postData.slug,
      content: postData.content,
      excerpt: postData.summary,
      cover_image: postData.coverImage,
      category: postData.category,
      tags: postData.tags,
      status: postData.status,
    }
    const response = await apiClient.post<ApiResponse<BackendPost>>('/posts', backendData)
    return response.data
  },

  /**
   * 更新文章
   */
  updatePost: async (id: string, postData: Partial<CreatePostData>) => {
    // 轉換欄位名稱為後端格式
    const backendData: Record<string, unknown> = {}
    if (postData.title !== undefined) backendData.title = postData.title
    if (postData.content !== undefined) backendData.content = postData.content
    if (postData.summary !== undefined) backendData.excerpt = postData.summary
    if (postData.coverImage !== undefined) backendData.cover_image = postData.coverImage
    if (postData.category !== undefined) backendData.category = postData.category
    if (postData.tags !== undefined) backendData.tags = postData.tags
    if (postData.status !== undefined) backendData.status = postData.status

    const response = await apiClient.put<ApiResponse<BackendPost>>(`/posts/${id}`, backendData)
    return response.data
  },

  /**
   * 刪除文章
   */
  deletePost: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{}>>(`/posts/${id}`)
    return response.data
  },

  /**
   * 喜歡/取消喜歡文章
   */
  toggleLike: async (id: string) => {
    const response = await apiClient.post<ApiResponse<{ liked: boolean; likes: number }>>(
      `/posts/${id}/like`
    )
    return response.data
  },

  /**
   * 獲取文章點讚狀態
   */
  getLikeStatus: async (id: string) => {
    const response = await apiClient.get<ApiResponse<{ liked: boolean; likes: number }>>(
      `/posts/${id}/like`
    )
    return response.data
  },

  /**
   * 獲取文章評論
   */
  getComments: async (postId: string) => {
    const response = await apiClient.get<ApiResponse<Comment[]>>(`/posts/${postId}/comments`)
    return response.data
  },

  /**
   * 添加文章評論
   */
  addComment: async (postId: string, content: string) => {
    const response = await apiClient.post<ApiResponse<Comment>>(`/posts/${postId}/comments`, {
      content,
    })
    return response.data
  },

  /**
   * 上傳文章圖片
   */
  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/posts/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },
}

/**
 * 攀岩館相關 API 服務
 */
export const gymService = {
  /**
   * 獲取攀岩館列表
   */
  getGyms: async (page = 1, limit = 10, facilities?: string[]) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Gym>>>('/gyms', {
      params: { page, limit, facilities: facilities?.join(',') },
    })
    return response.data
  },

  /**
   * 獲取攀岩館詳情（通過ID）
   */
  getGymById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Gym>>(`/gyms/${id}`)
    return response.data
  },

  /**
   * 獲取攀岩館詳情（通過 Slug）
   */
  getGymBySlug: async (slug: string) => {
    const response = await apiClient.get<ApiResponse<Gym>>(`/gyms/slug/${slug}`)
    return response.data
  },

  /**
   * 獲取精選攀岩館
   */
  getFeaturedGyms: async () => {
    const response = await apiClient.get<ApiResponse<Gym[]>>('/gyms/featured')
    return response.data
  },

  /**
   * 創建攀岩館資料
   */
  createGym: async (gymData: Omit<Gym, 'id' | 'createdAt' | 'likes' | 'reviews' | 'rating'>) => {
    const response = await apiClient.post<ApiResponse<Gym>>('/gyms', gymData)
    return response.data
  },

  /**
   * 更新攀岩館資料
   */
  updateGym: async (id: string, gymData: Partial<Gym>) => {
    const response = await apiClient.put<ApiResponse<Gym>>(`/gyms/${id}`, gymData)
    return response.data
  },

  /**
   * 刪除攀岩館資料
   */
  deleteGym: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{}>>(`/gyms/${id}`)
    return response.data
  },

  /**
   * 喜歡/取消喜歡攀岩館
   */
  toggleLike: async (id: string) => {
    const response = await apiClient.post<ApiResponse<{ liked: boolean; likes: number }>>(
      `/gyms/${id}/like`
    )
    return response.data
  },

  /**
   * 獲取攀岩館評論
   */
  getReviews: async (gymId: string) => {
    const response = await apiClient.get<ApiResponse<Comment[]>>(`/gyms/${gymId}/reviews`)
    return response.data
  },

  /**
   * 添加攀岩館評論與評分
   */
  addReview: async (gymId: string, content: string, rating: number) => {
    const response = await apiClient.post<ApiResponse<Comment>>(`/gyms/${gymId}/reviews`, {
      content,
      rating,
    })
    return response.data
  },

  /**
   * 上傳攀岩館圖片
   */
  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/gyms/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },
}

/**
 * 照片分頁回應介面
 */
interface PhotoPaginatedResponse {
  success: boolean
  data: GalleryPhoto[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

/**
 * 相簿相關 API 服務
 */
export const galleryService = {
  /**
   * 獲取所有照片（含上傳者資訊）
   */
  getPhotos: async (page = 1, limit = 18) => {
    const response = await apiClient.get<PhotoPaginatedResponse>('/galleries/photos', {
      params: { page, limit },
    })
    return response.data
  },

  /**
   * 上傳單張照片到攝影集
   */
  uploadPhoto: async (photoData: UploadPhotoInput) => {
    const response = await apiClient.post<ApiResponse<GalleryPhoto>>(
      '/galleries/photos',
      photoData
    )
    return response.data
  },

  /**
   * 刪除照片
   */
  deletePhoto: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/galleries/photos/${id}`
    )
    return response.data
  },

  /**
   * 上傳圖片檔案到儲存空間
   */
  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/galleries/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * 獲取相簿列表
   */
  getGalleries: async (page = 1, limit = 10) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Gallery>>>('/galleries', {
      params: { page, limit },
    })
    return response.data
  },

  /**
   * 獲取相簿詳情（通過ID）
   */
  getGalleryById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Gallery>>(`/galleries/${id}`)
    return response.data
  },

  /**
   * 獲取相簿詳情（通過 Slug）
   */
  getGalleryBySlug: async (slug: string) => {
    const response = await apiClient.get<ApiResponse<Gallery>>(`/galleries/slug/${slug}`)
    return response.data
  },

  /**
   * 創建相簿
   */
  createGallery: async (
    galleryData: Omit<Gallery, 'id' | 'authorId' | 'createdAt' | 'likes' | 'views'>
  ) => {
    const response = await apiClient.post<ApiResponse<Gallery>>('/galleries', galleryData)
    return response.data
  },

  /**
   * 更新相簿
   */
  updateGallery: async (id: string, galleryData: Partial<Gallery>) => {
    const response = await apiClient.put<ApiResponse<Gallery>>(`/galleries/${id}`, galleryData)
    return response.data
  },

  /**
   * 刪除相簿
   */
  deleteGallery: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{}>>(`/galleries/${id}`)
    return response.data
  },

  /**
   * 喜歡/取消喜歡相簿
   */
  toggleLike: async (id: string) => {
    const response = await apiClient.post<ApiResponse<{ liked: boolean; likes: number }>>(
      `/galleries/${id}/like`
    )
    return response.data
  },

  /**
   * 上傳相簿圖片（多張）
   */
  uploadImages: async (files: File[]) => {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`images[${index}]`, file)
    })
    const response = await apiClient.post<ApiResponse<{ urls: string[] }>>(
      '/galleries/upload-images',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },
}

/**
 * 後端人物誌分頁回應介面
 */
interface BackendBiographyPaginatedResponse {
  success: boolean
  data: Biography[]
  pagination: PaginationInfo
}

/**
 * 人物誌相關 API 服務
 */
export const biographyService = {
  /**
   * 獲取人物誌列表
   */
  getBiographies: async (page = 1, limit = 10, search?: string) => {
    const response = await apiClient.get<BackendBiographyPaginatedResponse>('/biographies', {
      params: { page, limit, search },
    })
    return response.data
  },

  /**
   * 獲取個人人物誌
   */
  getMyBiography: async () => {
    const response = await apiClient.get<ApiResponse<Biography | null>>('/biographies/me')
    return response.data
  },

  /**
   * 獲取人物誌詳情（通過ID）
   */
  getBiographyById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Biography>>(`/biographies/${id}`)
    return response.data
  },

  /**
   * 獲取人物誌詳情（通過 Slug）
   */
  getBiographyBySlug: async (slug: string) => {
    const response = await apiClient.get<ApiResponse<Biography>>(`/biographies/slug/${slug}`)
    return response.data
  },

  /**
   * 獲取精選人物誌
   */
  getFeaturedBiographies: async (limit = 3) => {
    const response = await apiClient.get<ApiResponse<Biography[]>>('/biographies/featured', {
      params: { limit },
    })
    return response.data
  },

  /**
   * 獲取相鄰人物誌（上一篇/下一篇）
   */
  getAdjacentBiographies: async (id: string) => {
    const response = await apiClient.get<ApiResponse<BiographyAdjacent>>(
      `/biographies/${id}/adjacent`
    )
    return response.data
  },

  /**
   * 創建人物誌
   */
  createBiography: async (biographyData: BiographyInput) => {
    const response = await apiClient.post<ApiResponse<Biography>>('/biographies', biographyData)
    return response.data
  },

  /**
   * 更新個人人物誌
   */
  updateMyBiography: async (biographyData: Partial<BiographyInput>) => {
    const response = await apiClient.put<ApiResponse<Biography>>('/biographies/me', biographyData)
    return response.data
  },

  /**
   * 刪除個人人物誌
   */
  deleteMyBiography: async () => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>('/biographies/me')
    return response.data
  },

  /**
   * 上傳人物誌圖片
   */
  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/biographies/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },
}

/**
 * 岩場相關 API 服務
 */
export const cragService = {
  /**
   * 獲取岩場列表
   */
  getCrags: async (page = 1, limit = 10, filters?: { difficulty?: string; type?: string }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Crag>>>('/crags', {
      params: { page, limit, ...filters },
    })
    return response.data
  },

  /**
   * 獲取岩場詳情（通過ID）
   */
  getCragById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Crag>>(`/crags/${id}`)
    return response.data
  },

  /**
   * 獲取岩場詳情（通過 Slug）
   */
  getCragBySlug: async (slug: string) => {
    const response = await apiClient.get<ApiResponse<Crag>>(`/crags/slug/${slug}`)
    return response.data
  },

  /**
   * 獲取精選岩場
   */
  getFeaturedCrags: async () => {
    const response = await apiClient.get<ApiResponse<Crag[]>>('/crags/featured')
    return response.data
  },

  /**
   * 獲取附近岩場
   */
  getNearbyCrags: async (latitude: number, longitude: number, radius: number = 50) => {
    const response = await apiClient.get<ApiResponse<Crag[]>>('/crags/nearby', {
      params: { latitude, longitude, radius },
    })
    return response.data
  },

  /**
   * 獲取岩場路線
   */
  getCragRoutes: async (cragId: string) => {
    const response = await apiClient.get<ApiResponse<Route[]>>(`/crags/${cragId}/routes`)
    return response.data
  },

  /**
   * 獲取岩場評論
   */
  getReviews: async (cragId: string) => {
    const response = await apiClient.get<ApiResponse<Comment[]>>(`/crags/${cragId}/reviews`)
    return response.data
  },

  /**
   * 添加岩場評論
   */
  addReview: async (cragId: string, content: string, rating: number) => {
    const response = await apiClient.post<ApiResponse<Comment>>(`/crags/${cragId}/reviews`, {
      content,
      rating,
    })
    return response.data
  },

  /**
   * 獲取岩場天氣資訊
   */
  getWeather: async (cragId: string) => {
    const response = await apiClient.get<ApiResponse<Weather>>(`/crags/${cragId}/weather`)
    return response.data
  },

  /**
   * 創建岩場
   */
  createCrag: async (cragData: Omit<Crag, 'id' | 'createdAt' | 'reviews' | 'rating'>) => {
    const response = await apiClient.post<ApiResponse<Crag>>('/crags', cragData)
    return response.data
  },

  /**
   * 更新岩場資訊
   */
  updateCrag: async (id: string, cragData: Partial<Crag>) => {
    const response = await apiClient.put<ApiResponse<Crag>>(`/crags/${id}`, cragData)
    return response.data
  },

  /**
   * 刪除岩場
   */
  deleteCrag: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{}>>(`/crags/${id}`)
    return response.data
  },

  /**
   * 上傳岩場圖片
   */
  uploadImages: async (files: File[]) => {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`images[${index}]`, file)
    })
    const response = await apiClient.post<ApiResponse<{ urls: string[] }>>(
      '/crags/upload-images',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },
}

/**
 * 搜尋相關 API 服務
 */
export const searchService = {
  /**
   * 全站搜尋
   */
  search: async (params: SearchParams) => {
    const response = await apiClient.get<
      ApiResponse<{
        posts: Post[]
        gyms: Gym[]
        galleries: Gallery[]
      }>
    >('/search', { params })
    return response.data
  },
}

/**
 * 用戶相關 API 服務
 */
export const userService = {
  /**
   * 獲取用戶資料（通過ID）
   */
  getUserById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`)
    return response.data
  },

  /**
   * 獲取用戶發布的文章
   */
  getUserPosts: async (userId: string, page = 1, limit = 10) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Post>>>(
      `/users/${userId}/posts`,
      {
        params: { page, limit },
      }
    )
    return response.data
  },

  /**
   * 獲取用戶發布的相簿
   */
  getUserGalleries: async (userId: string, page = 1, limit = 10) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Gallery>>>(
      `/users/${userId}/galleries`,
      {
        params: { page, limit },
      }
    )
    return response.data
  },

  /**
   * 獲取用戶收藏的文章
   */
  getUserLikedPosts: async (page = 1, limit = 10) => {
    const response = await apiClient.get<ApiResponse<BackendPaginatedResponse<BackendPost>>>(
      '/posts/liked',
      {
        params: { page, limit },
      }
    )
    return response.data
  },

  /**
   * 獲取用戶收藏的攀岩館
   */
  getUserLikedGyms: async (page = 1, limit = 10) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Gym>>>(
      '/users/me/liked-gyms',
      {
        params: { page, limit },
      }
    )
    return response.data
  },

  /**
   * 獲取用戶收藏的相簿
   */
  getUserLikedGalleries: async (page = 1, limit = 10) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Gallery>>>(
      '/users/me/liked-galleries',
      {
        params: { page, limit },
      }
    )
    return response.data
  },

  /**
   * 上傳用戶頭像
   */
  uploadAvatar: async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/users/upload-avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },
}
