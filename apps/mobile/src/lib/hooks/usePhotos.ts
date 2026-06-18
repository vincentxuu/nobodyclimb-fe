/**
 * usePhotos Hook
 *
 * 取得當前用戶的照片列表
 * 對應後端 GET /galleries/photos/me
 */
import type { ApiResponse } from '@nobodyclimb/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

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

export interface GalleryPhotoUpdatePayload {
  caption?: string
  location_country?: string
  location_city?: string
  location_spot?: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  total_pages: number
}

/**
 * 取得我的照片列表
 */
export function useMyPhotos(page = 1, limit = 50) {
  return useQuery<{ photos: GalleryPhoto[]; pagination: PaginationInfo }>({
    queryKey: ['my-photos', page, limit],
    queryFn: async () => {
      const response = await apiClient.get('/galleries/photos/me', {
        params: { page, limit },
      })
      const raw = response.data
      return {
        photos: raw?.data ?? [],
        pagination: raw?.pagination ?? { page, limit, total: 0, total_pages: 0 },
      }
    },
  })
}

/**
 * 刪除照片
 */
export function useDeletePhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/galleries/photos/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-photos'] })
    },
  })
}

/**
 * 上傳照片
 */
export function useUploadPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (photoData: { image_url: string; caption?: string }) => {
      const response = await apiClient.post('/galleries/photos', photoData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-photos'] })
    },
  })
}

/**
 * 更新照片資訊
 */
export function useUpdatePhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: GalleryPhotoUpdatePayload }) => {
      const response = await apiClient.put<ApiResponse<GalleryPhoto>>(
        `/galleries/photos/${id}`,
        payload
      )
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || response.data.error || '照片更新失敗')
      }
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-photos'] })
      queryClient.invalidateQueries({ queryKey: ['gallery-photos'] })
    },
  })
}

/**
 * 上傳照片檔案到媒體儲存，回傳可寫入 gallery 的 URL。
 */
export function useUploadPhotoImage() {
  return useMutation({
    mutationFn: async (uri: string) => {
      const formData = new FormData()
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: `photo-${Date.now()}.jpg`,
      } as unknown as Blob)

      const response = await apiClient.post<ApiResponse<{ url: string }>>(
        '/media/upload?type=gallery',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      if (!response.data.success || !response.data.data?.url) {
        throw new Error(response.data.message || response.data.error || '圖片上傳失敗')
      }

      return response.data.data.url
    },
  })
}
