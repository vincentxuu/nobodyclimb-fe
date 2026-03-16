import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export type MemoryKey = 'climbing_level' | 'preferred_region' | 'preferred_style' | 'preferred_crag' | 'goals'
export type MemoryType = 'preference' | 'behavior' | 'fact'

export interface UserMemory {
  id: string
  memory_key: MemoryKey
  memory_type: MemoryType
  content: string
  updated_at: string
}

export function useAiMemory() {
  return useQuery({
    queryKey: ['ai-memory'],
    queryFn: async () => {
      const { data } = await apiClient.get('/ai/memory')
      return data.data as UserMemory[]
    },
  })
}

export function useDeleteAiMemory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/ai/memory/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-memory'] }),
  })
}
