/**
 * useAboutStats Hook
 *
 * 對應 apps/web/src/lib/hooks/useAboutStats.ts
 */
import { useQuery } from '@tanstack/react-query'

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
      // TODO: 整合實際 API
      // const response = await apiClient.get('/api/v1/stats/about')
      // return response.data

      // 模擬資料
      return {
        totalUsers: 5000,
        totalBiographies: 150,
        totalCrags: 45,
        totalGyms: 120,
        totalArticles: 350,
        totalVideos: 800,
      }
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
