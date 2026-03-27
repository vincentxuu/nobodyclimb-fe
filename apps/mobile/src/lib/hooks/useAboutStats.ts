/**
 * useAboutStats Hook
 *
 * 對應 apps/web/src/lib/hooks/useAboutStats.ts
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

interface AboutStats {
  totalUsers: number
  totalBiographies: number
  totalCrags: number
  totalGyms: number
  totalArticles: number
  totalVideos: number
}

interface UseAboutStatsResult {
  stats: AboutStats | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useAboutStats(): UseAboutStatsResult {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery<AboutStats>({
    queryKey: ['about-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/stats')
      return response.data?.data ?? response.data
    },
    staleTime: 10 * 60 * 1000, // 10 分鐘
  })

  return {
    stats: stats ?? null,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
