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
  BucketListItem,
  BucketListItemInput,
  BucketListCompleteInput,
  BucketListComment,
  BucketListReference,
  Milestone,
  Crag,
  AdminCrag,
  AdminArea,
  AdminSector,
  Route,
  Weather,
  BiographyVideo,
  BiographyVideoRelationType,
  BiographyInstagram,
  BiographyInstagramRelationType,
  InstagramMediaType,
  LocationDetail,
  CountryStat,
  ClimbingLocationRecord,
  StoryPrompt,
  StoryPromptStats,
} from '@/lib/types'
import type {
  ApiCragListResponse,
  ApiCragDetailResponse,
  ApiCragRoutesResponse,
  ApiCragAreasResponse,
  ApiFeaturedRoutesResponse,
} from '@/lib/types/api-crag'
import type {
  ApiGymListResponse,
  ApiGymDetailResponse,
} from '@/lib/types/api-gym'
import { processImage } from '@/lib/utils/image'

/**
 * 共用圖片上傳函數
 * @param file 圖片檔案
 * @param type 上傳類型
 * @param oldUrl 舊圖片 URL（可選，會刪除舊圖片）
 */
async function uploadImage(
  file: File,
  type: 'posts' | 'biography' | 'gallery' | 'gyms' | 'crags' | 'avatars',
  oldUrl?: string
): Promise<ApiResponse<{ url: string }>> {
  // 壓縮圖片
  const compressedFile = await processImage(file)

  const formData = new FormData()
  formData.append('image', compressedFile)
  if (oldUrl) formData.append('old_url', oldUrl)

  const response = await apiClient.post<ApiResponse<{ url: string }>>(
    `/media/upload?type=${type}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data
}

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
  status?: 'draft' | 'published' | 'archived'
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
   * 重設密碼（直接重設）
   */
  forgotPassword: async (email: string, password: string) => {
    const response = await apiClient.post<ApiResponse<{}>>('/auth/forgot-password', { email, password })
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
   * 按讚/取消按讚文章
   */
  toggleLike: async (id: string) => {
    const response = await apiClient.post<ApiResponse<{ liked: boolean; likes: number }>>(
      `/posts/${id}/like`
    )
    return response.data
  },

  /**
   * 獲取文章按讚狀態
   */
  getLikeStatus: async (id: string) => {
    const response = await apiClient.get<ApiResponse<{ liked: boolean; likes: number }>>(
      `/posts/${id}/like`
    )
    return response.data
  },

  /**
   * 收藏/取消收藏文章
   */
  toggleBookmark: async (id: string) => {
    const response = await apiClient.post<ApiResponse<{ bookmarked: boolean; bookmarks: number }>>(
      `/posts/${id}/bookmark`
    )
    return response.data
  },

  /**
   * 獲取文章收藏狀態
   */
  getBookmarkStatus: async (id: string) => {
    const response = await apiClient.get<ApiResponse<{ bookmarked: boolean; bookmarks: number }>>(
      `/posts/${id}/bookmark`
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
   * 刪除文章評論
   */
  deleteComment: async (postId: string, commentId: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/posts/${postId}/comments/${commentId}`
    )
    return response.data
  },

  /**
   * 上傳文章圖片（自動壓縮至 500KB 以下）
   * @param oldUrl 舊圖片 URL，如有則會刪除
   */
  uploadImage: (file: File, oldUrl?: string) => uploadImage(file, 'posts', oldUrl),
}

/**
 * 攀岩館相關 API 服務
 */
