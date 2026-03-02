/**
 * useBiographyStats Hook
 *
 * 對應 apps/web/src/lib/hooks/useBiographyStats.ts
 */
import { useQuery } from '@tanstack/react-query'

interface BiographyStats {
  totalBiographies: number
  totalStories: number
  totalInteractions: number
  recentActivity: {
    newBiographies: number
    newStories: number
    period: string
  }
}

interface UseBiographyStatsResult {
  stats: BiographyStats | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useBiographyStats(): UseBiographyStatsResult {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery<BiographyStats>({
    queryKey: ['biography-stats'],
    queryFn: async () => {
      // TODO: 整合實際 API
      // const response = await apiClient.get('/api/v1/biographies/stats')
      // return response.data

      // 模擬資料
      return {
        totalBiographies: 150,
        totalStories: 1200,
        totalInteractions: 8500,
        recentActivity: {
          newBiographies: 12,
          newStories: 85,
          period: '本週',
        },
      }
    },
    staleTime: 5 * 60 * 1000, // 5 分鐘
  })

  return {
    stats: stats ?? null,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
