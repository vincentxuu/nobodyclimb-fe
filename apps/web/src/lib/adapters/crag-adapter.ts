/**
 * 岩場型別適配器
 * 將後端 API 回應轉換為前端使用的格式
 */

import type { ApiCrag, ApiArea, ApiRoute } from '@/lib/types/api-crag'
import type { CragListItem, CragDetailData, CragArea, RouteSidebarItem } from '@/lib/crag-data'

// 岩場備用圖片（當實際圖片不存在時使用）
const CRAG_FALLBACK_IMAGE = '/photo/climbspot-photo.jpeg'

/**
 * 將 API 岩場資料轉換為列表項目格式
 */
export function adaptCragToListItem(apiCrag: ApiCrag): CragListItem {
  return {
    id: apiCrag.id,
    name: apiCrag.name,
    nameEn: '', // 後端目前沒有英文名稱欄位
    image: apiCrag.cover_image || (apiCrag.images?.[0]) || CRAG_FALLBACK_IMAGE,
    location: apiCrag.location || apiCrag.region || '',
    type: apiCrag.rock_type || '',
    rockType: apiCrag.rock_type || '',
    routes: apiCrag.route_count,
    difficulty: apiCrag.difficulty_range || '',
    seasons: apiCrag.best_seasons || [],
  }
}

/**
 * 岩場詳情資料格式（適用於詳情頁）
 */
export interface AdaptedCragDetail {
  id: string
  name: string
  englishName: string
  slug: string
  description: string
  location: string
  region: string
  type: string
  rockType: string
  routes: number
  difficulty: string
  height: string
  approach: string
  parking: string
  amenities: string[]
  geoCoordinates: {
    latitude: number
    longitude: number
  } | null
  googleMapsUrl: string | null
  transportation: Array<{
    type: string
    description: string
  }>
  weatherLocation: string
  liveVideoId?: string
  liveVideoTitle?: string
  liveVideoDescription?: string
  areas: CragArea[]
  metadata?: {
    source: string
    sourceUrl?: string
    lastUpdated?: string
    maintainer: string
    maintainerUrl?: string
    version?: string
  }
}

/**
 * 將 API 岩場資料轉換為詳情頁格式
 */
export function adaptCragToDetail(apiCrag: ApiCrag, areas?: ApiArea[]): AdaptedCragDetail {
  const geoCoordinates = apiCrag.latitude && apiCrag.longitude
    ? { latitude: apiCrag.latitude, longitude: apiCrag.longitude }
    : null

  // 優先使用資料庫中的 google_maps_url，否則根據座標生成
  const googleMapsUrl = apiCrag.google_maps_url || (geoCoordinates
    ? `https://www.google.com/maps?q=${geoCoordinates.latitude},${geoCoordinates.longitude}`
    : null)

  // 使用資料庫中的 transportation，如果沒有則用 access_info 作為 fallback
  let transportation: Array<{ type: string; description: string }> = apiCrag.transportation || []
  if (transportation.length === 0 && apiCrag.access_info) {
    transportation = [{ type: '步行', description: apiCrag.access_info }]
  }

  // 轉換區域資料
  const adaptedAreas: CragArea[] = (areas || []).map(area => ({
    id: area.id,
    name: area.name,
    nameEn: area.name_en || '',
    description: area.description || undefined,
    descriptionEn: area.description_en || undefined,
    difficulty: undefined, // 後端區域沒有難度範圍
    image: area.image || undefined,
    boltCount: area.bolt_count,
    routesCount: area.route_count,
    sectors: [], // sectors 需要另外查詢
  }))

  return {
    id: apiCrag.id,
    name: apiCrag.name,
    englishName: '', // 後端目前沒有英文名稱欄位
    slug: apiCrag.slug,
    description: apiCrag.description || '',
    location: apiCrag.location || '',
    region: apiCrag.region || '',
    type: apiCrag.climbing_types?.join(', ') || '',
    rockType: apiCrag.rock_type || '',
    routes: apiCrag.route_count,
    difficulty: apiCrag.difficulty_range || '',
    height: apiCrag.height_min && apiCrag.height_max
      ? `${apiCrag.height_min}-${apiCrag.height_max}m`
      : apiCrag.height_max
        ? `${apiCrag.height_max}m`
        : '',
    approach: apiCrag.approach_time ? `${apiCrag.approach_time} 分鐘` : '',
    parking: apiCrag.parking_info || '',
    amenities: apiCrag.amenities || [],
    geoCoordinates,
    googleMapsUrl,
    transportation,
    weatherLocation: apiCrag.location || apiCrag.region || '',
    liveVideoId: apiCrag.live_video_id || undefined,
    liveVideoTitle: apiCrag.live_video_title || undefined,
    liveVideoDescription: apiCrag.live_video_description || undefined,
    areas: adaptedAreas,
    metadata: {
      source: apiCrag.metadata_source || '資料庫',
      sourceUrl: apiCrag.metadata_source_url || undefined,
      lastUpdated: apiCrag.updated_at,
      maintainer: apiCrag.metadata_maintainer || 'NobodyClimb 社群',
      maintainerUrl: apiCrag.metadata_maintainer_url || undefined,
    },
  }
}

