/**
 * useCoreStories Hook
 *
 * 對應 apps/web/src/lib/hooks/useCoreStories.ts
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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
      // TODO: 整合實際 API
      // const response = await apiClient.get(`/api/v1/biographies/${biographyId}/core-stories`)
      // return response.data

      // 模擬資料
      return [
        {
          id: '1',
          biographyId,
          dimension: 'beginning',
          question: '你是怎麼開始攀岩的？',
          answer: '大學時期朋友邀請去體驗...',
          isPublic: true,
          order: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-15',
        },
        {
          id: '2',
          biographyId,
          dimension: 'milestone',
          question: '攀岩生涯中最難忘的時刻？',
          answer: null,
          isPublic: true,
          order: 1,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ]
    },
    enabled: !!biographyId,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CoreStory> }) => {
      // TODO: 整合實際 API
      // await apiClient.patch(`/api/v1/core-stories/${id}`, data)
      console.log('Update story:', id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const addMutation = useMutation({
    mutationFn: async (data: Omit<CoreStory, 'id' | 'createdAt' | 'updatedAt'>) => {
      // TODO: 整合實際 API
      // await apiClient.post(`/api/v1/biographies/${biographyId}/core-stories`, data)
      console.log('Add story:', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: 整合實際 API
      // await apiClient.delete(`/api/v1/core-stories/${id}`)
      console.log('Delete story:', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: async (storyIds: string[]) => {
      // TODO: 整合實際 API
      // await apiClient.post(`/api/v1/biographies/${biographyId}/core-stories/reorder`, { storyIds })
      console.log('Reorder stories:', storyIds)
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
