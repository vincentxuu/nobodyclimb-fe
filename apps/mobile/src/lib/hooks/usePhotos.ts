/**
 * usePhotos Hook
 *
 * 取得當前用戶的照片列表
 * 對應後端 GET /galleries/photos/me
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
