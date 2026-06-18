/**
 * useAboutStats Hook
 *
 * 對應 apps/web/src/lib/hooks/useAboutStats.ts
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface AboutStats {
  crags: number
  routes: number
  biographies: number
  videos: number
  gyms: number
  posts: number
}

const DEFAULT_STATS: AboutStats = {
  gyms: 39,
  crags: 5,
  routes: 946,
  videos: 6500,
  biographies: 50,
  posts: 0,
}

interface UseAboutStatsResult {
  stats: AboutStats
  isLoading: boolean
  isFetching: boolean
  error: Error | null
}

export function useAboutStats(): UseAboutStatsResult {
  const {
    data: stats,
    isLoading,
    isFetching,
    error,
  } = useQuery<AboutStats>({
    queryKey: ['site-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/stats')
      const data = response.data?.data ?? response.data
      return {
        gyms: data.gyms,
        crags: data.crags,
        routes: data.routes,
        videos: data.videos,
        biographies: data.biographies,
        posts: data.posts,
      }
    },
    staleTime: 10 * 60 * 1000, // 10 分鐘
    gcTime: 20 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  })

  return {
    stats: stats ?? DEFAULT_STATS,
    isLoading,
    isFetching,
    error: error as Error | null,
  }
}
