/**
 * 路線故事 TanStack Query Hooks
 *
 * 對應 apps/web/src/lib/hooks/useRouteStories.ts
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

// ── Types ──────────────────────────────────────────────

export type RouteStoryVisibility = 'public' | 'community' | 'private'

export interface RouteStory {
  id: string
  user_id: string
  route_id: string
  title: string | null
  content: string
  photos: string[]
  youtube_url: string | null
  instagram_url: string | null
  visibility: RouteStoryVisibility
  is_featured: boolean
  is_verified: boolean
  like_count: number
  comment_count: number
  helpful_count: number
  created_at: string
  updated_at: string
  is_liked?: boolean
  is_helpful?: boolean
  // Joined fields
  route_name?: string
  route_grade?: string
  crag_id?: string
  crag_name?: string
  username?: string
  display_name?: string | null
  avatar_url?: string | null
}

export interface RouteStoryFormData {
  route_id: string
  title?: string | null
  content: string
  photos?: string[]
  youtube_url?: string | null
  instagram_url?: string | null
  visibility?: RouteStoryVisibility
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// ── Helpers ────────────────────────────────────────────

function extractPaginatedData<T>(response: any): PaginatedResponse<T> {
  return response.data ?? response
}

// ── Query Keys ─────────────────────────────────────────

export const routeStoryKeys = {
  all: ['route-stories'] as const,
  byRoute: (routeId: string) => [...routeStoryKeys.all, 'route', routeId] as const,
}

// ── Hooks ──────────────────────────────────────────────

/**
 * 取得路線故事列表
 */
export function useRouteStories(routeId: string, limit = 10) {
  return useQuery({
    queryKey: routeStoryKeys.byRoute(routeId),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('limit', limit.toString())
      const response = await apiClient.get<PaginatedResponse<RouteStory>>(
        `/route-stories/route/${routeId}?${params.toString()}`
      )
      return extractPaginatedData<RouteStory>(response)
    },
    enabled: !!routeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

/**
 * 新增路線故事
 */
export function useCreateRouteStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RouteStoryFormData) => {
      const response = await apiClient.post<{ success: boolean; data: RouteStory }>(
        '/route-stories',
        data
      )
      return response.data?.data ?? response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: routeStoryKeys.byRoute(variables.route_id),
      })
    },
  })
}

/**
 * 按讚/取消按讚
 */
export function useToggleStoryLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ storyId, routeId }: { storyId: string; routeId: string }) => {
      const response = await apiClient.post<{
        success: boolean
        data: { is_liked: boolean }
      }>(`/route-stories/${storyId}/like`)
      return response.data?.data ?? response.data
    },
    onMutate: async ({ storyId, routeId }) => {
      await queryClient.cancelQueries({ queryKey: routeStoryKeys.byRoute(routeId) })

      const previousData = queryClient.getQueryData<PaginatedResponse<RouteStory>>(
        routeStoryKeys.byRoute(routeId)
      )

      if (previousData) {
        queryClient.setQueryData<PaginatedResponse<RouteStory>>(
          routeStoryKeys.byRoute(routeId),
          {
            ...previousData,
            data: previousData.data.map((story) =>
              story.id === storyId
                ? {
                    ...story,
                    is_liked: !story.is_liked,
                    like_count: story.is_liked
                      ? story.like_count - 1
                      : story.like_count + 1,
                  }
                : story
            ),
          }
        )
      }

      return { previousData }
    },
    onError: (_err, { routeId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          routeStoryKeys.byRoute(routeId),
          context.previousData
        )
      }
    },
  })
}

/**
 * 標記有幫助/取消有幫助
 */
export function useToggleStoryHelpful() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ storyId, routeId }: { storyId: string; routeId: string }) => {
      const response = await apiClient.post<{
        success: boolean
        data: { is_helpful: boolean }
      }>(`/route-stories/${storyId}/helpful`)
      return response.data?.data ?? response.data
    },
    onMutate: async ({ storyId, routeId }) => {
      await queryClient.cancelQueries({ queryKey: routeStoryKeys.byRoute(routeId) })

      const previousData = queryClient.getQueryData<PaginatedResponse<RouteStory>>(
        routeStoryKeys.byRoute(routeId)
      )

      if (previousData) {
        queryClient.setQueryData<PaginatedResponse<RouteStory>>(
          routeStoryKeys.byRoute(routeId),
          {
            ...previousData,
            data: previousData.data.map((story) =>
              story.id === storyId
                ? {
                    ...story,
                    is_helpful: !story.is_helpful,
                    helpful_count: story.is_helpful
                      ? story.helpful_count - 1
                      : story.helpful_count + 1,
                  }
                : story
            ),
          }
        )
      }

      return { previousData }
    },
    onError: (_err, { routeId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          routeStoryKeys.byRoute(routeId),
          context.previousData
        )
      }
    },
  })
}
