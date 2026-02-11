/**
 * 岩館相關 TanStack Query Hooks
 */

import { useQuery } from '@tanstack/react-query'
import { gymService } from '@/lib/api/services'
import {
  adaptGymToListItem,
  adaptGymToDetail,
  filterGyms,
  getRelatedGymsFromList,
  getAdjacentGymsFromList,
} from '@/lib/adapters/gym-adapter'
import type { GymListItem, GymDetailData } from '@/lib/gym-data'

// 快取時間常數
const STALE_TIME = 5 * 60 * 1000 // 5 分鐘
const GC_TIME = 30 * 60 * 1000 // 30 分鐘

/**
 * 獲取岩館列表
 */
export function useGyms(options?: {
  page?: number
  limit?: number
  city?: string
  search?: string
  featured?: boolean
}) {
  const { page = 1, limit = 100, city, search, featured } = options || {}

  return useQuery({
    queryKey: ['gyms', { page, limit, city, search, featured }],
    queryFn: async (): Promise<{
      gyms: GymListItem[]
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }> => {
      const response = await gymService.getGyms(page, limit, search ? [search] : undefined)
      const apiGyms = response.data || []
      const pagination = response.pagination

      return {
        gyms: apiGyms.map(adaptGymToListItem),
        pagination: {
          page: pagination?.page || 1,
          limit: pagination?.limit || limit,
          total: pagination?.total || 0,
          totalPages: pagination?.total_pages || 1,
        },
      }
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取精選岩館
 */
export function useFeaturedGyms() {
  return useQuery({
    queryKey: ['gyms', 'featured'],
    queryFn: async (): Promise<GymListItem[]> => {
      const response = await gymService.getFeaturedGyms()
      const apiGyms = response.data || []
      return apiGyms.map(adaptGymToListItem)
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取岩館詳情
 */
export function useGymDetail(id: string) {
  return useQuery({
    queryKey: ['gym', id],
    queryFn: async (): Promise<GymDetailData | null> => {
      const response = await gymService.getGymById(id)
      const apiGym = response.data
      if (!apiGym) return null
      return adaptGymToDetail(apiGym)
    },
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取岩館詳情（通過 Slug）
 */
export function useGymDetailBySlug(slug: string) {
  return useQuery({
    queryKey: ['gym', 'slug', slug],
    queryFn: async (): Promise<GymDetailData | null> => {
      const response = await gymService.getGymBySlug(slug)
      const apiGym = response.data
      if (!apiGym) return null
      return adaptGymToDetail(apiGym)
    },
    enabled: !!slug,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取相關岩館（同地區）
 */
export function useRelatedGyms(currentGymId: string, limit: number = 3) {
  const { data: allGymsData } = useGyms({ limit: 100 })

  return useQuery({
    queryKey: ['gyms', 'related', currentGymId, limit],
    queryFn: async (): Promise<GymListItem[]> => {
      if (!allGymsData?.gyms) return []
      return getRelatedGymsFromList(allGymsData.gyms, currentGymId, limit)
    },
    enabled: !!currentGymId && !!allGymsData?.gyms,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取相鄰岩館（上一個/下一個）
 */
export function useAdjacentGyms(currentGymId: string) {
  const { data: allGymsData } = useGyms({ limit: 100 })

  return useQuery({
    queryKey: ['gyms', 'adjacent', currentGymId],
    queryFn: async (): Promise<{ prev: GymListItem | null; next: GymListItem | null }> => {
      if (!allGymsData?.gyms) return { prev: null, next: null }
      return getAdjacentGymsFromList(allGymsData.gyms, currentGymId)
    },
    enabled: !!currentGymId && !!allGymsData?.gyms,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 搜尋岩館（客戶端過濾）
 */
export function useSearchGyms(options: {
  query?: string
  region?: string
  type?: string
  city?: string
}) {
  const { data: allGymsData, isLoading, error } = useGyms({ limit: 100 })

  const filteredGyms = allGymsData?.gyms
    ? filterGyms(allGymsData.gyms, options)
    : []

  return {
    data: filteredGyms,
    isLoading,
    error,
  }
}
