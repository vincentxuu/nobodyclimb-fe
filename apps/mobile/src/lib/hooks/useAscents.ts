import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { AscentType } from '@/lib/constants/ascent'

export type { AscentType }

export interface AscentFilters {
  ascent_type?: AscentType
  crag_id?: string
  page?: number
  limit?: number
}

export interface CreateAscentPayload {
  route_id: string
  ascent_type: AscentType
  date?: string
  attempts?: number
  rating?: number
  notes?: string
}

export interface UpdateAscentPayload {
  ascent_type?: AscentType
  date?: string
  attempts?: number
  rating?: number
  notes?: string
}

export function useMyAscents(filters: AscentFilters = {}) {
  return useQuery({
    queryKey: ['ascents', 'my', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.ascent_type) params.set('ascent_type', filters.ascent_type)
      if (filters.crag_id) params.set('crag_id', filters.crag_id)
      params.set('page', String(filters.page ?? 1))
      params.set('limit', String(filters.limit ?? 10))
      const { data } = await apiClient.get(`/ascents?${params}`)
      return data.data
    },
  })
}

export function useMyAscentStats() {
  return useQuery({
    queryKey: ['ascents', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/ascents/stats')
      return data.data
    },
  })
}

export function useCreateAscent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateAscentPayload) => {
      const { data } = await apiClient.post('/ascents', body)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ascents'] }),
  })
}

export function useUpdateAscent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: UpdateAscentPayload }) => {
      const { data } = await apiClient.put(`/ascents/${id}`, body)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ascents'] }),
  })
}

export function useDeleteAscent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/ascents/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ascents'] }),
  })
}