/**
 * 將 API 區域資料轉換為前端格式
 */
export function adaptAreaToListItem(apiArea: ApiArea): { id: string; name: string } {
  return {
    id: apiArea.id,
    name: apiArea.name,
  }
}

/**
 * 將 API 路線資料轉換為側邊欄格式
 */
export function adaptRouteToSidebarItem(
  apiRoute: ApiRoute,
  areaMap: Map<string, string>
): RouteSidebarItem {
  return {
    id: apiRoute.id,
    name: apiRoute.name,
    grade: apiRoute.grade,
    type: apiRoute.route_type,
    areaId: apiRoute.area_id || '',
    areaName: apiRoute.area_id ? (areaMap.get(apiRoute.area_id) || '') : '',
    sector: apiRoute.sector_id || undefined,
    sectorEn: undefined,
  }
}

/**
 * 路線詳情資料格式
 */
export interface AdaptedRouteDetail {
  id: string
  name: string
  englishName: string
  grade: string
  length: string
  type: string
  typeEn: string
  firstAscent: string
  firstAscentDate: string
  description: string
  protection: string
  tips: string
  boltCount: number
  safetyRating: string
  popularity: number
  views: number
  images: string[]
  videos: string[]
  youtubeVideos: string[]
  instagramPosts: string[]
  sector: string
}

/**
 * 將 API 路線資料轉換為詳情格式
 */
export function adaptRouteToDetail(apiRoute: ApiRoute): AdaptedRouteDetail {
  const parseJsonArray = (str: string | null): string[] => {
    if (!str) return []
    try {
      return JSON.parse(str)
    } catch {
      return []
    }
  }

  return {
    id: apiRoute.id,
    name: apiRoute.name,
    englishName: apiRoute.name_en || '',
    grade: apiRoute.grade,
    length: apiRoute.height || '',  // 後端使用 height 欄位
    type: apiRoute.route_type,
    typeEn: apiRoute.route_type, // 後端型別已經是英文
    firstAscent: apiRoute.first_ascent || '',
    firstAscentDate: apiRoute.first_ascent_date || '',
    description: apiRoute.description || '',
    protection: apiRoute.protection || '',
    tips: apiRoute.tips || '',
    boltCount: apiRoute.bolt_count,
    safetyRating: apiRoute.safety_rating || '',
    popularity: apiRoute.popularity || 0,
    views: apiRoute.view_count || 0,
    images: parseJsonArray(apiRoute.images ?? null),
    videos: parseJsonArray(apiRoute.videos ?? null),
    youtubeVideos: parseJsonArray(apiRoute.youtube_videos ?? null),
    instagramPosts: parseJsonArray(apiRoute.instagram_posts ?? null),
    sector: apiRoute.sector_id || '',
  }
}
