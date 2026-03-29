import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface RouteAscentRecord {
  id: string
  user_id: string
  route_id: string
  ascent_type: string
  ascent_date: string
  attempts_count: number
  rating: number | null
  perceived_grade: string | null
  notes: string | null
  is_public: boolean
  photos: string[]
  youtube_url: string | null
  instagram_url: string | null
  created_at: string
  updated_at: string
  // Joined fields
  username?: string
  display_name?: string | null
  avatar_url?: string | null
  route_name?: string
  route_grade?: string
  crag_id?: string
  crag_name?: string
}

export interface RouteAscentSummary {
  total_ascents: number
  unique_climbers: number
  avg_rating: number | null
  rating_count: number
  by_type: Record<string, number>
}

export function useRouteAscents(routeId: string, limit = 5) {
  const ascentsQuery = useQuery({
    queryKey: ['ascents', 'route', routeId, limit],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      const { data } = await apiClient.get(`/ascents/route/${routeId}?${params}`)
      return data.data as RouteAscentRecord[]
    },
    enabled: !!routeId,
  })

  const summaryQuery = useQuery({
    queryKey: ['ascents', 'route', routeId, 'summary'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/ascents/route/${routeId}/summary`)
      return data.data as RouteAscentSummary
    },
    enabled: !!routeId,
  })

  return {
    ascents: ascentsQuery.data ?? [],
    summary: summaryQuery.data ?? null,
    isLoading: ascentsQuery.isLoading || summaryQuery.isLoading,
    refetch: async () => {
      await Promise.all([ascentsQuery.refetch(), summaryQuery.refetch()])
    },
  }
}

export function useCreateAscent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      route_id: string
      ascent_type: string
      ascent_date: string
      rating?: number
      notes?: string
    }) => {
      const response = await apiClient.post('/ascents', data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ascents', 'route', variables.route_id] })
    },
  })
}
