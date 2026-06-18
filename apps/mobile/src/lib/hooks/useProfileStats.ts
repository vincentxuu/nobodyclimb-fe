import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { useBiographyStats } from './useBiographyStats'

interface MyBiography {
  id: string
}

function isNotFoundError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 404
  )
}

export function useMyBiography() {
  return useQuery<MyBiography | null>({
    queryKey: ['my-biography'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/biographies/me')
        const data = response.data?.data ?? response.data
        return data ?? null
      } catch (error) {
        if (isNotFoundError(error)) return null
        throw error
      }
    },
  })
}

export function useProfileStats() {
  const biographyQuery = useMyBiography()
  const statsQuery = useBiographyStats(biographyQuery.data?.id)

  return {
    ...statsQuery,
    biography: biographyQuery.data,
    data: statsQuery.data,
    hasBiography: !!biographyQuery.data?.id,
    isBiographyLoading: biographyQuery.isLoading,
    isLoading: biographyQuery.isLoading || statsQuery.isLoading,
    isError: biographyQuery.isError || statsQuery.isError,
    isBiographyError: biographyQuery.isError,
    isStatsError: statsQuery.isError,
    error: biographyQuery.error ?? statsQuery.error,
  }
}
