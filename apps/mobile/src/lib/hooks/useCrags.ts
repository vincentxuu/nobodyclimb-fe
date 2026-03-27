/**
 * 岩場相關 TanStack Query Hooks
 *
 * 對應 apps/web/src/hooks/api/useCrags.ts
 * 使用 API 取得真實資料，取代靜態 mock data
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  CragListItem,
  CragDetailData,
  RouteSidebarItem,
  RouteDetailData,
  CragArea,
} from '@/lib/crag-data'

const STALE_TIME = 5 * 60 * 1000 // 5 分鐘
const GC_TIME = 30 * 60 * 1000 // 30 分鐘

/**
 * 從 API 回應中提取資料
 */
function extractData<T>(response: any): T {
  return response.data?.data ?? response.data
}

/**
 * 將 API 岩場資料轉為 CragListItem
 */
function adaptCragToListItem(apiCrag: any): CragListItem {
  return {
    id: apiCrag.id,
    name: apiCrag.name,
    nameEn: apiCrag.name_en || apiCrag.nameEn || '',
    image: apiCrag.cover_image || apiCrag.coverImage || '',
    location: apiCrag.location?.address || apiCrag.location || '',
    type: apiCrag.type || '',
    rockType: apiCrag.rock_type || apiCrag.rockType || '',
    routes: apiCrag.routes_count || apiCrag.routesCount || 0,
    difficulty: apiCrag.difficulty
      ? typeof apiCrag.difficulty === 'object'
        ? `${apiCrag.difficulty.min} - ${apiCrag.difficulty.max}`
        : apiCrag.difficulty
      : '',
    seasons: apiCrag.seasons || [],
  }
}

/**
 * 將 API 岩場詳情轉為 CragDetailData
 */
function adaptCragToDetail(apiCrag: any, apiAreas: any[]): CragDetailData {
  const location = apiCrag.location || {}
  const access = apiCrag.access || {}
  const difficulty = apiCrag.difficulty || {}
  const height = apiCrag.height || {}

  return {
    id: apiCrag.id,
    name: apiCrag.name,
    englishName: apiCrag.name_en || apiCrag.nameEn || '',
    location: location.address || (typeof apiCrag.location === 'string' ? apiCrag.location : ''),
    description: apiCrag.description || '',
    videoUrl: apiCrag.video_url || apiCrag.videoUrl || '',
    liveVideoId: apiCrag.live_video_id || apiCrag.liveVideoId,
    liveVideoTitle: apiCrag.live_video_title || apiCrag.liveVideoTitle,
    liveVideoDescription: apiCrag.live_video_description || apiCrag.liveVideoDescription,
    images: apiCrag.images || [],
    type: apiCrag.type || '',
    rockType: apiCrag.rock_type || apiCrag.rockType || '',
    routes: apiCrag.routes_count || apiCrag.routesCount || 0,
    difficulty: typeof difficulty === 'object'
      ? `${difficulty.min || ''} - ${difficulty.max || ''}`
      : difficulty || '',
    height: typeof height === 'object'
      ? `${height.min || ''}-${height.max || ''}${height.unit || 'm'}`
      : height || '',
    approach: access.approach || apiCrag.approach || '',
    seasons: apiCrag.seasons || [],
    transportation: access.transportation || apiCrag.transportation || [],
    parking: access.parking || apiCrag.parking || '',
    amenities: apiCrag.amenities || [],
    googleMapsUrl: location.googleMapsUrl || location.google_maps_url || apiCrag.googleMapsUrl || '',
    geoCoordinates: (apiCrag.latitude && apiCrag.longitude)
      ? { latitude: apiCrag.latitude, longitude: apiCrag.longitude }
      : apiCrag.geoCoordinates || apiCrag.geo_coordinates || null,
    weatherLocation: apiCrag.weather_location || apiCrag.weatherLocation || '',
    areas: apiAreas.map((area: any) => ({
      id: area.id,
      name: area.name,
      description: area.description || '',
      difficulty: area.difficulty
        ? typeof area.difficulty === 'object'
          ? `${area.difficulty.min || ''} - ${area.difficulty.max || ''}`
          : area.difficulty
        : '',
      routes: area.route_count || area.routes_count || area.routesCount || 0,
      image: area.image || '',
    })),
    routes_details: [],
    metadata: apiCrag.metadata || null,
  }
}

/**
 * 將 API 路線資料轉為 RouteSidebarItem
 */
function adaptRouteToSidebarItem(route: any, areaMap: Map<string, string>): RouteSidebarItem {
  return {
    id: route.id,
    name: route.name,
    grade: route.grade || '',
    type: route.type || '',
    areaId: route.area_id || route.areaId || '',
    areaName: areaMap.get(route.area_id || route.areaId || '') || '',
    sector: route.sector,
    sectorEn: route.sector_en || route.sectorEn,
  }
}

/**
 * 獲取岩場列表
 */