export const gymService = {
  /**
   * 獲取攀岩館列表
   */
  getGyms: async (page = 1, limit = 10, facilities?: string[]): Promise<ApiGymListResponse> => {
    const response = await apiClient.get<ApiGymListResponse>('/gyms', {
      params: { page, limit, facilities: facilities?.join(',') },
    })
    return response.data
  },

  /**
   * 獲取攀岩館詳情（通過ID）
   */
  getGymById: async (id: string): Promise<ApiGymDetailResponse> => {
    const response = await apiClient.get<ApiGymDetailResponse>(`/gyms/${id}`)
    return response.data
  },

  /**
   * 獲取攀岩館詳情（通過 Slug）
   */
  getGymBySlug: async (slug: string): Promise<ApiGymDetailResponse> => {
    const response = await apiClient.get<ApiGymDetailResponse>(`/gyms/slug/${slug}`)
    return response.data
  },

  /**
   * 獲取精選攀岩館
   */
  getFeaturedGyms: async (): Promise<ApiGymListResponse> => {
    const response = await apiClient.get<ApiGymListResponse>('/gyms/featured')
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
   * 上傳攀岩館圖片（自動壓縮至 500KB 以下）
   * @param oldUrl 舊圖片 URL，如有則會刪除
   */
  uploadImage: (file: File, oldUrl?: string) => uploadImage(file, 'gyms', oldUrl),
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
   * 獲取當前用戶的照片列表
   */
  getMyPhotos: async (page = 1, limit = 18) => {
    const response = await apiClient.get<PhotoPaginatedResponse>('/galleries/photos/me', {
      params: { page, limit },
    })
    return response.data
  },

  /**
   * 更新照片資訊
   */
  updatePhoto: async (
    id: string,
    photoData: {
      caption?: string
      location_country?: string
      location_city?: string
      location_spot?: string
    }
  ) => {
    const response = await apiClient.put<ApiResponse<GalleryPhoto>>(
      `/galleries/photos/${id}`,
      photoData
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
   * 上傳相簿圖片（自動壓縮至 500KB 以下）
   * @param oldUrl 舊圖片 URL，如有則會刪除
   */
  uploadImage: (file: File, oldUrl?: string) => uploadImage(file, 'gallery', oldUrl),

  /**
   * 上傳相簿圖片（多張，自動壓縮）
   */
  uploadImages: async (files: File[]) => {
    const results = await Promise.all(
      files.map((file) => uploadImage(file, 'gallery'))
    )
    return {
      success: true,
      data: { urls: results.map((r) => r.data?.url).filter((url): url is string => !!url) },
    }
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
   * 獲取人物誌詳情（通過ID，V2 格式）
   * 自動將後端 JSON 字串轉換為前端結構化資料
   */
  getBiographyByIdV2: async (id: string) => {
    const { transformBackendToBiographyV2 } = await import('@/lib/types/biography-v2')
    const response = await apiClient.get<ApiResponse<Biography>>(`/biographies/${id}`)
    if (!response.data.success || !response.data.data) {
      return { success: false, data: null }
    }
    const bioV2 = transformBackendToBiographyV2(response.data.data as unknown as import('@/lib/types/biography-v2').BiographyBackend)
    return { success: true, data: bioV2 }
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
   * 更新人物誌（註冊流程用）
   * 支援 tags_data, one_liners_data, stories_data 等 V2 欄位
   * 如果人物誌不存在，會先創建一個再更新
   */
  updateBiography: async (data: Record<string, unknown>) => {
    try {
      const response = await apiClient.put<ApiResponse<Biography>>('/biographies/me', data)
      return response.data
    } catch (error) {
      // 如果是 404 錯誤，先創建人物誌再更新
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } }
        if (axiosError.response?.status === 404) {
          // 先創建一個人物誌，預設為公開
          await apiClient.post<ApiResponse<Biography>>('/biographies', {
            name: '攀岩者',
            is_public: 1,
            visibility: 'public',
          })
          // 再嘗試更新
          const retryResponse = await apiClient.put<ApiResponse<Biography>>('/biographies/me', data)
          return retryResponse.data
        }
      }
      throw error
    }
  },

  /**
   * 自動儲存人物誌（V2 JSON 欄位）
   * 用於編輯器的即時自動儲存，只更新 tags_data, one_liners_data, stories_data, basic_info_data
   */
  autosave: async (data: {
    tags_data?: string
    one_liners_data?: string
    stories_data?: string
    basic_info_data?: string
  }) => {
    const response = await apiClient.put<ApiResponse<{ autosave_at: string; throttled?: boolean }>>(
      '/biographies/me/autosave',
      data
    )
    return response.data
  },

  /**
   * 自動儲存人物誌 V2（接受 BiographyV2 部分資料）
   * 自動將前端資料轉換為後端 JSON 格式
   */
  autosaveV2: async (bio: import('@/lib/types/biography-v2').BiographyV2) => {
    const { transformBiographyV2ToBackend } = await import('@/lib/types/biography-v2')
    const backendData = transformBiographyV2ToBackend(bio)
    const response = await apiClient.put<ApiResponse<{ autosave_at: string; throttled?: boolean }>>(
      '/biographies/me/autosave',
      backendData
    )
    return response.data
  },

  /**
   * 獲取個人人物誌（V2 格式）
   * 自動將後端 JSON 字串轉換為前端結構化資料
   */
  getMyBiographyV2: async () => {
    const { transformBackendToBiographyV2 } = await import('@/lib/types/biography-v2')
    const response = await apiClient.get<ApiResponse<Biography | null>>('/biographies/me')
    if (!response.data.success || !response.data.data) {
      return { success: true, data: null }
    }
    const bioV2 = transformBackendToBiographyV2(response.data.data as unknown as import('@/lib/types/biography-v2').BiographyBackend)
    return { success: true, data: bioV2 }
  },

  /**
   * 刪除個人人物誌
   */
  deleteMyBiography: async () => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>('/biographies/me')
    return response.data
  },

  /**
   * 上傳人物誌圖片（自動壓縮至 500KB 以下）
   * @param oldUrl 舊圖片 URL，如有則會刪除
   */
  uploadImage: (file: File, oldUrl?: string) => uploadImage(file, 'biography', oldUrl),

  /**
   * 獲取人物誌統計資料
   */
  getBiographyStats: async (id: string) => {
    const response = await apiClient.get<
      ApiResponse<{
        total_likes: number
        total_views: number
        follower_count: number
        bucket_list: { total: number; active: number; completed: number }
      }>
    >(`/biographies/${id}/stats`)
    return response.data
  },

  /**
   * 記錄人物誌瀏覽
   */
  recordView: async (id: string) => {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(
      `/biographies/${id}/view`
    )
    return response.data
  },

  /**
   * 追蹤人物誌
   */
  follow: async (id: string) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/biographies/${id}/follow`
    )
    return response.data
  },

  /**
   * 追蹤人物誌（別名）
   */
  followBiography: async (id: string) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/biographies/${id}/follow`
    )
    return response.data
  },

  /**
   * 取消追蹤人物誌
   */
  unfollow: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/biographies/${id}/follow`
    )
    return response.data
  },

  /**
   * 取消追蹤人物誌（別名）
   */
  unfollowBiography: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/biographies/${id}/follow`
    )
    return response.data
  },

  /**
   * 切換按讚狀態（按讚/取消按讚）
   */
  toggleLike: async (id: string) => {
    const response = await apiClient.post<ApiResponse<{ liked: boolean; likes: number }>>(
      `/biographies/${id}/like`
    )
    return response.data
  },

  /**
   * 獲取按讚狀態
   */
  getLikeStatus: async (id: string) => {
    const response = await apiClient.get<ApiResponse<{ liked: boolean; likes: number }>>(
      `/biographies/${id}/like`
    )
    return response.data
  },

  /**
   * 獲取追蹤狀態
   */
  getFollowStatus: async (id: string) => {
    const response = await apiClient.get<ApiResponse<{ following: boolean; followers: number }>>(
      `/biographies/${id}/follow`
    )
    return response.data
  },

  /**
   * 獲取追蹤者列表
   */
  getFollowers: async (id: string, limit = 20, offset = 0) => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          id: string
          created_at: string
          user_id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          biography_id: string | null
          biography_name: string | null
          biography_slug: string | null
        }>
      > & { pagination: { total: number; limit: number; offset: number } }
    >(`/biographies/${id}/followers`, { params: { limit, offset } })
    return response.data
  },

  /**
   * 獲取追蹤中列表
   */
  getFollowing: async (id: string, limit = 20, offset = 0) => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          id: string
          created_at: string
          user_id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          biography_id: string | null
          biography_name: string | null
          biography_slug: string | null
          biography_avatar: string | null
        }>
      > & { pagination: { total: number; limit: number; offset: number } }
    >(`/biographies/${id}/following`, { params: { limit, offset } })
    return response.data
  },

  /**
   * 獲取人物誌評論
   */
  getComments: async (biographyId: string) => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          id: string
          biography_id: string
          user_id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          content: string
          created_at: string
        }>
      >
    >(`/biographies/${biographyId}/comments`)
    return response.data
  },

  /**
   * 新增人物誌評論
   */
  addComment: async (biographyId: string, content: string) => {
    const response = await apiClient.post<
      ApiResponse<{
        id: string
        biography_id: string
        user_id: string
        username: string
        display_name: string | null
        avatar_url: string | null
        content: string
        created_at: string
      }>
    >(`/biographies/${biographyId}/comments`, { content })
    return response.data
  },

  /**
   * 刪除人物誌評論
   */
  deleteComment: async (commentId: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/biographies/comments/${commentId}`
    )
    return response.data
  },
}

/**
 * 攀岩足跡 API 服務
 */
export const climbingLocationService = {
  /**
   * 獲取當前用戶的攀岩足跡
   */
  getMyLocations: async () => {
    const response = await apiClient.get<ApiResponse<ClimbingLocationRecord[]>>(
      '/climbing-locations'
    )
    return response.data
  },

  /**
   * 獲取某人物誌的公開攀岩足跡
   */
  getBiographyLocations: async (biographyId: string) => {
    const response = await apiClient.get<ApiResponse<ClimbingLocationRecord[]>>(
      `/climbing-locations/biography/${biographyId}`
    )
    return response.data
  },

  /**
   * 新增攀岩足跡
   */
  createLocation: async (data: {
    location: string
    country: string
    visit_year?: string
    notes?: string
    photos?: string[]
    is_public?: boolean
  }) => {
    const response = await apiClient.post<ApiResponse<ClimbingLocationRecord>>(
      '/climbing-locations',
      data
    )
    return response.data
  },

  /**
   * 更新攀岩足跡
   */
  updateLocation: async (
    id: string,
    data: {
      location?: string
      country?: string
      visit_year?: string | null
      notes?: string | null
      photos?: string[] | null
      is_public?: boolean
      sort_order?: number
    }
  ) => {
    const response = await apiClient.put<ApiResponse<ClimbingLocationRecord>>(
      `/climbing-locations/${id}`,
      data
    )
    return response.data
  },

  /**
   * 刪除攀岩足跡
   */
  deleteLocation: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/climbing-locations/${id}`
    )
    return response.data
  },

  /**
   * 重新排序攀岩足跡
   */
  reorderLocations: async (order: string[]) => {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(
      '/climbing-locations/reorder',
      { order }
    )
    return response.data
  },

  /**
   * 遷移 JSON 資料到正規化表格
   */
  migrateLocations: async () => {
    const response = await apiClient.post<ApiResponse<{ migrated: number }>>(
      '/climbing-locations/migrate'
    )
    return response.data
  },

  /**
   * 探索攀岩地點（正規化表格）
   */
  exploreLocations: async (options?: { country?: string; limit?: number; offset?: number }) => {
    const response = await apiClient.get<
      ApiResponse<Array<{ location: string; country: string; visitor_count: number }>> & {
        pagination: { total: number; limit: number; offset: number }
      }
    >('/climbing-locations/explore', { params: options })
    return response.data
  },

  /**
   * 探索特定地點（正規化表格）
   */
  exploreLocation: async (locationName: string) => {
    const response = await apiClient.get<ApiResponse<LocationDetail>>(
      `/climbing-locations/explore/${encodeURIComponent(locationName)}`
    )
    return response.data
  },

  /**
   * 獲取國家統計（正規化表格）
   */
  exploreCountries: async () => {
    const response = await apiClient.get<ApiResponse<CountryStat[]>>(
      '/climbing-locations/explore/countries'
    )
    return response.data
  },
}

/**
 * 故事推題 API 服務
 */
