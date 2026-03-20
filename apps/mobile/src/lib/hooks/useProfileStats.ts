import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export function useProfileStats() {
  return useQuery({
    queryKey: ['profile', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users/me/stats')
      return data.data
    },
  })
}
