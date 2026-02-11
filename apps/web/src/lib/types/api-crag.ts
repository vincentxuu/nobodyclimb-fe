/**
 * API 岩場回應型別
 * 定義後端 API 回傳的 snake_case 扁平結構
 */

/**
 * 後端岩場資料（D1 資料庫格式 + JSON parse 後的欄位）
 */
export interface ApiCrag {
  id: string
  name: string
  slug: string
  description: string | null
  location: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
  altitude: number | null
  rock_type: string | null
  climbing_types: string[]
  difficulty_range: string | null
  route_count: number
  bolt_count: number
  cover_image: string | null
  images: string[]
  is_featured: number
  access_info: string | null
  parking_info: string | null
  approach_time: number | null
  best_seasons: string[]
  restrictions: string | null
  rating_avg: number
  review_count: number
  created_at: string
  updated_at: string
  // 新增欄位
  metadata_source: string | null
  metadata_source_url: string | null
  metadata_maintainer: string | null
  metadata_maintainer_url: string | null
  live_video_id: string | null
  live_video_title: string | null
  live_video_description: string | null
  transportation: Array<{ type: string; description: string }>
  amenities: string[]
  google_maps_url: string | null
  // 岩壁高度
  height_min: number | null
  height_max: number | null
}

/**
 * 後端區域資料
 */
export interface ApiArea {
  id: string
  crag_id: string
  name: string
  name_en: string | null
  slug: string | null
  description: string | null
  description_en: string | null
  image: string | null
  bolt_count: number
  route_count: number
  sort_order: number
  created_at: string
  updated_at: string
}

/**
 * 後端 Sector 資料
 */
export interface ApiSector {
  id: string
  area_id: string
  name: string
  name_en: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

/**
 * 後端路線資料
 */
export interface ApiRoute {
  id: string
  crag_id: string
  area_id: string | null
  sector_id: string | null
  name: string
  name_en?: string | null
  alternative_names?: string | null
  grade: string
  grade_system?: string
  route_type: string  // 'sport', 'trad', 'boulder', etc.
  height?: string | null  // e.g. "10m"
  bolt_count: number
  anchor_type?: string | null
  first_ascent: string | null
  first_ascent_date?: string | null
  description: string | null
  description_en?: string | null
  protection?: string | null
  tips?: string | null
  safety_rating?: string | null
  popularity?: number
  view_count?: number
  status?: string
  images?: string | null
  videos?: string | null
  youtube_videos?: string | null
  instagram_posts?: string | null
  ascent_count?: number
  story_count?: number
  community_rating_avg?: number
  community_rating_count?: number
  created_at: string
  updated_at?: string
}

/**
 * 岩場列表 API 回應
 */
export interface ApiCragListResponse {
  success: boolean
  data: ApiCrag[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

/**
 * 岩場詳情 API 回應
 */
export interface ApiCragDetailResponse {
  success: boolean
  data: ApiCrag
}

/**
 * 岩場路線列表 API 回應
 */
export interface ApiCragRoutesResponse {
  success: boolean
  data: ApiRoute[]
}

/**
 * 岩場區域列表 API 回應
 */
export interface ApiCragAreasResponse {
  success: boolean
  data: ApiArea[]
}