export const storyPromptService = {
  /**
   * 檢查是否應該顯示推題
   */
  shouldPrompt: async () => {
    const response = await apiClient.get<
      ApiResponse<{ should_prompt: boolean; reason: string }>
    >('/story-prompts/should-prompt')
    return response.data
  },

  /**
   * 獲取下一個推薦的故事問題
   */
  getNextPrompt: async (strategy?: 'random' | 'easy_first' | 'category_rotate') => {
    const response = await apiClient.get<
      ApiResponse<{ field: string; category: string; remaining_count: number } | null>
    >('/story-prompts/next', { params: { strategy } })
    return response.data
  },

  /**
   * 記錄跳過
   */
  dismissPrompt: async (field: string) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/story-prompts/${field}/dismiss`
    )
    return response.data
  },

  /**
   * 記錄完成
   */
  completePrompt: async (field: string) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/story-prompts/${field}/complete`
    )
    return response.data
  },

  /**
   * 獲取推題進度
   */
  getProgress: async () => {
    const response = await apiClient.get<
      ApiResponse<{
        prompts: StoryPrompt[]
        stats: StoryPromptStats
      } | null>
    >('/story-prompts/progress')
    return response.data
  },
}

/**
 * 解析 BucketListItem 中的 JSON 字串欄位
 */
function parseBucketListItem(item: BucketListItem): BucketListItem {
  const parsed = { ...item }

  // 解析 milestones
  if (typeof parsed.milestones === 'string') {
    try {
      parsed.milestones = JSON.parse(parsed.milestones)
    } catch {
      parsed.milestones = null
    }
  }

  // 解析 completion_media
  if (typeof parsed.completion_media === 'string') {
    try {
      parsed.completion_media = JSON.parse(parsed.completion_media)
    } catch {
      parsed.completion_media = null
    }
  }

  return parsed
}

/**
 * 人生清單相關 API 服務
 */
