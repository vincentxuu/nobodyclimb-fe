import { useQuery } from '@tanstack/react-query'
import { evolutionApi } from '@/lib/api/evolution'

export function useEvolutionTimeline(enabled = true) {
  return useQuery({
    queryKey: ['quiz', 'evolution', 'timeline'],
    queryFn: async () => {
      const { data } = await evolutionApi.getTimeline()
      return data.data
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
