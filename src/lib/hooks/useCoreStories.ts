'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { biographyContentService, type CoreStory } from '@/lib/api/services'

// ═══════════════════════════════════════════
// Hook: useCoreStories
// 取得指定 biography 的所有核心故事，支援快取共享
// ═══════════════════════════════════════════

export function useCoreStories(biographyId: string | undefined) {
  return useQuery({
    queryKey: ['coreStories', biographyId],
    queryFn: async (): Promise<CoreStory[]> => {
      if (!biographyId) return []
      const response = await biographyContentService.getCoreStories(biographyId)
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch core stories')
      }
      return response.data
    },
    enabled: !!biographyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}

// ═══════════════════════════════════════════
// Helper Hooks - 取得特定核心故事
// ═══════════════════════════════════════════

type CoreStoryQuestionId = 'climbing_origin' | 'climbing_meaning' | 'advice_to_self'

/**
 * 取得特定問題的核心故事
 */
export function useCoreStory(
  biographyId: string | undefined,
  questionId: CoreStoryQuestionId
) {
  const { data: stories, isLoading, error } = useCoreStories(biographyId)
  const story = stories?.find((s) => s.question_id === questionId) || null
  return { story, isLoading, error }
}

/**
 * 取得「你與攀岩的相遇」故事
 */
export function useClimbingOriginStory(biographyId: string | undefined) {
  return useCoreStory(biographyId, 'climbing_origin')
}

/**
 * 取得「攀岩對你來說是什麼」故事
 */
export function useClimbingMeaningStory(biographyId: string | undefined) {
  return useCoreStory(biographyId, 'climbing_meaning')
}

/**
 * 取得「給剛開始攀岩的自己」故事
 */
export function useAdviceToSelfStory(biographyId: string | undefined) {
  return useCoreStory(biographyId, 'advice_to_self')
}

// ═══════════════════════════════════════════
// Mutation Hooks - 按讚與留言
// ═══════════════════════════════════════════

/**
 * 核心故事按讚 mutation
 */
export function useCoreStoryLikeMutation(biographyId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (storyId: string) => {
      const response = await biographyContentService.toggleCoreStoryLike(storyId)
      if (!response.success || !response.data) {
        throw new Error('Failed to toggle like')
      }
      return response.data
    },
    onSuccess: (data, storyId) => {
      // 更新快取中的故事
      queryClient.setQueryData<CoreStory[]>(
        ['coreStories', biographyId],
        (oldStories) => {
          if (!oldStories) return oldStories
          return oldStories.map((story) =>
            story.id === storyId
              ? { ...story, is_liked: data.liked, like_count: data.like_count }
              : story
          )
        }
      )
    },
  })
}

/**
 * 取得核心故事留言
 */
export function useCoreStoryComments(storyId: string | undefined) {
  return useQuery({
    queryKey: ['coreStoryComments', storyId],
    queryFn: async () => {
      if (!storyId) return []
      const response = await biographyContentService.getCoreStoryComments(storyId)
      if (!response.success || !response.data) {
        return []
      }
      return response.data
    },
    enabled: !!storyId,
    staleTime: 1000 * 60, // 1 minute
  })
}

/**
 * 新增核心故事留言 mutation
 */
export function useCoreStoryCommentMutation(
  biographyId: string | undefined,
  storyId: string | undefined
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (content: string) => {
      if (!storyId) throw new Error('No story ID')
      const response = await biographyContentService.addCoreStoryComment(storyId, { content })
      if (!response.success || !response.data) {
        throw new Error('Failed to add comment')
      }
      return response.data
    },
    onSuccess: () => {
      // 重新載入留言
      queryClient.invalidateQueries({ queryKey: ['coreStoryComments', storyId] })
      // 更新故事的 comment_count
      queryClient.setQueryData<CoreStory[]>(
        ['coreStories', biographyId],
        (oldStories) => {
          if (!oldStories) return oldStories
          return oldStories.map((story) =>
            story.id === storyId
              ? { ...story, comment_count: story.comment_count + 1 }
              : story
          )
        }
      )
    },
  })
}