export const bucketListService = {
  /**
   * 獲取人物誌的人生清單
   */
  getBucketList: async (
    biographyId: string,
    options?: { status?: string; category?: string }
  ) => {
    const response = await apiClient.get<ApiResponse<BucketListItem[]>>(
      `/bucket-list/${biographyId}`,
      { params: options }
    )
    // 解析 JSON 欄位
    if (response.data.data) {
      response.data.data = response.data.data.map(parseBucketListItem)
    }
    return response.data
  },

  /**
   * 獲取單一人生清單項目
   */
  getBucketListItem: async (id: string) => {
    const response = await apiClient.get<ApiResponse<BucketListItem>>(
      `/bucket-list/item/${id}`
    )
    // 解析 JSON 欄位
    if (response.data.data) {
      response.data.data = parseBucketListItem(response.data.data)
    }
    return response.data
  },

  /**
   * 新增人生清單項目
   */
  createItem: async (data: BucketListItemInput) => {
    const response = await apiClient.post<ApiResponse<BucketListItem>>('/bucket-list', data)
    if (response.data.data) {
      response.data.data = parseBucketListItem(response.data.data)
    }
    return response.data
  },

  /**
   * 更新人生清單項目
   */
  updateItem: async (id: string, data: Partial<BucketListItemInput>) => {
    const response = await apiClient.put<ApiResponse<BucketListItem>>(`/bucket-list/${id}`, data)
    if (response.data.data) {
      response.data.data = parseBucketListItem(response.data.data)
    }
    return response.data
  },

  /**
   * 刪除人生清單項目
   */
  deleteItem: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/bucket-list/${id}`
    )
    return response.data
  },

  /**
   * 標記完成
   */
  completeItem: async (id: string, data: BucketListCompleteInput) => {
    const response = await apiClient.put<ApiResponse<BucketListItem>>(
      `/bucket-list/${id}/complete`,
      data
    )
    if (response.data.data) {
      response.data.data = parseBucketListItem(response.data.data)
    }
    return response.data
  },

  /**
   * 更新進度
   */
  updateProgress: async (id: string, progress: number) => {
    const response = await apiClient.put<ApiResponse<{ progress: number }>>(
      `/bucket-list/${id}/progress`,
      { progress }
    )
    return response.data
  },

  /**
   * 更新里程碑
   */
  updateMilestone: async (
    id: string,
    milestoneId: string,
    data: { completed?: boolean; note?: string }
  ) => {
    const response = await apiClient.put<
      ApiResponse<{ milestones: Milestone[]; progress: number }>
    >(`/bucket-list/${id}/milestone`, { milestone_id: milestoneId, ...data })
    return response.data
  },

  /**
   * 探索：熱門目標
   */
  getTrending: async (limit = 10) => {
    const response = await apiClient.get<ApiResponse<BucketListItem[]>>(
      '/bucket-list/explore/trending',
      { params: { limit } }
    )
    if (response.data.data) {
      response.data.data = response.data.data.map(parseBucketListItem)
    }
    return response.data
  },

  /**
   * 探索：最新完成
   */
  getRecentCompleted: async (limit = 10) => {
    const response = await apiClient.get<ApiResponse<BucketListItem[]>>(
      '/bucket-list/explore/recent-completed',
      { params: { limit } }
    )
    if (response.data.data) {
      response.data.data = response.data.data.map(parseBucketListItem)
    }
    return response.data
  },

  /**
   * 探索：按分類
   */
  getByCategory: async (category: string, limit = 20) => {
    const response = await apiClient.get<ApiResponse<BucketListItem[]>>(
      `/bucket-list/explore/by-category/${category}`,
      { params: { limit } }
    )
    if (response.data.data) {
      response.data.data = response.data.data.map(parseBucketListItem)
    }
    return response.data
  },

  /**
   * 探索：按地點
   */
  getByLocation: async (location: string, limit = 20) => {
    const response = await apiClient.get<ApiResponse<BucketListItem[]>>(
      `/bucket-list/explore/by-location/${encodeURIComponent(location)}`,
      { params: { limit } }
    )
    if (response.data.data) {
      response.data.data = response.data.data.map(parseBucketListItem)
    }
    return response.data
  },

  /**
   * 按讚
   */
  likeItem: async (id: string) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/bucket-list/${id}/like`
    )
    return response.data
  },

  /**
   * 取消按讚
   */
  unlikeItem: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/bucket-list/${id}/like`
    )
    return response.data
  },

  /**
   * 獲取留言
   */
  getComments: async (id: string) => {
    const response = await apiClient.get<ApiResponse<BucketListComment[]>>(
      `/bucket-list/${id}/comments`
    )
    return response.data
  },

  /**
   * 新增留言
   */
  addComment: async (id: string, content: string) => {
    const response = await apiClient.post<ApiResponse<BucketListComment>>(
      `/bucket-list/${id}/comments`,
      { content }
    )
    return response.data
  },

  /**
   * 刪除留言
   */
  deleteComment: async (commentId: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/bucket-list/comments/${commentId}`
    )
    return response.data
  },

  /**
   * 加入我的清單（參考）
   */
  referenceItem: async (id: string) => {
    const response = await apiClient.post<ApiResponse<BucketListItem>>(
      `/bucket-list/${id}/reference`
    )
    return response.data
  },

  /**
   * 加入我的清單（參考）- 別名
   */
  addReference: async (id: string) => {
    const response = await apiClient.post<ApiResponse<BucketListItem>>(
      `/bucket-list/${id}/reference`
    )
    return response.data
  },

  /**
   * 取消參考
   */
  cancelReference: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/bucket-list/${id}/reference`
    )
    return response.data
  },

  /**
   * 獲取參考者列表
   */
  getReferences: async (id: string) => {
    const response = await apiClient.get<ApiResponse<BucketListReference[]>>(
      `/bucket-list/${id}/references`
    )
    return response.data
  },

  /**
   * 探索：取得所有分類的數量統計（解決 N+1 問題）
   */
  getCategoryCounts: async () => {
    const response = await apiClient.get<
      ApiResponse<Array<{ category: string; count: number }>>
    >('/bucket-list/explore/category-counts')
    return response.data
  },

  /**
   * 探索：取得熱門地點
   */
  getPopularLocations: async (limit = 20, country?: string) => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          location: string
          item_count: number
          user_count: number
          completed_count: number
        }>
      >
    >('/bucket-list/explore/locations', { params: { limit, country } })
    return response.data
  },

  /**
   * 探索：取得地點詳情
   */
  getLocationDetails: async (location: string, limit = 10) => {
    const response = await apiClient.get<
      ApiResponse<{
        location: string
        stats: { total_items: number; total_users: number; completed_count: number }
        items: BucketListItem[]
        visitors: Array<{
          id: string
          name: string
          avatar_url: string | null
          slug: string
          completed_at: string
        }>
      }>
    >(`/bucket-list/explore/locations/${encodeURIComponent(location)}`, { params: { limit } })
    return response.data
  },

  /**
   * 探索：取得攀岩足跡地點（從人物誌）
   */
  getClimbingFootprints: async (limit = 20, country?: 'taiwan' | 'overseas') => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          location: string
          country: string
          visitors: Array<{
            id: string
            name: string
            avatar_url: string | null
            slug: string
          }>
        }>
      >
    >('/bucket-list/explore/climbing-footprints', { params: { limit, country } })
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
  getCrags: async (page = 1, limit = 10, filters?: { difficulty?: string; type?: string }): Promise<ApiCragListResponse> => {
    const response = await apiClient.get<ApiCragListResponse>('/crags', {
      params: { page, limit, ...filters },
    })
    return response.data
  },

  /**
   * 獲取岩場詳情（通過ID）
   */
  getCragById: async (id: string): Promise<ApiCragDetailResponse> => {
    const response = await apiClient.get<ApiCragDetailResponse>(`/crags/${id}`)
    return response.data
  },

  /**
   * 獲取岩場詳情（通過 Slug）
   */
  getCragBySlug: async (slug: string): Promise<ApiCragDetailResponse> => {
    const response = await apiClient.get<ApiCragDetailResponse>(`/crags/slug/${slug}`)
    return response.data
  },

  /**
   * 獲取精選岩場
   */
  getFeaturedCrags: async (): Promise<ApiCragListResponse> => {
    const response = await apiClient.get<ApiCragListResponse>('/crags/featured')
    return response.data
  },

  /**
   * 獲取熱門路線
   */
  getFeaturedRoutes: async (limit = 8): Promise<ApiFeaturedRoutesResponse> => {
    const response = await apiClient.get<ApiFeaturedRoutesResponse>('/crags/routes/featured', {
      params: { limit },
    })
    return response.data
  },

  /**
   * 獲取附近岩場
   */
  getNearbyCrags: async (latitude: number, longitude: number, radius: number = 50): Promise<ApiCragListResponse> => {
    const response = await apiClient.get<ApiCragListResponse>('/crags/nearby', {
      params: { latitude, longitude, radius },
    })
    return response.data
  },

  /**
   * 獲取岩場路線
   */
  getCragRoutes: async (cragId: string): Promise<ApiCragRoutesResponse> => {
    const response = await apiClient.get<ApiCragRoutesResponse>(`/crags/${cragId}/routes`)
    return response.data
  },

  /**
   * 獲取岩場區域
   */
  getCragAreas: async (cragId: string): Promise<ApiCragAreasResponse> => {
    const response = await apiClient.get<ApiCragAreasResponse>(`/crags/${cragId}/areas`)
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
   * 上傳岩場圖片（自動壓縮至 500KB 以下）
   * @param oldUrl 舊圖片 URL，如有則會刪除
   */
  uploadImage: (file: File, oldUrl?: string) => uploadImage(file, 'crags', oldUrl),

  /**
   * 上傳岩場圖片（多張，自動壓縮）
   */
  uploadImages: async (files: File[]) => {
    const results = await Promise.all(
      files.map((file) => uploadImage(file, 'crags'))
    )
    return {
      success: true,
      data: { urls: results.map((r) => r.data?.url).filter((url): url is string => !!url) },
    }
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
    // 壓縮圖片以確保上傳成功
    const compressedFile = await processImage(file)

    const formData = new FormData()
    formData.append('avatar', compressedFile)
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

/**
 * 天氣相關 API 服務
 */
export const weatherService = {
  /**
   * 根據地點名稱獲取天氣資訊
   */
  getWeatherByLocation: async (location: string) => {
    const response = await apiClient.get<ApiResponse<Weather>>('/weather', {
      params: { location },
    })
    return response.data
  },

  /**
   * 根據經緯度獲取天氣資訊
   */
  getWeatherByCoordinates: async (latitude: number, longitude: number) => {
    const response = await apiClient.get<ApiResponse<Weather>>('/weather/coordinates', {
      params: { lat: latitude, lon: longitude },
    })
    return response.data
  },
}

/**
 * 通知相關 API 服務
 */
export const notificationService = {
  /**
   * 獲取通知列表
   */
  getNotifications: async (page = 1, limit = 20, unreadOnly = false) => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          id: string
          user_id: string
          type: string
          actor_id: string | null
          target_id: string | null
          title: string
          message: string
          is_read: number
          created_at: string
          actor_name?: string
          actor_avatar?: string
        }>
      > & { pagination: { page: number; limit: number; total: number; total_pages: number } }
    >('/notifications', { params: { page, limit, unread: unreadOnly ? 'true' : undefined } })
    return response.data
  },

  /**
   * 獲取未讀通知數量
   */
  getUnreadCount: async () => {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      '/notifications/unread-count'
    )
    return response.data
  },

  /**
   * 標記通知為已讀
   */
  markAsRead: async (id: string) => {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(
      `/notifications/${id}/read`
    )
    return response.data
  },

  /**
   * 標記全部通知為已讀
   */
  markAllAsRead: async () => {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(
      '/notifications/read-all'
    )
    return response.data
  },

  /**
   * 刪除通知
   */
  deleteNotification: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/notifications/${id}`
    )
    return response.data
  },

  /**
   * 刪除全部通知
   */
  deleteAllNotifications: async () => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>('/notifications')
    return response.data
  },

  /**
   * 獲取通知偏好設定
   */
  getPreferences: async () => {
    const response = await apiClient.get<
      ApiResponse<{
        goal_liked: boolean
        goal_commented: boolean
        goal_referenced: boolean
        post_liked: boolean
        post_commented: boolean
        biography_commented: boolean
        new_follower: boolean
        story_featured: boolean
        goal_completed: boolean
        email_digest: boolean
      }>
    >('/notifications/preferences')
    return response.data
  },

  /**
   * 更新通知偏好設定
   */
  updatePreferences: async (preferences: {
    goal_liked?: boolean
    goal_commented?: boolean
    goal_referenced?: boolean
    post_liked?: boolean
    post_commented?: boolean
    biography_commented?: boolean
    new_follower?: boolean
    story_featured?: boolean
    goal_completed?: boolean
    email_digest?: boolean
  }) => {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(
      '/notifications/preferences',
      preferences
    )
    return response.data
  },

  /**
   * 獲取用戶通知統計
   */
  getStats: async () => {
    const response = await apiClient.get<
      ApiResponse<{
        overview: {
          total: number
          unread: number
          read: number
          readRate: number
        }
        byType: Array<{ type: string; count: number }>
        dailyTrend: Array<{ date: string; count: number }>
      }>
    >('/notifications/stats')
    return response.data
  },

  /**
   * 獲取管理員通知統計（需要 admin 權限）
   */
  getAdminStats: async () => {
    const response = await apiClient.get<
      ApiResponse<{
        period: string
        overview: {
          total: number
          unread: number
          usersWithNotifications: number
        }
        byType: Array<{ type: string; count: number }>
        hourlyTrend: Array<{ hour: string; count: number }>
        topRecipients: Array<{
          user_id: string
          username: string
          display_name: string | null
          notification_count: number
        }>
      }>
    >('/notifications/admin/stats')
    return response.data
  },
}

/**
 * 媒體整合相關 API 服務
 */
