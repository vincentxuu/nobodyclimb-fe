/**
 * 路線照片 Hook
 *
 * 聚合路線的靜態照片、用戶故事照片、攀爬記錄照片
 * 對應 web 版 RoutePhotosSection 的資料來源
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface PhotoItem {
  url: string
  source: 'static' | 'user'
  caption?: string
  username?: string
  displayName?: string
  storyId?: string
}

interface RouteStory {
  id: string
  photos?: string[]
  content?: string
  username?: string
  display_name?: string
}

interface UserRouteAscent {
  id: string
  photos?: string[]
  notes?: string
  username?: string
  display_name?: string
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

function extractData<T>(response: any): T {
  return response.data?.data ?? response.data
}

/**
 * 取得路線所有照片（聚合多個來源）
 */
export function useRoutePhotos(routeId: string, staticPhotos: string[] = []) {
  return useQuery({
    queryKey: ['route-photos', routeId],
    queryFn: async (): Promise<PhotoItem[]> => {
      // 並行取得 route stories（含照片）和 ascent 記錄
      const [storiesRes, ascentsRes] = await Promise.allSettled([
        apiClient.get<PaginatedResponse<RouteStory>>(
          `/route-stories/route/${routeId}?has_photos=true&limit=20`
        ),
        apiClient.get<PaginatedResponse<UserRouteAscent>>(
          `/ascents/route/${routeId}?limit=50`
        ),
      ])

      const stories: RouteStory[] =
        storiesRes.status === 'fulfilled'
          ? extractData<PaginatedResponse<RouteStory>>(storiesRes.value)?.data ?? []
          : []

      const ascents: UserRouteAscent[] =
        ascentsRes.status === 'fulfilled'
          ? (extractData<PaginatedResponse<UserRouteAscent>>(ascentsRes.value)?.data ?? []).filter(
              (a) => a.photos && a.photos.length > 0
            )
          : []

      // 聚合所有照片
      const photos: PhotoItem[] = [
        // 靜態照片
        ...staticPhotos.map((url) => ({
          url,
          source: 'static' as const,
        })),
        // 用戶故事照片
        ...stories.flatMap((story) =>
          (story.photos || []).map((url) => ({
            url,
            source: 'user' as const,
            caption: story.content || undefined,
            username: story.username,
            displayName: story.display_name || undefined,
            storyId: story.id,
          }))
        ),
        // 攀爬記錄照片
        ...ascents.flatMap((ascent) =>
          (ascent.photos || []).map((url) => ({
            url,
            source: 'user' as const,
            caption: ascent.notes || undefined,
            username: ascent.username,
            displayName: ascent.display_name || undefined,
            storyId: ascent.id,
          }))
        ),
      ]

      return photos
    },
    enabled: !!routeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