export function useCrags(options?: { page?: number; limit?: number }) {
  const { page = 1, limit = 50 } = options || {}

  return useQuery({
    queryKey: ['crags', { page, limit }],
    queryFn: async (): Promise<CragListItem[]> => {
      const response = await apiClient.get('/crags', { params: { page, limit } })
      const apiCrags = extractData<any[]>(response) || []
      return apiCrags.map(adaptCragToListItem)
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取岩場詳情（含區域資料）
 */
export function useCragDetail(id: string) {
  return useQuery({
    queryKey: ['crag', id],
    queryFn: async (): Promise<CragDetailData | null> => {
      const [cragResponse, areasResponse] = await Promise.all([
        apiClient.get(`/crags/${id}`),
        apiClient.get(`/crags/${id}/areas`),
      ])

      const apiCrag = extractData<any>(cragResponse)
      if (!apiCrag) return null

      const apiAreas = extractData<any[]>(areasResponse) || []
      return adaptCragToDetail(apiCrag, apiAreas)
    },
    enabled: !!id,
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
      const [routesResponse, areasResponse] = await Promise.all([
        apiClient.get(`/crags/${cragId}/routes`),
        apiClient.get(`/crags/${cragId}/areas`),
      ])

      const apiRoutes = extractData<any[]>(routesResponse) || []
      const apiAreas = extractData<any[]>(areasResponse) || []
      const areaMap = new Map(apiAreas.map((a: any) => [a.id, a.name]))

      return apiRoutes.map((route: any) => adaptRouteToSidebarItem(route, areaMap))
    },
    enabled: !!cragId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取岩場區域列表
 */
export function useCragAreas(cragId: string) {
  return useQuery({
    queryKey: ['crag', cragId, 'areas'],
    queryFn: async (): Promise<Array<{ id: string; name: string; description?: string; difficulty?: string; routes?: number }>> => {
      const response = await apiClient.get(`/crags/${cragId}/areas`)
      const apiAreas = extractData<any[]>(response) || []
      return apiAreas.map((area: any) => ({
        id: area.id,
        name: area.name,
        description: area.description || '',
        difficulty: area.difficulty
          ? typeof area.difficulty === 'object'
            ? `${area.difficulty.min || ''} - ${area.difficulty.max || ''}`
            : area.difficulty
          : '',
        routes: area.route_count || area.routes_count || area.routesCount || 0,
      }))
    },
    enabled: !!cragId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取路線詳情
 */
/**
 * 獲取路線詳情
 * 使用單一路線 API: GET /crags/:cragId/routes/:routeId
 */
export function useRouteDetail(cragId: string, routeId: string) {
  return useQuery({
    queryKey: ['crag', cragId, 'route', routeId],
    queryFn: async (): Promise<RouteDetailData | null> => {
      const [routeResponse, cragResponse, areasResponse, routesResponse] = await Promise.all([
        apiClient.get(`/crags/${cragId}/routes/${routeId}`),
        apiClient.get(`/crags/${cragId}`),
        apiClient.get(`/crags/${cragId}/areas`),
        apiClient.get(`/crags/${cragId}/routes`),
      ])

      const apiRoute = extractData<any>(routeResponse)
      if (!apiRoute) return null

      const apiCrag = extractData<any>(cragResponse)
      if (!apiCrag) return null

      const apiAreas = extractData<any[]>(areasResponse) || []
      const area = apiRoute.area_id
        ? apiAreas.find((a: any) => a.id === apiRoute.area_id)
        : null

      // 找同區域的其他路線作為相關路線
      const apiRoutes = extractData<any[]>(routesResponse) || []
      const relatedRoutes = apiRoutes
        .filter((r: any) => r.id !== routeId && r.area_id === apiRoute.area_id)
        .slice(0, 5)
        .map((r: any) => ({
          id: r.id,
          name: r.name,
          grade: r.grade || '',
          type: r.route_type || r.type || '',
        }))

      // 解析 JSON 字串欄位（D1 回傳的可能是 JSON string）
      const parseJsonField = (field: any): any[] => {
        if (Array.isArray(field)) return field
        if (typeof field === 'string') {
          try { return JSON.parse(field) } catch { return [] }
        }
        return []
      }

      return {
        route: {
          id: apiRoute.id,
          name: apiRoute.name,
          englishName: apiRoute.name_en || apiRoute.nameEn || '',
          grade: apiRoute.grade || '',
          length: apiRoute.height ? `${apiRoute.height}m` : '',
          type: apiRoute.route_type || apiRoute.type || '',
          typeEn: apiRoute.type_en || apiRoute.typeEn || apiRoute.route_type || '',
          firstAscent: apiRoute.first_ascent || apiRoute.firstAscent || '',
          firstAscentDate: apiRoute.first_ascent_date || apiRoute.firstAscentDate || '',
          description: apiRoute.description || '',
          protection: apiRoute.protection || '',
          tips: apiRoute.tips || '',
          boltCount: apiRoute.bolt_count || apiRoute.boltCount || 0,
          safetyRating: apiRoute.safety_rating || apiRoute.safetyRating || '',
          popularity: apiRoute.popularity || 0,
          views: apiRoute.view_count || apiRoute.views || 0,
          images: parseJsonField(apiRoute.images),
          videos: apiRoute.videos || [],
          youtubeVideos: parseJsonField(apiRoute.youtube_videos || apiRoute.youtubeVideos),
          instagramPosts: parseJsonField(apiRoute.instagram_posts || apiRoute.instagramPosts),
        },
        crag: {
          id: apiCrag.id,
          name: apiCrag.name,
          nameEn: apiCrag.name_en || apiCrag.nameEn || '',
          slug: apiCrag.slug || apiCrag.id,
          location: apiCrag.location?.address || (typeof apiCrag.location === 'string' ? apiCrag.location : ''),
        },
        area: area
          ? {
              id: area.id,
              name: area.name,
              nameEn: area.name_en || area.nameEn || '',
            }
          : null,
        relatedRoutes,
      }
    },
    enabled: !!cragId && !!routeId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}