export const mediaService = {
  // ═══════════════════════════════════════════════════════════
  // YouTube 影片
  // ═══════════════════════════════════════════════════════════

  /**
   * 獲取人物誌的 YouTube 影片列表
   */
  getBiographyVideos: async (biographyId: string, featured?: boolean) => {
    const response = await apiClient.get<ApiResponse<BiographyVideo[]>>(
      `/media/biographies/${biographyId}/videos`,
      { params: featured !== undefined ? { featured } : undefined }
    )
    return response.data
  },

  /**
   * 新增 YouTube 影片關聯
   */
  addVideo: async (data: {
    video_id: string
    relation_type?: BiographyVideoRelationType
    is_featured?: boolean
    display_order?: number
  }) => {
    const response = await apiClient.post<ApiResponse<BiographyVideo>>(
      '/media/biographies/me/videos',
      data
    )
    return response.data
  },

  /**
   * 更新 YouTube 影片關聯
   */
  updateVideo: async (
    id: string,
    data: {
      relation_type?: BiographyVideoRelationType
      is_featured?: boolean
      display_order?: number
    }
  ) => {
    const response = await apiClient.put<ApiResponse<BiographyVideo>>(
      `/media/biographies/me/videos/${id}`,
      data
    )
    return response.data
  },

  /**
   * 刪除 YouTube 影片關聯
   */
  deleteVideo: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/media/biographies/me/videos/${id}`
    )
    return response.data
  },

  // ═══════════════════════════════════════════════════════════
  // Instagram 貼文
  // ═══════════════════════════════════════════════════════════

  /**
   * 獲取人物誌的 Instagram 貼文列表
   */
  getBiographyInstagrams: async (biographyId: string, featured?: boolean) => {
    const response = await apiClient.get<ApiResponse<BiographyInstagram[]>>(
      `/media/biographies/${biographyId}/instagrams`,
      { params: featured !== undefined ? { featured } : undefined }
    )
    return response.data
  },

  /**
   * 新增 Instagram 貼文關聯
   */
  addInstagram: async (data: {
    instagram_url: string
    instagram_shortcode: string
    media_type?: InstagramMediaType
    thumbnail_url?: string
    caption?: string
    posted_at?: string
    relation_type?: BiographyInstagramRelationType
    is_featured?: boolean
    display_order?: number
  }) => {
    const response = await apiClient.post<ApiResponse<BiographyInstagram>>(
      '/media/biographies/me/instagrams',
      data
    )
    return response.data
  },

  /**
   * 更新 Instagram 貼文關聯
   */
  updateInstagram: async (
    id: string,
    data: {
      media_type?: InstagramMediaType
      thumbnail_url?: string
      caption?: string
      posted_at?: string
      relation_type?: BiographyInstagramRelationType
      is_featured?: boolean
      display_order?: number
    }
  ) => {
    const response = await apiClient.put<ApiResponse<BiographyInstagram>>(
      `/media/biographies/me/instagrams/${id}`,
      data
    )
    return response.data
  },

  /**
   * 刪除 Instagram 貼文關聯
   */
  deleteInstagram: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/media/biographies/me/instagrams/${id}`
    )
    return response.data
  },

  // ═══════════════════════════════════════════════════════════
  // 資訊抓取
  // ═══════════════════════════════════════════════════════════

  /**
   * 抓取 YouTube 影片資訊
   */
  fetchYoutubeInfo: async (url: string) => {
    const response = await apiClient.get<
      ApiResponse<{
        video_id: string
        title: string
        channel_name: string
        channel_url: string
        thumbnail_url: string
        thumbnails: {
          default: string
          medium: string
          high: string
          maxres: string
        }
        embed_url: string
        watch_url: string
      }>
    >('/media/utils/youtube-info', { params: { url } })
    return response.data
  },

  /**
   * 抓取 Instagram 貼文資訊
   */
  fetchInstagramInfo: async (url: string) => {
    const response = await apiClient.get<
      ApiResponse<{
        shortcode: string
        instagram_url: string
        embed_url: string
        media_type: InstagramMediaType | null
        thumbnail_url: string | null
        caption: string | null
        posted_at: string | null
      }>
    >('/media/utils/instagram-info', { params: { url } })
    return response.data
  },
}

/**
 * 全站統計資料介面
 */
export interface SiteStats {
  crags: number
  routes: number
  biographies: number
  videos: number
  posts: number
  gyms: number
  updatedAt: string
}

/**
 * 全站統計相關 API 服務
 */
export const statsService = {
  /**
   * 取得全站統計資料
   */
  getStats: async () => {
    const response = await apiClient.get<
      ApiResponse<SiteStats> & { cached: boolean }
    >('/stats')
    return response.data
  },

  /**
   * 強制清除統計快取
   */
  invalidateCache: async () => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/stats/invalidate'
    )
    return response.data
  },

  /**
   * 取得社群統計資料（用於首頁故事展示區）
   */
  getCommunityStats: async () => {
    const response = await apiClient.get<
      ApiResponse<CommunityStats> & { cached: boolean }
    >('/stats/community')
    return response.data
  },
}

/**
 * 社群統計資料介面（用於首頁故事展示區）
 */
export interface CommunityStats {
  featuredStory: {
    id: string
    content: string
    contentType: 'core_story' | 'one_liner' | 'story'
    author: {
      displayName: string
      slug: string
    }
    reactions: {
      me_too: number
    }
  } | null
  stats: {
    friendInvited: number
    topLocations: string[]
    totalStories: number
  }
  updatedAt: string
}

// ═══════════════════════════════════════════
// Biography Content Service
// ═══════════════════════════════════════════

export interface CoreStory {
  id: string
  biography_id: string
  question_id: string
  content: string
  title?: string
  subtitle?: string
  like_count: number
  comment_count: number
  is_liked?: boolean
  created_at: string
  updated_at: string
}

export interface OneLiner {
  id: string
  biography_id: string
  question_id: string
  question_text?: string
  answer: string
  question?: string
  format_hint?: string
  like_count: number
  comment_count: number
  is_liked?: boolean
  created_at: string
  updated_at: string
}

export interface Story {
  id: string
  biography_id: string
  question_id: string
  question_text?: string
  category_id?: string
  content: string
  title?: string
  subtitle?: string
  difficulty?: string
  category_name?: string
  category_emoji?: string
  word_count: number
  like_count: number
  comment_count: number
  is_liked?: boolean
  created_at: string
  updated_at: string
}

