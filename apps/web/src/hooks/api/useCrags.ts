/**
 * 岩場相關 TanStack Query Hooks
 */

import { useQuery } from '@tanstack/react-query'
import { cragService } from '@/lib/api/services'
import {
  adaptCragToListItem,
  adaptCragToDetail,
  adaptRouteToSidebarItem,
  adaptRouteToDetail,
  adaptAreaToListItem,
  type AdaptedCragDetail,
  type AdaptedRouteDetail,
} from '@/lib/adapters/crag-adapter'
import type { CragListItem, RouteSidebarItem } from '@/lib/crag-data'

// 快取時間常數
const STALE_TIME = 5 * 60 * 1000 // 5 分鐘
const GC_TIME = 30 * 60 * 1000 // 30 分鐘

/**
 * 獲取岩場列表
 */
export function useCrags(options?: {
  page?: number
  limit?: number
  region?: string
  featured?: boolean
}) {
  const { page = 1, limit = 50, region, featured } = options || {}

  return useQuery({
    queryKey: ['crags', { page, limit, region, featured }],
    queryFn: async (): Promise<{
      crags: CragListItem[]
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }> => {
      const response = await cragService.getCrags(page, limit, {
        region,
        featured: featured ? 'true' : undefined,
      } as { difficulty?: string; type?: string })

      const apiCrags = response.data || []
      const pagination = response.pagination

      return {
        crags: apiCrags.map(adaptCragToListItem),
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
 * 獲取精選岩場
 */
export function useFeaturedCrags(limit?: number) {
  return useQuery({
    queryKey: ['crags', 'featured', limit],
    queryFn: async (): Promise<CragListItem[]> => {
      const response = await cragService.getFeaturedCrags()
      const apiCrags = response.data || []
      return apiCrags.map(adaptCragToListItem)
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取岩場詳情
 */
export function useCragDetail(id: string) {
  return useQuery({
    queryKey: ['crag', id],
    queryFn: async (): Promise<AdaptedCragDetail | null> => {
      // 同時獲取岩場資料和區域資料
      const [cragResponse, areasResponse] = await Promise.all([
        cragService.getCragById(id),
        cragService.getCragAreas(id),
      ])

      const apiCrag = cragResponse.data
      if (!apiCrag) return null

      const apiAreas = areasResponse.data || []
      return adaptCragToDetail(apiCrag, apiAreas)
    },
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取岩場詳情（通過 Slug）
 */
export function useCragDetailBySlug(slug: string) {
  return useQuery({
    queryKey: ['crag', 'slug', slug],
    queryFn: async (): Promise<AdaptedCragDetail | null> => {
      const response = await cragService.getCragBySlug(slug)
      const apiCrag = response.data
      if (!apiCrag) return null

      const areasResponse = await cragService.getCragAreas(apiCrag.id)
      const apiAreas = areasResponse.data || []

      return adaptCragToDetail(apiCrag, apiAreas)
    },
    enabled: !!slug,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取岩場路線列表
 */
export function useCragRoutes(cragId: string) {
  return useQuery({
    queryKey: ['crag', cragId, 'routes'],
    queryFn: async (): Promise<RouteSidebarItem[]> => {
      const response = await cragService.getCragRoutes(cragId)
      const apiRoutes = response.data || []

      // 建立區域名稱映射（需要另外獲取區域資料）
      // 暫時使用空映射
      const areaMap = new Map<string, string>()

      return apiRoutes.map(route => adaptRouteToSidebarItem(route, areaMap))
    },
    enabled: !!cragId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取岩場區域列表（用於篩選）
 */
export function useCragAreas(cragId: string) {
  return useQuery({
    queryKey: ['crag', cragId, 'areas'],
    queryFn: async (): Promise<Array<{ id: string; name: string }>> => {
      const response = await cragService.getCragAreas(cragId)
      const apiAreas = response.data || []
      return apiAreas.map(adaptAreaToListItem)
    },
    enabled: !!cragId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取路線詳情
 */
export function useRouteDetail(cragId: string, routeId: string) {
  return useQuery({
    queryKey: ['crag', cragId, 'route', routeId],
    queryFn: async (): Promise<{
      route: AdaptedRouteDetail
      crag: { id: string; name: string; slug: string }
      area: { id: string; name: string } | null
    } | null> => {
      // 獲取路線資料
      const routesResponse = await cragService.getCragRoutes(cragId)
      const apiRoutes = routesResponse.data || []
      const apiRoute = apiRoutes.find(r => r.id === routeId)

      if (!apiRoute) return null

      // 獲取岩場資料
      const cragResponse = await cragService.getCragById(cragId)
      const apiCrag = cragResponse.data

      if (!apiCrag) return null

      return {
        route: adaptRouteToDetail(apiRoute),
        crag: {
          id: apiCrag.id,
          name: apiCrag.name,
          slug: apiCrag.slug,
        },
        area: apiRoute.area_id ? { id: apiRoute.area_id, name: '' } : null,
      }
    },
    enabled: !!cragId && !!routeId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}
