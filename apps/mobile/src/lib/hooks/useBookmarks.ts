/**
 * useBookmarks Hook
 *
 * 取得當前用戶收藏（按讚）的文章列表
 * 對應後端 GET /posts/liked
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface BookmarkedPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image: string | null
  category: string | null
  status: string
  published_at: string | null
  created_at: string
  tags?: string[]
  username?: string
  display_name?: string
  author_avatar?: string
  content?: string | null
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  total_pages: number
}

/**
 * 取得用戶收藏的文章列表
 */
export function useBookmarks(page = 1, limit = 50) {
  return useQuery<{ posts: BookmarkedPost[]; pagination: PaginationInfo }>({
    queryKey: ['bookmarks', page, limit],
    queryFn: async () => {
      const response = await apiClient.get('/posts/liked', {
        params: { page, limit },
      })
      const data = response.data?.data ?? response.data
      return {
        posts: data?.data ?? data ?? [],
        pagination: data?.pagination ?? { page, limit, total: 0, total_pages: 0 },
      }
    },
  })
}

/**
 * 從收藏列表移除文章
 *
 * Web 目前使用 /posts/:id/like 來移除 /posts/liked 列表中的項目，mobile 先保持一致。
 */
export function useRemoveBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiClient.post(`/posts/${postId}/like`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}
