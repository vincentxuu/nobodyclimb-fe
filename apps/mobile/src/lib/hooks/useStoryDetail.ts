/**
 * useStoryDetail Hook
 *
 * 依據 StoryType 取得故事詳情
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export type StoryType = 'core-stories' | 'one-liners' | 'stories'

const STORY_ENDPOINTS: Record<StoryType, (id: string) => string> = {
  'core-stories': (id) => `/content/core-stories/${id}/detail`,
  'one-liners': (id) => `/content/one-liners/${id}/detail`,
  stories: (id) => `/content/stories/${id}/detail`,
}

export function isValidStoryType(type: string): type is StoryType {
  return ['core-stories', 'one-liners', 'stories'].includes(type)
}

export function useStoryDetail(type: StoryType, id: string) {
  return useQuery({
    queryKey: ['story', type, id],
    queryFn: async () => {
      const { data } = await apiClient.get(STORY_ENDPOINTS[type](id))
      return data.data
    },
    enabled: isValidStoryType(type) && !!id,
  })
}
