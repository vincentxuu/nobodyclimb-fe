/**
 * Biography Service
 *
 * 提供人物誌相關的 API 操作
 */
import { apiClient } from './api'

interface LikeStatusResponse {
  liked: boolean
  likes: number
}

export interface BiographyComment {
  id: string
  biography_id: string
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  content: string
  created_at: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export const biographyService = {
  /**
   * 取得按讚狀態
   */
  async getLikeStatus(biographyId: string): Promise<ApiResponse<LikeStatusResponse>> {
    try {
      const response = await apiClient.get<LikeStatusResponse>(`/biographies/${biographyId}/like`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('[biographyService] getLikeStatus error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 切換按讚狀態
   */
  async toggleLike(biographyId: string): Promise<ApiResponse<LikeStatusResponse>> {
    try {
      const response = await apiClient.post<LikeStatusResponse>(`/biographies/${biographyId}/like`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('[biographyService] toggleLike error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 取得追蹤狀態
   */
  async getFollowStatus(
    biographyId: string
  ): Promise<ApiResponse<{ following: boolean; followers: number }>> {
    try {
      const response = await apiClient.get<{ following: boolean; followers: number }>(
        `/biographies/${biographyId}/follow`
      )
      return { success: true, data: response.data }
    } catch (error) {
      console.error('[biographyService] getFollowStatus error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 切換追蹤狀態
   */
  async toggleFollow(
    biographyId: string
  ): Promise<ApiResponse<{ following: boolean; followers: number }>> {
    try {
      const response = await apiClient.post<{ following: boolean; followers: number }>(
        `/biographies/${biographyId}/follow`
      )
      return { success: true, data: response.data }
    } catch (error) {
      console.error('[biographyService] toggleFollow error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 追蹤
   */
  async follow(
    biographyId: string
  ): Promise<ApiResponse<{ following: boolean; followers: number }>> {
    try {
      const response = await apiClient.post<{ following: boolean; followers: number }>(
        `/biographies/${biographyId}/follow`
      )
      return { success: true, data: response.data }
    } catch (error) {
      console.error('[biographyService] follow error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 取消追蹤
   */
  async unfollow(
    biographyId: string
  ): Promise<ApiResponse<{ following: boolean; followers: number }>> {
    try {
      const response = await apiClient.delete<{ following: boolean; followers: number }>(
        `/biographies/${biographyId}/follow`
      )
      return { success: true, data: response.data }
    } catch (error) {
      console.error('[biographyService] unfollow error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 取得人物誌詳情
   */
  async getBiography(slugOrId: string): Promise<ApiResponse<unknown>> {
    try {
      const response = await apiClient.get(`/biographies/${slugOrId}`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('[biographyService] getBiography error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 更新人物誌
   */
  async updateBiography(id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    try {
      const response = await apiClient.patch(`/biographies/${id}`, data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('[biographyService] updateBiography error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 上傳頭像
   */
  async uploadAvatar(id: string, formData: FormData): Promise<ApiResponse<{ avatar_url: string }>> {
    try {
      const response = await apiClient.post<{ avatar_url: string }>(
        `/biographies/${id}/avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return { success: true, data: response.data }
    } catch (error) {
      console.error('[biographyService] uploadAvatar error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 上傳封面圖片
   */
  async uploadCover(id: string, formData: FormData): Promise<ApiResponse<{ cover_image: string }>> {
    try {
      const response = await apiClient.post<{ cover_image: string }>(
        `/biographies/${id}/cover`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return { success: true, data: response.data }
    } catch (error) {
      console.error('[biographyService] uploadCover error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 取得當前用戶的人物誌
   */
  async getMyBiography(): Promise<ApiResponse<unknown>> {
    try {
      const response = await apiClient.get('/biographies/me')
      return { success: true, data: response.data }
    } catch (error) {
      console.error('[biographyService] getMyBiography error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 更新當前用戶的人物誌
   */
  async updateMyBiography(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    try {
      const response = await apiClient.patch('/biographies/me', data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('[biographyService] updateMyBiography error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 註冊流程用：如果目前使用者還沒有人物誌，先建立再更新。
   */
  async updateRegistrationBiography(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    try {
      const response = await apiClient.put('/biographies/me', data)
      return { success: true, data: response.data }
    } catch (error) {
      const status =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined

      if (status !== 404) {
        console.error('[biographyService] updateRegistrationBiography error:', error)
        return { success: false, error: String(error) }
      }

      try {
        await apiClient.post('/biographies', {
          name: '攀岩者',
          is_public: 1,
          visibility: 'public',
        })
        const response = await apiClient.put('/biographies/me', data)
        return { success: true, data: response.data }
      } catch (retryError) {
        console.error('[biographyService] updateRegistrationBiography retry error:', retryError)
        return { success: false, error: String(retryError) }
      }
    }
  },

  /**
   * 建立新的人物誌
   */
  async createBiography(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    try {
      const response = await apiClient.post('/biographies', data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('[biographyService] createBiography error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 上傳圖片 (通用)
   */
  async uploadImage(formData: FormData): Promise<ApiResponse<{ url: string }>> {
    try {
      const response = await apiClient.post<{ url: string }>('/biographies/me/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return { success: true, data: response.data }
    } catch (error) {
      console.error('[biographyService] uploadImage error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 上傳人物誌圖片到媒體儲存。
   */
  async uploadBiographyImage(
    uri: string,
    oldUrl?: string | null
  ): Promise<ApiResponse<{ url: string }>> {
    try {
      const formData = new FormData()
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: `biography-${Date.now()}.jpg`,
      } as unknown as Blob)
      if (oldUrl) {
        formData.append('old_url', oldUrl)
      }

      const response = await apiClient.post<ApiResponse<{ url: string }>>(
        '/media/upload?type=biography',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      if (!response.data.success || !response.data.data?.url) {
        return {
          success: false,
          error: response.data.error || '圖片上傳失敗',
        }
      }

      return { success: true, data: response.data.data }
    } catch (error) {
      console.error('[biographyService] uploadBiographyImage error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 取得人物誌評論
   */
  async getComments(biographyId: string): Promise<ApiResponse<BiographyComment[]>> {
    try {
      const response = await apiClient.get<ApiResponse<BiographyComment[]>>(
        `/biographies/${biographyId}/comments`
      )
      return response.data
    } catch (error) {
      console.error('[biographyService] getComments error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 新增人物誌評論
   */
  async addComment(biographyId: string, content: string): Promise<ApiResponse<BiographyComment>> {
    try {
      const response = await apiClient.post<ApiResponse<BiographyComment>>(
        `/biographies/${biographyId}/comments`,
        { content }
      )
      return response.data
    } catch (error) {
      console.error('[biographyService] addComment error:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * 刪除人物誌評論
   */
  async deleteComment(commentId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `/biographies/comments/${commentId}`
      )
      return response.data
    } catch (error) {
      console.error('[biographyService] deleteComment error:', error)
      return { success: false, error: String(error) }
    }
  },
}

export default biographyService
