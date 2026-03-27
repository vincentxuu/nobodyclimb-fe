/**
 * usePosts Hook
 *
 * 文章列表與詳情的 TanStack Query hooks
 * 對應後端 /posts 相關端點
 */
import { useQuery } from '@tanstack/react-query'
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

interface PaginationInfo {
  page: number
  limit: number
  total: number
  total_pages: number
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
