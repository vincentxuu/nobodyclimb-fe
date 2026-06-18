import type { ApiResponse, BackendUser } from '@nobodyclimb/types'
import apiClient from './api'

export interface UpdateProfilePayload {
  username?: string
  display_name?: string
  bio?: string
  avatar_url?: string
}

interface UploadAvatarResponse {
  url: string
}

export const userService = {
  async uploadAvatar(uri: string) {
    const formData = new FormData()
    formData.append('avatar', {
      uri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as unknown as Blob)

    const response = await apiClient.post<ApiResponse<UploadAvatarResponse>>(
      '/users/upload-avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    if (!response.data.success || !response.data.data?.url) {
      throw new Error(response.data.message || response.data.error || '頭像上傳失敗')
    }

    return response.data.data.url
  },

  async updateProfile(payload: UpdateProfilePayload) {
    const response = await apiClient.put<ApiResponse<BackendUser>>('/auth/profile', payload)

    if (!response.data.success) {
      throw new Error(response.data.message || response.data.error || '更新資料失敗')
    }

    return response.data.data
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await apiClient.post<ApiResponse<Record<string, never>>>(
      '/auth/change-password',
      {
        currentPassword,
        newPassword,
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || response.data.error || '密碼更新失敗')
    }

    return response.data
  },
}
