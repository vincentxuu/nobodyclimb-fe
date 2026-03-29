/**
 * useGallery Hook
 *
 * 圖庫照片列表的 TanStack Query hook
 * 對應後端 GET /galleries/photos 端點
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { GalleryGridPhoto } from '@/components/gallery'
import { apiClient } from '@/lib/api'

interface GalleryPhoto {
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
 * 將後端 GalleryPhoto 轉換為前端 GalleryGridPhoto
 */
function toGridPhoto(photo: GalleryPhoto): GalleryGridPhoto {
  const hasLocation = photo.location_country || photo.location_city || photo.location_spot
  return {
    id: photo.id,
    src: photo.image_url,
    alt: photo.caption || `攀岩照片`,
    location: hasLocation
      ? {
          country: photo.location_country,
          city: photo.location_city,
          spot: photo.location_spot,
        }
      : undefined,
    author: {
      id: photo.author_id,
      username: photo.username,
      displayName: photo.display_name || photo.username,
      avatar: photo.author_avatar,
    },
  }
}

/**
 * 取得圖庫照片列表
 */
export function useGallery(page = 1, limit = 20) {
  return useQuery<{ photos: GalleryGridPhoto[]; pagination: PaginationInfo }>({
    queryKey: ['gallery-photos', page, limit],
    queryFn: async () => {
      const response = await apiClient.get('/galleries/photos', {
        params: { page, limit },
      })
      const data = response.data
      const photos: GalleryPhoto[] = data?.data ?? []
      return {
        photos: photos.map(toGridPhoto),
        pagination: data?.pagination ?? { page, limit, total: 0, total_pages: 0 },
      }
    },
  })
}

/**
 * 重新整理圖庫照片（用於下拉刷新）
 */
export function useRefreshGallery() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['gallery-photos'] })
}