export interface ContentComment {
  id: string
  user_id: string
  content: string
  parent_id?: string
  like_count: number
  username: string
  display_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface ContentQuestions {
  core_stories: Array<{
    id: string
    title: string
    subtitle?: string
    placeholder?: string
    display_order: number
  }>
  one_liners: Array<{
    id: string
    question: string
    format_hint?: string
    placeholder?: string
    display_order: number
  }>
  story_categories: Array<{
    id: string
    name: string
    emoji?: string
    icon?: string
    description?: string
    display_order: number
  }>
  stories: Array<{
    id: string
    category_id: string
    title: string
    subtitle?: string
    placeholder?: string
    difficulty: string
    display_order: number
  }>
}

/**
 * 人物誌內容相關 API 服務
 */
export const biographyContentService = {
  // ═══════════════════════════════════════════
  // 選擇題
  // ═══════════════════════════════════════════

  /**
   * 取得選擇題（含選項統計）
   */
  getChoiceQuestions: async (stage: string = 'onboarding') => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          id: string
          question: string
          hint?: string
          follow_up_prompt?: string
          follow_up_placeholder?: string
          options: Array<{
            id: string
            label: string
            value: string
            is_other: boolean
            response_template?: string
            count: number
          }>
        }>
      >
    >(`/content/choice-questions?stage=${stage}`)
    return response.data
  },

  /**
   * 提交選擇題回答
   */
  submitChoiceAnswer: async (
    biographyId: string,
    questionId: string,
    optionId?: string,
    customText?: string,
    followUpText?: string
  ) => {
    const response = await apiClient.post<
      ApiResponse<{
        response_message: string
        community_count: number
      }>
    >(`/content/biographies/${biographyId}/choice-answers`, {
      question_id: questionId,
      option_id: optionId,
      custom_text: customText,
      follow_up_text: followUpText,
    })
    return response.data
  },

  /**
   * 取得用戶的選擇題回答
   */
  getChoiceAnswers: async (biographyId: string) => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          question_id: string
          option_id?: string
          custom_text?: string
          follow_up_text?: string
          option_label?: string
          option_value?: string
        }>
      >
    >(`/content/biographies/${biographyId}/choice-answers`)
    return response.data
  },

  // ═══════════════════════════════════════════
  // 題目
  // ═══════════════════════════════════════════

  /**
   * 取得所有題目
   */
  getQuestions: async () => {
    const response = await apiClient.get<ApiResponse<ContentQuestions>>(
      '/content/questions'
    )
    return response.data
  },

  // ═══════════════════════════════════════════
  // 核心故事
  // ═══════════════════════════════════════════

  /**
   * 取得某人物誌的核心故事
   */
  getCoreStories: async (biographyId: string) => {
    const response = await apiClient.get<ApiResponse<CoreStory[]>>(
      `/content/biographies/${biographyId}/core-stories`
    )
    return response.data
  },

  /**
   * 儲存核心故事
   */
  saveCoreStory: async (
    biographyId: string,
    data: { question_id: string; content: string }
  ) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/content/biographies/${biographyId}/core-stories`,
      data
    )
    return response.data
  },

  /**
   * 按讚/取消按讚核心故事
   */
  toggleCoreStoryLike: async (storyId: string) => {
    const response = await apiClient.post<
      ApiResponse<{ liked: boolean; like_count: number }>
    >(`/content/core-stories/${storyId}/like`)
    return response.data
  },

  /**
   * 取得核心故事留言
   */
  getCoreStoryComments: async (storyId: string) => {
    const response = await apiClient.get<ApiResponse<ContentComment[]>>(
      `/content/core-stories/${storyId}/comments`
    )
    return response.data
  },

  /**
   * 新增核心故事留言
   */
  addCoreStoryComment: async (
    storyId: string,
    data: { content: string; parent_id?: string }
  ) => {
    const response = await apiClient.post<ApiResponse<ContentComment>>(
      `/content/core-stories/${storyId}/comments`,
      data
    )
    return response.data
  },

  /**
   * 刪除核心故事留言
   */
  deleteCoreStoryComment: async (commentId: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/content/core-story-comments/${commentId}`
    )
    return response.data
  },

  // ═══════════════════════════════════════════
  // 一句話
  // ═══════════════════════════════════════════

  /**
   * 取得某人物誌的一句話
   */
  getOneLiners: async (biographyId: string) => {
    const response = await apiClient.get<ApiResponse<OneLiner[]>>(
      `/content/biographies/${biographyId}/one-liners`
    )
    return response.data
  },

  /**
   * 儲存一句話
   */
  saveOneLiner: async (
    biographyId: string,
    data: {
      question_id: string
      answer: string
      question_text?: string
      source?: string
    }
  ) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/content/biographies/${biographyId}/one-liners`,
      data
    )
    return response.data
  },

  /**
   * 刪除一句話
   */
  deleteOneLiner: async (oneLinerId: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/content/one-liners/${oneLinerId}`
    )
    return response.data
  },

  /**
   * 按讚/取消按讚一句話
   */
  toggleOneLinerLike: async (oneLinerId: string) => {
    const response = await apiClient.post<
      ApiResponse<{ liked: boolean; like_count: number }>
    >(`/content/one-liners/${oneLinerId}/like`)
    return response.data
  },

  /**
   * 取得一句話留言
   */
  getOneLinerComments: async (oneLinerId: string) => {
    const response = await apiClient.get<ApiResponse<ContentComment[]>>(
      `/content/one-liners/${oneLinerId}/comments`
    )
    return response.data
  },

  /**
   * 新增一句話留言
   */
  addOneLinerComment: async (
    oneLinerId: string,
    data: { content: string; parent_id?: string }
  ) => {
    const response = await apiClient.post<ApiResponse<ContentComment>>(
      `/content/one-liners/${oneLinerId}/comments`,
      data
    )
    return response.data
  },

  // ═══════════════════════════════════════════
  // 小故事
  // ═══════════════════════════════════════════

  /**
   * 取得某人物誌的小故事
   */
  getStories: async (biographyId: string, categoryId?: string) => {
    const params = categoryId ? `?category_id=${categoryId}` : ''
    const response = await apiClient.get<ApiResponse<Story[]>>(
      `/content/biographies/${biographyId}/stories${params}`
    )
    return response.data
  },

  /**
   * 儲存小故事
   */
  saveStory: async (
    biographyId: string,
    data: {
      question_id: string
      content: string
      category_id?: string
      question_text?: string
      source?: string
    }
  ) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/content/biographies/${biographyId}/stories`,
      data
    )
    return response.data
  },

  /**
   * 刪除小故事
   */
  deleteStory: async (storyId: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/content/stories/${storyId}`
    )
    return response.data
  },

  /**
   * 按讚/取消按讚小故事
   */
  toggleStoryLike: async (storyId: string) => {
    const response = await apiClient.post<
      ApiResponse<{ liked: boolean; like_count: number }>
    >(`/content/stories/${storyId}/like`)
    return response.data
  },

  /**
   * 取得小故事留言
   */
  getStoryComments: async (storyId: string) => {
    const response = await apiClient.get<ApiResponse<ContentComment[]>>(
      `/content/stories/${storyId}/comments`
    )
    return response.data
  },

  /**
   * 新增小故事留言
   */
  addStoryComment: async (
    storyId: string,
    data: { content: string; parent_id?: string }
  ) => {
    const response = await apiClient.post<ApiResponse<ContentComment>>(
      `/content/stories/${storyId}/comments`,
      data
    )
    return response.data
  },

  // ═══════════════════════════════════════════
  // 探索/熱門
  // ═══════════════════════════════════════════

  /**
   * 取得熱門核心故事
   */
  getPopularCoreStories: async (limit = 10) => {
    const response = await apiClient.get<
      ApiResponse<(CoreStory & { author_name: string; author_avatar?: string })[]>
    >(`/content/popular/core-stories?limit=${limit}`)
    return response.data
  },

  /**
   * 取得熱門一句話
   */
  getPopularOneLiners: async (limit = 10) => {
    const response = await apiClient.get<
      ApiResponse<(OneLiner & { author_name: string; author_avatar?: string })[]>
    >(`/content/popular/one-liners?limit=${limit}`)
    return response.data
  },

  /**
   * 取得熱門小故事
   */
  getPopularStories: async (limit = 10, categoryId?: string) => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (categoryId) params.append('category_id', categoryId)
    const response = await apiClient.get<
      ApiResponse<(Story & { author_name: string; author_avatar?: string })[]>
    >(`/content/popular/stories?${params}`)
    return response.data
  },

  /**
   * 快速反應類型
   */
  // ReactionType is defined below

  /**
   * 切換快速反應
   */
  toggleReaction: async (
    contentType: 'core-stories' | 'one-liners' | 'stories',
    contentId: string,
    reactionType: 'me_too' | 'plus_one' | 'well_said'
  ) => {
    const response = await apiClient.post<
      ApiResponse<{
        reacted: boolean
        reaction_counts: Record<'me_too' | 'plus_one' | 'well_said', number>
      }>
    >(`/content/${contentType}/${contentId}/reaction`, { reaction_type: reactionType })
    return response.data
  },

  /**
   * 取得內容的反應狀態
   */
  getReactions: async (
    contentType: 'core-stories' | 'one-liners' | 'stories',
    contentId: string
  ) => {
    const response = await apiClient.get<
      ApiResponse<{
        counts: Record<'me_too' | 'plus_one' | 'well_said', number>
        user_reactions: Array<'me_too' | 'plus_one' | 'well_said'>
      }>
    >(`/content/${contentType}/${contentId}/reactions`)
    return response.data
  },

  // ═══════════════════════════════════════════
  // 單筆內容查詢（供故事詳情頁使用）
  // ═══════════════════════════════════════════

  /**
   * 取得單筆核心故事詳情
   */
  getCoreStoryById: async (storyId: string) => {
    const response = await apiClient.get<
      ApiResponse<
        CoreStory & {
          title: string
          subtitle?: string
          biography_id: string
          biography_slug: string
          author_name: string
          author_avatar?: string
          author_title?: string
        }
      >
    >(`/content/core-stories/${storyId}/detail`)
    return response.data
  },

  /**
   * 取得單筆一句話詳情
   */
  getOneLinerById: async (oneLinerId: string) => {
    const response = await apiClient.get<
      ApiResponse<
        OneLiner & {
          biography_id: string
          biography_slug: string
          author_name: string
          author_avatar?: string
          author_title?: string
        }
      >
    >(`/content/one-liners/${oneLinerId}/detail`)
    return response.data
  },

  /**
   * 取得單筆小故事詳情
   */
  getStoryById: async (storyId: string) => {
    const response = await apiClient.get<
      ApiResponse<
        Story & {
          biography_id: string
          biography_slug: string
          author_name: string
          author_avatar?: string
          author_title?: string
        }
      >
    >(`/content/stories/${storyId}/detail`)
    return response.data
  },
}
export interface AdminUser {
  id: string
  email: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  role: 'user' | 'admin' | 'moderator'
  is_active: number
  email_verified: number
  auth_provider: 'local' | 'google'
  created_at: string
  updated_at: string
}

