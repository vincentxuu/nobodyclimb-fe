/**
 * useBucketList Hook
 *
 * 取得當前用戶的人生清單
 * 對應後端 GET /bucket-list/:biographyId
 *
 * 流程：先取得 /biographies/me 拿到 biography ID，再用它取得人生清單
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface BucketListItem {
  id: string
  biography_id: string
  title: string
  category: string
  description: string | null
  target_grade: string | null
  target_location: string | null
  target_date: string | null
  status: 'active' | 'completed' | 'archived'
  completed_at: string | null
  progress: number
  is_public: boolean
  likes_count: number
  sort_order: number
  created_at: string
  updated_at: string
}

/**
 * 取得我的人物誌
 */
function useMyBiography() {
  return useQuery<{ id: string } | null>({
    queryKey: ['my-biography'],
    queryFn: async () => {
      const response = await apiClient.get('/biographies/me')
      const data = response.data?.data ?? response.data
      return data ?? null
    },
  })
}

/**
 * 取得我的人生清單
 */
export function useBucketList() {
  const { data: biography, isLoading: isBiographyLoading } = useMyBiography()

  const query = useQuery<BucketListItem[]>({
    queryKey: ['bucket-list', biography?.id],
    queryFn: async () => {
      const response = await apiClient.get(`/bucket-list/${biography!.id}`)
      const data = response.data?.data ?? response.data
      return Array.isArray(data) ? data : []
    },
    enabled: !!biography?.id,
  })

  return {
    ...query,
    isLoading: isBiographyLoading || query.isLoading,
    biographyId: biography?.id,
  }
}

/**
 * 切換完成/未完成狀態
 */
export function useToggleBucketItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      if (completed) {
        // 標記完成
        const response = await apiClient.put(`/bucket-list/${id}/complete`, {})
        return response.data
      } else {
        // 更新回 active 狀態
        const response = await apiClient.put(`/bucket-list/${id}`, { status: 'active' })
        return response.data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket-list'] })
    },
  })
}

/**
 * 刪除人生清單項目
 */
export function useDeleteBucketItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/bucket-list/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucket-list'] })
    },
  })
}
