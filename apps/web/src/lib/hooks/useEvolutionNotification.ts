import { useQuery } from '@tanstack/react-query'
import { evolutionApi } from '@/lib/api/evolution'

export function useEvolutionNotification(enabled = true) {
  return useQuery({
    queryKey: ['quiz', 'evolution', 'notification'],
    queryFn: async () => {
      const { data } = await evolutionApi.getNotification()
      return data.data
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    retry: false,
  })
}