/**
 * Admin 用戶統計介面
 */
export interface AdminUserStats {
  total: number
  active: number
  inactive: number
  newThisWeek: number
  newThisMonth: number
  byRole: Array<{ role: string; count: number }>
  byAuthProvider: Array<{ auth_provider: string; count: number }>
}

/**
 * Admin 用戶管理 API 服務
 */
export const adminUserService = {
  /**
   * 獲取用戶列表（需要 admin 權限）
   */
  getUsers: async (options?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
  }) => {
    const response = await apiClient.get<
      ApiResponse<AdminUser[]> & {
        pagination: { page: number; limit: number; total: number; total_pages: number }
      }
    >('/users/admin/list', { params: options })
    return response.data
  },

  /**
   * 獲取用戶統計（需要 admin 權限）
   */
  getStats: async () => {
    const response = await apiClient.get<ApiResponse<AdminUserStats>>('/users/admin/stats')
    return response.data
  },

  /**
   * 獲取單一用戶詳情（需要 admin 權限）
   */
  getUser: async (id: string) => {
    const response = await apiClient.get<
      ApiResponse<
        AdminUser & {
          biography: {
            id: string
            name: string
            slug: string
            total_views: number
            total_likes: number
            follower_count: number
          } | null
          stats: {
            posts: number
            photos: number
          }
        }
      >
    >(`/users/admin/${id}`)
    return response.data
  },

  /**
   * 更新用戶狀態（需要 admin 權限）
   */
  updateStatus: async (id: string, isActive: boolean) => {
    const response = await apiClient.put<
      ApiResponse<{ id: string; is_active: number }>
    >(`/users/admin/${id}/status`, { is_active: isActive })
    return response.data
  },

  /**
   * 更新用戶角色（需要 admin 權限）
   */
  updateRole: async (id: string, role: 'user' | 'admin' | 'moderator') => {
    const response = await apiClient.put<
      ApiResponse<{ id: string; role: string }>
    >(`/users/admin/${id}/role`, { role })
    return response.data
  },
}

/**
 * 廣播通知記錄介面
 */
export interface BroadcastRecord {
  id: string
  title: string
  message: string
  actor_id: string
  actor_name: string
  created_at: string
  recipient_count: number
  read_count: number
}

/**
 * Admin 廣播通知 API 服務
 */
export const adminBroadcastService = {
  /**
   * 發送廣播通知（需要 admin 權限）
   */
  sendBroadcast: async (data: {
    title: string
    message: string
    targetRole?: 'all' | 'user' | 'moderator' | 'admin'
  }) => {
    const response = await apiClient.post<
      ApiResponse<{
        totalUsers: number
        successCount: number
        failedCount: number
      }>
    >('/notifications/admin/broadcast', data)
    return response.data
  },

  /**
   * 獲取廣播歷史記錄（需要 admin 權限）
   */
  getBroadcasts: async (page = 1, limit = 20) => {
    const response = await apiClient.get<
      ApiResponse<BroadcastRecord[]> & {
        pagination: { page: number; limit: number; total: number; total_pages: number }
      }
    >('/notifications/admin/broadcasts', { params: { page, limit } })
    return response.data
  },
}

// ═══════════════════════════════════════════════════════════
// Admin 數據分析 API 服務
// ═══════════════════════════════════════════════════════════

/**
 * 追蹤數據分析介面
 */
export interface FollowAnalytics {
  summary: {
    totalFollows: number
    uniqueFollowers: number
    uniqueFollowing: number
    mutualFollows: number
    followsToday: number
    followsWeek: number
    followsMonth: number
  }
  dailyTrend: Array<{ date: string; count: number }>
  topFollowed: Array<{
    id: string
    username: string
    display_name: string | null
    avatar: string | null
    biography_id: string
    follower_count: number
  }>
  topFollowers: Array<{
    id: string
    username: string
    display_name: string | null
    avatar: string | null
    following_count: number
  }>
}

/**
 * 用戶活躍度分析介面
 */
export interface ActivityAnalytics {
  summary: {
    dau: number
    wau: number
    mau: number
    totalUsers: number
    activeUsers: number
    newUsersToday: number
    newUsersWeek: number
    newUsersMonth: number
    retentionRate: number
  }
  dailyActiveUsers: Array<{ date: string; count: number }>
  dailyNewUsers: Array<{ date: string; count: number }>
  activityBreakdown: {
    postsWeek: number
    goalsWeek: number
    likesWeek: number
    commentsWeek: number
    followsWeek: number
  }
}

/**
 * 內容統計分析介面
 */
export interface ContentAnalytics {
  summary: {
    totalPosts: number
    publishedPosts: number
    draftPosts: number
    postsWeek: number
    totalBiographies: number
    publicBiographies: number
    biographiesWeek: number
    totalVideos: number
    totalViews: number
    totalLikes: number
  }
  dailyPosts: Array<{ date: string; count: number }>
  dailyBiographies: Array<{ date: string; count: number }>
  topBiographies: Array<{
    id: string
    username: string
    display_name: string | null
    avatar: string | null
    total_views: number
    total_likes: number
    follower_count: number
  }>
  topPosts: Array<{
    id: string
    title: string
    slug: string
    author_name: string
    views: number
    created_at: string
  }>
  categoryDistribution: Array<{ category: string; count: number }>
}

/**
 * Admin 數據分析 API 服務
 */
export const adminAnalyticsService = {
  /**
   * 獲取追蹤數據分析（需要 admin 權限）
   */
  getFollowAnalytics: async () => {
    const response = await apiClient.get<ApiResponse<FollowAnalytics>>('/stats/admin/follows')
    return response.data
  },

  /**
   * 獲取用戶活躍度分析（需要 admin 權限）
   */
  getActivityAnalytics: async () => {
    const response = await apiClient.get<ApiResponse<ActivityAnalytics>>('/stats/admin/activity')
    return response.data
  },

  /**
   * 獲取內容統計分析（需要 admin 權限）
   */
  getContentAnalytics: async () => {
    const response = await apiClient.get<ApiResponse<ContentAnalytics>>('/stats/admin/content')
    return response.data
  },
}

/**
 * Access Logs 日誌類型
 */
export interface AccessLogEntry {
  timestamp: string
  method: string
  path: string
  userAgent: string
  country: string
  userId: string
  ip: string
  statusCode: string
  errorMessage: string
  responseTime: number
  statusCodeNum: number
}

export interface AccessLogSummary {
  summary: {
    totalRequests: number
    avgResponseTime: number
    successCount: number
    clientErrorCount: number
    serverErrorCount: number
  }
  topPaths: Array<{ path: string; count: number; avgResponseTime: number }>
  hourlyRequests: Array<{ hour: string; count: number }>
  countryDistribution: Array<{ country: string; count: number }>
  methodDistribution: Array<{ method: string; count: number }>
}

export interface AccessLogError {
  timestamp: string
  method: string
  path: string
  userId: string
  ip: string
  statusCode: string
  errorMessage: string
  responseTime: number
}

export interface AccessLogSlow {
  timestamp: string
  method: string
  path: string
  userId: string
  statusCode: string
  responseTime: number
}

/**
 * Admin 訪問日誌 API 服務
 */
