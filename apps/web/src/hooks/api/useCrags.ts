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
  adaptApiAreaToFullArea,
  adaptApiRouteToCragRoute,
  type AdaptedCragDetail,
  type AdaptedRouteDetail,
} from '@/lib/adapters/crag-adapter'
import type { CragListItem, CragArea, CragRoute, RouteSidebarItem, RouteSearchItem } from '@/lib/crag-data'

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
 * 獲取岩場路線列表（側邊欄用輕量格式，包含區域名稱）
 */
export function useCragRoutes(cragId: string) {
  return useQuery({
    queryKey: ['crag', cragId, 'routes'],
    queryFn: async (): Promise<RouteSidebarItem[]> => {
      // 同時獲取路線和區域資料，以建立區域名稱映射
      const [routesResponse, areasResponse] = await Promise.all([
        cragService.getCragRoutes(cragId),
        cragService.getCragAreas(cragId),
      ])

      const apiRoutes = routesResponse.data || []
      const apiAreas = areasResponse.data || []
      const areaMap = new Map(apiAreas.map(a => [a.id, a.name]))

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
 * 獲取岩場完整區域資料（含 routesCount、boltCount 等）
 */
export function useCragFullAreas(cragId: string) {
  return useQuery({
    queryKey: ['crag', cragId, 'full-areas'],
    queryFn: async (): Promise<CragArea[]> => {
      const response = await cragService.getCragAreas(cragId)
      return (response.data || []).map(adaptApiAreaToFullArea)
    },
    enabled: !!cragId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取岩場完整路線資料（CragRoute 格式，含所有欄位）
 */
export function useCragFullRoutes(cragId: string) {
  return useQuery({
    queryKey: ['crag', cragId, 'full-routes'],
    queryFn: async (): Promise<CragRoute[]> => {
      const response = await cragService.getCragRoutes(cragId)
      return (response.data || []).map(adaptApiRouteToCragRoute)
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

/**
 * 獲取所有岩場的所有路線（用於全域搜尋）
 * 注意：此 hook 會對每個岩場發送 API 請求，適合在按需載入的場景使用
 */
export function useAllCragsRoutes() {
  return useQuery({
    queryKey: ['all-crags-routes'],
    queryFn: async (): Promise<RouteSearchItem[]> => {
      // 1. 取得所有岩場
      const cragsRes = await cragService.getCrags(1, 100)
      const apiCrags = cragsRes.data || []

      // 2. 對每個岩場並行取得路線和區域資料
      const allItems: RouteSearchItem[] = []
      await Promise.all(
        apiCrags.map(async (crag) => {
          const [routesRes, areasRes] = await Promise.all([
            cragService.getCragRoutes(crag.id),
            cragService.getCragAreas(crag.id),
          ])
          const areaMap = new Map((areasRes.data || []).map(a => [a.id, a.name]))
          const routes = (routesRes.data || []).map(adaptApiRouteToCragRoute)
          routes.forEach(route => {
            allItems.push({
              route,
              cragId: crag.id,
              cragName: crag.name,
              areaName: areaMap.get(route.areaId) || '',
            })
          })
        })
      )

      return allItems
    },
    staleTime: 10 * 60 * 1000, // 10 分鐘
    gcTime: GC_TIME,
  })
}
