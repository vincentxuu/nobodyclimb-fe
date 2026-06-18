/**
 * usePosts Hook
 *
 * 文章列表與詳情的 TanStack Query hooks
 * 對應後端 /posts 相關端點
 */
import type { ApiResponse, PostCategory } from '@nobodyclimb/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface Post {
  id: string
  author_id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image: string | null
  category: string | null
  status: 'draft' | 'published' | 'archived'
  is_featured: number
  view_count: number
  published_at: string | null
  created_at: string
  updated_at: string
  tags?: string[]
  username?: string
  display_name?: string
  author_avatar?: string
}

export const POST_CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'beginner', label: '新手入門' },
  { value: 'news', label: '新聞動態' },
  { value: 'gear', label: '裝備分享' },
  { value: 'skills', label: '技巧分享' },
  { value: 'training', label: '訓練計畫' },
  { value: 'routes', label: '路線攻略' },
  { value: 'crags', label: '岩場開箱' },
  { value: 'gyms', label: '岩館開箱' },
  { value: 'travel', label: '攀岩旅遊' },
  { value: 'competition', label: '賽事介紹' },
  { value: 'events', label: '活動介紹' },
  { value: 'community', label: '社群資源' },
  { value: 'injury', label: '傷害防護' },
]

export interface PostPayload {
  title: string
  slug?: string
  content: string
  excerpt?: string | null
  cover_image?: string | null
  category?: PostCategory | null
  tags?: string[]
  status: 'draft' | 'published' | 'archived'
}

export interface PostImageUploadPayload {
  uri: string
  name?: string
  type?: string
}

export interface PostLikeStatus {
  liked: boolean
  likes: number
}

export interface PostBookmarkStatus {
  bookmarked: boolean
  bookmarks: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  total_pages: number
}

function invalidatePostQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['posts'] })
  queryClient.invalidateQueries({ queryKey: ['my-posts'] })
}

/**
 * 取得文章列表
 */
export function usePosts(page = 1, limit = 20) {
  return useQuery<{ posts: Post[]; pagination: PaginationInfo }>({
    queryKey: ['posts', page, limit],
    queryFn: async () => {
      const response = await apiClient.get('/posts', {
        params: { page, limit },
      })
      const data = response.data
      // 後端返回 { success, data: [...], pagination }
      return {
        posts: data?.data ?? [],
        pagination: data?.pagination ?? { page, limit, total: 0, total_pages: 0 },
      }
    },
  })
}

/**
 * 取得文章詳情（通過 ID）
 */
export function usePost(id: string | undefined) {
  return useQuery<Post | null>({
    queryKey: ['post', id],
    queryFn: async () => {
      const response = await apiClient.get(`/posts/${id}`)
      return response.data?.data ?? response.data ?? null
    },
    enabled: !!id,
  })
}

/**
 * 取得當前用戶的文章列表
 */
export function useMyPosts(page = 1, limit = 50) {
  return useQuery<{ posts: Post[]; pagination: PaginationInfo }>({
    queryKey: ['my-posts', page, limit],
    queryFn: async () => {
      const response = await apiClient.get('/posts/me', {
        params: { page, limit },
      })
      const data = response.data?.data ?? response.data
      // /posts/me 返回 { success, data: { data: [...], pagination } }
      return {
        posts: data?.data ?? data ?? [],
        pagination: data?.pagination ?? { page, limit, total: 0, total_pages: 0 },
      }
    },
  })
}

export function usePopularPosts(limit = 4) {
  return useQuery<Post[]>({
    queryKey: ['posts', 'popular', limit],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Post[]>>('/posts/popular', {
        params: { limit },
      })
      return response.data?.data ?? []
    },
  })
}

export function useRelatedPosts(id: string | undefined, limit = 3) {
  return useQuery<Post[]>({
    queryKey: ['posts', id, 'related', limit],
    queryFn: async () => {
      try {
        const response = await apiClient.get<ApiResponse<Post[]>>(`/posts/${id}/related`, {
          params: { limit },
        })
        return response.data?.data ?? []
      } catch (error) {
        const status =
          error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined
        if (status === 404) return []
        throw error
      }
    },
    enabled: !!id,
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: PostPayload) => {
      const response = await apiClient.post<ApiResponse<Post>>('/posts', payload)
      if (!response.data.data) {
        throw new Error('Post response is empty')
      }
      return response.data.data
    },
    onSuccess: () => {
      invalidatePostQueries(queryClient)
    },
  })
}

export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<PostPayload> }) => {
      const response = await apiClient.put<ApiResponse<Post>>(`/posts/${id}`, payload)
      if (!response.data.data) {
        throw new Error('Post response is empty')
      }
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      invalidatePostQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] })
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<ApiResponse<{}>>(`/posts/${id}`)
      return response.data
    },
    onSuccess: (_data, id) => {
      invalidatePostQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: ['post', id] })
    },
  })
}

export function usePostLikeStatus(id: string | undefined, enabled = true) {
  return useQuery<PostLikeStatus>({
    queryKey: ['post-like-status', id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PostLikeStatus>>(`/posts/${id}/like`)
      if (!response.data.data) {
        throw new Error('Post like status response is empty')
      }
      return response.data.data
    },
    enabled: !!id && enabled,
    retry: false,
  })
}

export function useTogglePostLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<ApiResponse<PostLikeStatus>>(`/posts/${id}/like`)
      if (!response.data.data) {
        throw new Error('Post like response is empty')
      }
      return response.data.data
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['post-like-status', id] })
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}

export function usePostBookmarkStatus(id: string | undefined, enabled = true) {
  return useQuery<PostBookmarkStatus>({
    queryKey: ['post-bookmark-status', id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PostBookmarkStatus>>(`/posts/${id}/bookmark`)
      if (!response.data.data) {
        throw new Error('Post bookmark status response is empty')
      }
      return response.data.data
    },
    enabled: !!id && enabled,
    retry: false,
  })
}

export function useTogglePostBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<ApiResponse<PostBookmarkStatus>>(
        `/posts/${id}/bookmark`
      )
      if (!response.data.data) {
        throw new Error('Post bookmark response is empty')
      }
      return response.data.data
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['post-bookmark-status', id] })
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}

export function useUploadPostImage() {
  return useMutation({
    mutationFn: async ({
      uri,
      name = `post-${Date.now()}.jpg`,
      type = 'image/jpeg',
    }: PostImageUploadPayload) => {
      const formData = new FormData()
      formData.append('image', {
        uri,
        type,
        name,
      } as unknown as Blob)

      const response = await apiClient.post<ApiResponse<{ url: string }>>(
        '/media/upload?type=posts',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      if (!response.data.data?.url) {
        throw new Error('Image upload response is empty')
      }

      return response.data.data.url
    },
  })
}