export const adminAccessLogsService = {
  /**
   * 獲取訪問日誌列表（需要 admin 權限）
   */
  getLogs: async (params?: {
    limit?: number
    offset?: number
    path?: string
    method?: string
    status?: string
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', String(params.limit))
    if (params?.offset) queryParams.append('offset', String(params.offset))
    if (params?.path) queryParams.append('path', params.path)
    if (params?.method) queryParams.append('method', params.method)
    if (params?.status) queryParams.append('status', params.status)

    const queryString = queryParams.toString()
    const url = queryString ? `/access-logs?${queryString}` : '/access-logs'
    const response = await apiClient.get<ApiResponse<AccessLogEntry[]>>(url)
    return response.data
  },

  /**
   * 獲取訪問日誌摘要統計（需要 admin 權限）
   */
  getSummary: async (hours: number = 24) => {
    const response = await apiClient.get<ApiResponse<AccessLogSummary>>(
      `/access-logs/summary?hours=${hours}`
    )
    return response.data
  },

  /**
   * 獲取錯誤日誌（需要 admin 權限）
   */
  getErrors: async (params?: { hours?: number; limit?: number }) => {
    const queryParams = new URLSearchParams()
    if (params?.hours) queryParams.append('hours', String(params.hours))
    if (params?.limit) queryParams.append('limit', String(params.limit))

    const queryString = queryParams.toString()
    const url = queryString ? `/access-logs/errors?${queryString}` : '/access-logs/errors'
    const response = await apiClient.get<ApiResponse<AccessLogError[]>>(url)
    return response.data
  },

  /**
   * 獲取慢請求日誌（需要 admin 權限）
   */
  getSlowRequests: async (params?: { hours?: number; threshold?: number; limit?: number }) => {
    const queryParams = new URLSearchParams()
    if (params?.hours) queryParams.append('hours', String(params.hours))
    if (params?.threshold) queryParams.append('threshold', String(params.threshold))
    if (params?.limit) queryParams.append('limit', String(params.limit))

    const queryString = queryParams.toString()
    const url = queryString ? `/access-logs/slow?${queryString}` : '/access-logs/slow'
    const response = await apiClient.get<ApiResponse<AccessLogSlow[]>>(url)
    return response.data
  },
}

// ═══════════════════════════════════════════════════════════
// Admin 岩場管理 API 服務
// ═══════════════════════════════════════════════════════════

/**
 * 岩場統計介面
 */
export interface AdminCragStats {
  total_crags: number
  total_routes: number
  total_bolts: number
  featured_count: number
  new_this_month: number
  regions: Array<{ region: string; count: number }>
}

/**
 * Admin 岩場 API 服務
 */
export const adminCragService = {
  /**
   * 獲取岩場列表（需要 admin 權限）
   */
  getCrags: async (options?: {
    page?: number
    limit?: number
    search?: string
    region?: string
  }) => {
    const response = await apiClient.get<
      ApiResponse<AdminCrag[]> & {
        pagination: { page: number; limit: number; total: number; total_pages: number }
      }
    >('/admin/crags', { params: options })
    return response.data
  },

  /**
   * 獲取岩場統計（需要 admin 權限）
   */
  getStats: async () => {
    const response = await apiClient.get<ApiResponse<AdminCragStats>>('/admin/crags/stats')
    return response.data
  },

  /**
   * 獲取單一岩場詳情（需要 admin 權限）
   */
  getCrag: async (id: string) => {
    const response = await apiClient.get<
      ApiResponse<AdminCrag & { routes: Route[] }>
    >(`/admin/crags/${id}`)
    return response.data
  },

  /**
   * 批量導入岩場（需要 admin 權限）
   */
  batchImportCrags: async (crags: Partial<AdminCrag>[], skipExisting = false) => {
    const response = await apiClient.post<
      ApiResponse<{ imported: number; skipped: number; errors: string[] }>
    >('/admin/crags/batch-import', { crags, skipExisting })
    return response.data
  },

  /**
   * 更新岩場路線統計（需要 admin 權限）
   */
  updateCounts: async (id: string) => {
    const response = await apiClient.post<
      ApiResponse<{ route_count: number; bolt_count: number }>
    >(`/admin/crags/${id}/update-counts`)
    return response.data
  },

  /**
   * 獲取岩場路線列表（需要 admin 權限）
   */
  getRoutes: async (cragId: string, options?: { page?: number; limit?: number; area_id?: string; sector_id?: string }) => {
    const response = await apiClient.get<
      ApiResponse<Route[]> & {
        pagination: { page: number; limit: number; total: number; total_pages: number }
      }
    >(`/admin/crags/${cragId}/routes`, { params: options })
    return response.data
  },

  /**
   * 新增路線（需要 admin 權限）
   */
  createRoute: async (cragId: string, route: Partial<Route>) => {
    const response = await apiClient.post<ApiResponse<Route>>(
      `/admin/crags/${cragId}/routes`,
      route
    )
    return response.data
  },

  /**
   * 更新路線（需要 admin 權限）
   */
  updateRoute: async (cragId: string, routeId: string, route: Partial<Route>) => {
    const response = await apiClient.put<ApiResponse<Route>>(
      `/admin/crags/${cragId}/routes/${routeId}`,
      route
    )
    return response.data
  },

  /**
   * 刪除路線（需要 admin 權限）
   */
  deleteRoute: async (cragId: string, routeId: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/admin/crags/${cragId}/routes/${routeId}`
    )
    return response.data
  },

  /**
   * 批量導入路線（需要 admin 權限）
   */
  batchImportRoutes: async (cragId: string, routes: Partial<Route>[], skipExisting = false) => {
    const response = await apiClient.post<
      ApiResponse<{ imported: number; skipped: number; errors: string[] }>
    >(`/admin/crags/${cragId}/routes/batch-import`, { routes, skipExisting })
    return response.data
  },

  // ============================================
  // Area (區域) Management
  // ============================================

  /**
   * 獲取區域列表（需要 admin 權限）
   */
  getAreas: async (cragId: string) => {
    const response = await apiClient.get<ApiResponse<AdminArea[]>>(
      `/admin/crags/${cragId}/areas`
    )
    return response.data
  },

  /**
   * 新增區域（需要 admin 權限）
   */
  createArea: async (cragId: string, area: Partial<AdminArea>) => {
    const response = await apiClient.post<ApiResponse<AdminArea>>(
      `/admin/crags/${cragId}/areas`,
      area
    )
    return response.data
  },

  /**
   * 更新區域（需要 admin 權限）
   */
  updateArea: async (cragId: string, areaId: string, area: Partial<AdminArea>) => {
    const response = await apiClient.put<ApiResponse<AdminArea>>(
      `/admin/crags/${cragId}/areas/${areaId}`,
      area
    )
    return response.data
  },

  /**
   * 刪除區域（需要 admin 權限）
   */
  deleteArea: async (cragId: string, areaId: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/admin/crags/${cragId}/areas/${areaId}`
    )
    return response.data
  },

  // ============================================
  // Sector (岩壁) Management
  // ============================================

  /**
   * 獲取岩壁列表（需要 admin 權限）
   */
  getSectors: async (cragId: string, areaId: string) => {
    const response = await apiClient.get<ApiResponse<AdminSector[]>>(
      `/admin/crags/${cragId}/areas/${areaId}/sectors`
    )
    return response.data
  },

  /**
   * 新增岩壁（需要 admin 權限）
   */
  createSector: async (cragId: string, areaId: string, sector: Partial<AdminSector>) => {
    const response = await apiClient.post<ApiResponse<AdminSector>>(
      `/admin/crags/${cragId}/areas/${areaId}/sectors`,
      sector
    )
    return response.data
  },

  /**
   * 更新岩壁（需要 admin 權限）
   */
  updateSector: async (
    cragId: string,
    areaId: string,
    sectorId: string,
    sector: Partial<AdminSector>
  ) => {
    const response = await apiClient.put<ApiResponse<AdminSector>>(
      `/admin/crags/${cragId}/areas/${areaId}/sectors/${sectorId}`,
      sector
    )
    return response.data
  },

  /**
   * 刪除岩壁（需要 admin 權限）
   */
  deleteSector: async (cragId: string, areaId: string, sectorId: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/admin/crags/${cragId}/areas/${areaId}/sectors/${sectorId}`
    )
    return response.data
  },
}
