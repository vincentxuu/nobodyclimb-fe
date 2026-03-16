import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface AISource {
  id: string
  type: 'route' | 'crag' | 'video'
  title: string
  excerpt: string
  url: string
  score: number
}

export interface Recommendation {
  id: string
  triggered_by: 'ascent' | 'manual'
  status: 'success' | 'failed'
  recommendation: {
    answer: string
    sources: AISource[]
    context_ascents: unknown[]
  }
  created_at: string
}

export function useRecommendations(offset = 0, limit = 10) {
  return useQuery({
    queryKey: ['recommendations', offset],
    queryFn: async () => {
      const { data } = await apiClient.get(`/ai/recommendations?offset=${offset}&limit=${limit}`)
      return (data?.data ?? { items: [], total: 0 }) as { items: Recommendation[]; total: number }
    },
  })
}

export function useTriggerRecommendation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/ai/recommendations')
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  })
}
