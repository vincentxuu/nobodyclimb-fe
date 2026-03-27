/**
 * useBiographyStats Hook
 *
 * 對應 apps/web/src/lib/hooks/useBiographyStats.ts
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

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
      const response = await apiClient.get('/biographies/stats')
      return response.data?.data ?? response.data
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
