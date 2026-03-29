/**
 * useCoreStories Hook
 *
 * 對應 apps/web/src/lib/hooks/useCoreStories.ts
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

interface CoreStory {
  id: string
  biographyId: string
  dimension: string
  question: string
  answer: string | null
  isPublic: boolean
  order: number
  createdAt: string
  updatedAt: string
}

interface UseCoreStoriesResult {
  stories: CoreStory[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
  updateStory: (id: string, data: Partial<CoreStory>) => Promise<void>
  addStory: (data: Omit<CoreStory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  deleteStory: (id: string) => Promise<void>
  reorderStories: (storyIds: string[]) => Promise<void>
}

export function useCoreStories(biographyId: string): UseCoreStoriesResult {
  const queryClient = useQueryClient()
  const queryKey = ['core-stories', biographyId]

  const {
    data: stories = [],
    isLoading,
    error,
    refetch,
  } = useQuery<CoreStory[]>({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get(`/content/biographies/${biographyId}/core-stories`)
      return response.data?.data ?? response.data ?? []
    },
    enabled: !!biographyId,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CoreStory> }) => {
      await apiClient.patch(`/content/core-stories/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const addMutation = useMutation({
    mutationFn: async (data: Omit<CoreStory, 'id' | 'createdAt' | 'updatedAt'>) => {
      await apiClient.post(`/content/biographies/${biographyId}/core-stories`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/content/core-stories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: async (storyIds: string[]) => {
      await apiClient.post(`/content/biographies/${biographyId}/core-stories/reorder`, { storyIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateStory = async (id: string, data: Partial<CoreStory>) => {
    await updateMutation.mutateAsync({ id, data })
  }

  const addStory = async (data: Omit<CoreStory, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addMutation.mutateAsync(data)
  }

  const deleteStory = async (id: string) => {
    await deleteMutation.mutateAsync(id)
  }

  const reorderStories = async (storyIds: string[]) => {
    await reorderMutation.mutateAsync(storyIds)
  }

  return {
    stories,
    isLoading,
    error: error as Error | null,
    refetch,
    updateStory,
    addStory,
    deleteStory,
    reorderStories,
  }
}
