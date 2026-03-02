/**
 * 岩場資料服務層 (Mobile 版)
 *
 * 對應 apps/web/src/lib/crag-data.ts
 * Mobile 版通過 API 獲取資料，而非直接讀取 JSON 文件
 */

import { apiClient } from './api'

// ============ 類型定義 ============

export interface CragLocation {
  address: string
  addressEn: string
  region: string
  regionEn: string
  latitude: number
  longitude: number
  googleMapsUrl: string
}

export interface CragAccess {
  approach: string
  approachEn: string
  parking: string
  parkingEn: string
  transportation: Array<{
    type: string
    description: string
    descriptionEn: string
  }>
}

export interface CragDifficulty {
  min: string
  max: string
}

export interface CragHeight {
  min: number
  max: number
  unit: string
}

export interface CragData {
  id: string
  slug: string
  name: string
  nameEn: string
  location: CragLocation
  description: string
  descriptionEn: string
  videoUrl?: string
  liveVideoId?: string
  liveVideoTitle?: string
  liveVideoDescription?: string
  images?: string[]
  type: string
  rockType: string
  rockTypeEn: string
  routesCount: number
  difficulty: CragDifficulty
  height: CragHeight
  seasons: string[]
  seasonsEn: string[]
  access: CragAccess
  amenities: string[]
  amenitiesEn: string[]
  featured: boolean
  rating: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface CragSector {
  id?: string
  name: string
  nameEn: string
}

export interface CragArea {
  id: string
  name: string
  nameEn: string
  description?: string
  descriptionEn?: string
  difficulty?: CragDifficulty
  image?: string
  boltCount: number
  routesCount: number
  sectors?: CragSector[]
}

export interface CragRoute {
  id: string
  areaId: string
  sector?: string
  sectorEn?: string
  name: string
  nameEn: string
  alternativeNames?: string[]
  grade: string
  type: string
  typeEn: string
  length?: string
  firstAscent?: string
  firstAscentEn?: string
  firstAscentDate?: string
  description?: string
  descriptionEn?: string
  protection?: string
  protectionEn?: string
  tips?: string
  tipsEn?: string
  safetyRating?: string
  boltCount: number
  boltType?: string
  anchorType?: string
  popularity?: number
  views?: number
  images?: string[]
  videos?: string[]
  instagramPosts?: string[]
  youtubeVideos?: string[]
  status: string
  lastVerified?: string
  lastUpdated?: string
}

export interface CragStatistics {
  totalRoutes: number
  totalBolts: number
  routesByType: Record<string, number>
  routesByGrade: Record<string, number>
  boltsByMaterial: Record<string, number>
}

export interface CragFullData {
  crag: CragData
  areas: CragArea[]
  routes: CragRoute[]
  statistics: CragStatistics
  metadata: {
    version: string
    source: string
    sourceUrl?: string
    lastUpdated: string
    maintainer: string
    maintainerUrl?: string
  }
}

// ============ 列表頁用的簡化資料格式 ============

export interface CragListItem {
  id: string
  name: string
  nameEn: string
  image: string
  location: string
  type: string
  rockType: string
  routes: number
  difficulty: string
  seasons: string[]
}

// ============ 側邊欄用的輕量路線資料格式 ============

export interface RouteSidebarItem {
  id: string
  name: string
  grade: string
  type: string
  areaId: string
  areaName: string
  sector?: string
  sectorEn?: string
}

// ============ 路線詳情頁所需的完整資料格式 ============

export interface RouteDetailData {
  route: {
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
  }
  crag: {
    id: string
    name: string
    nameEn: string
    slug: string
    location: string
  }
  area: {
    id: string
    name: string
    nameEn: string
  } | null
  relatedRoutes: Array<{
    id: string
    name: string
    grade: string
    type: string
  }>
}

// ============ 岩場詳情資料格式 ============

export interface CragDetailData {
  id: string
  name: string
  englishName: string
  location: string
  description: string
  videoUrl: string
  liveVideoId?: string
  liveVideoTitle?: string
  liveVideoDescription?: string
  images: string[]
  type: string
  rockType: string
  routes: number
  difficulty: string
  height: string
  approach: string
  seasons: string[]
  transportation: Array<{
    type: string
    description: string
  }>
  parking: string
  amenities: string[]
  googleMapsUrl: string
  geoCoordinates: {
    latitude: number
    longitude: number
  }
  weatherLocation: string
  areas: Array<{
    id: string
    name: string
    description: string
    difficulty: string
    routes: number
    image: string
  }>
  routes_details: Array<{
    id: string
    name: string
    englishName: string
    grade: string
    length: string
    type: string
    firstAscent: string
    area: string
    description: string
    protection: string
    popularity: number
    views: number
    images: string[]
    videos: string[]
    tips: string
    instagramPosts: string[]
    youtubeVideos: string[]
  }>
  metadata: {
    source: string
    sourceUrl?: string
    lastUpdated: string
    maintainer: string
    maintainerUrl?: string
    version: string
  }
}

// ============ 靜態資料 (用於離線支援) ============

// 岩場列表的靜態資料 (用於快速載入和離線顯示)
const STATIC_CRAGS: CragListItem[] = [
  {
    id: 'longdong',
    name: '龍洞',
    nameEn: 'Long Dong',
    image: '/images/crag/longdong-1.jpg',
    location: '新北市貢寮區龍洞灣',
    type: 'mixed',
    rockType: '四稜砂岩',
    routes: 616,
    difficulty: '5.3 - 5.14a',
    seasons: ['春', '秋', '冬'],
  },
  {
    id: 'defulan',
    name: '德夫蘭',
    nameEn: 'De Fu Lan',
    image: '/images/crag/defulan-1.jpg',
    location: '南投縣仁愛鄉',
    type: 'sport',
    rockType: '砂岩',
    routes: 50,
    difficulty: '5.7 - 5.13b',
    seasons: ['秋', '冬', '春'],
  },
  {
    id: 'guanziling',
    name: '關子嶺',
    nameEn: 'Guanziling',
    image: '/images/crag/guanziling-1.jpg',
    location: '台南市白河區',
    type: 'sport',
    rockType: '石灰岩',
    routes: 30,
    difficulty: '5.8 - 5.12c',
    seasons: ['秋', '冬', '春'],
  },
  {
    id: 'shoushan',
    name: '壽山',
    nameEn: 'Shou Shan',
    image: '/images/crag/shoushan-1.jpg',
    location: '高雄市鼓山區',
    type: 'sport',
    rockType: '珊瑚礁石灰岩',
    routes: 45,
    difficulty: '5.6 - 5.13a',
    seasons: ['秋', '冬', '春'],
  },
  {
    id: 'kenting',
    name: '墾丁',
    nameEn: 'Kenting',
    image: '/images/crag/kenting-1.jpg',
    location: '屏東縣恆春鎮',
    type: 'sport',
    rockType: '珊瑚礁石灰岩',
    routes: 25,
    difficulty: '5.7 - 5.12b',
    seasons: ['秋', '冬', '春'],
  },
]

// ============ 資料服務函數 ============

/**
 * 獲取所有岩場列表（簡化格式）
 */
export function getAllCrags(): CragListItem[] {
  return STATIC_CRAGS
}

/**
 * 搜尋岩場
 */
export function searchCrags(options: {
  query?: string
  region?: string
  rockType?: string
  season?: string
}): CragListItem[] {
  let crags = getAllCrags()

  if (options.query) {
    const query = options.query.toLowerCase()
    crags = crags.filter(
      (crag) =>
        crag.name.toLowerCase().includes(query) ||
        crag.nameEn.toLowerCase().includes(query) ||
        crag.location.toLowerCase().includes(query)
    )
  }

  if (options.region && options.region !== '全部') {
    crags = crags.filter((crag) => crag.location.includes(options.region!))
  }

  if (options.rockType && options.rockType !== '全部') {
    crags = crags.filter((crag) => crag.type.includes(options.rockType!))
  }

  if (options.season && options.season !== '全部') {
    crags = crags.filter((crag) => crag.seasons.includes(options.season!))
  }

  return crags
}

/**
 * 從 API 獲取岩場詳情資料
 */
export async function fetchCragDetail(id: string): Promise<CragDetailData | null> {
  try {
    const response = await apiClient.get(`/crags/${id}`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch crag detail:', error)
    return null
  }
}

/**
 * 從 API 獲取岩場路線列表
 */
export async function fetchCragRoutes(cragId: string): Promise<RouteSidebarItem[]> {
  try {
    const response = await apiClient.get(`/crags/${cragId}/routes`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch crag routes:', error)
    return []
  }
}

/**
 * 從 API 獲取岩場區域列表
 */
export async function fetchCragAreas(
  cragId: string
): Promise<Array<{ id: string; name: string }>> {
  try {
    const response = await apiClient.get(`/crags/${cragId}/areas`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch crag areas:', error)
    return []
  }
}

/**
 * 從 API 獲取路線詳情
 */
export async function fetchRouteDetail(
  cragId: string,
  routeId: string
): Promise<RouteDetailData | null> {
  try {
    const response = await apiClient.get(`/crags/${cragId}/routes/${routeId}`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch route detail:', error)
    return null
  }
}

/**
 * 難度篩選選項
 */
export const GRADE_FILTERS = [
  { id: 'all', label: '所有難度' },
  { id: '5.0-5.7', label: '5.0 - 5.7' },
  { id: '5.8-5.9', label: '5.8 - 5.9' },
  { id: '5.10', label: '5.10' },
  { id: '5.11', label: '5.11' },
  { id: '5.12', label: '5.12' },
  { id: '5.13+', label: '5.13+' },
]

/**
 * 路線類型篩選選項
 */
export const TYPE_FILTERS = [
  { id: 'all', label: '所有類型' },
  { id: 'Sport', label: 'Sport' },
  { id: 'Trad', label: 'Trad' },
  { id: 'Top Rope', label: 'Top Rope' },
  { id: 'Boulder', label: 'Boulder' },
]

/**
 * 檢查難度是否在範圍內
 */
export function isGradeInRange(grade: string, range: string): boolean {
  if (range === 'all') return true

  const gradeNum = parseGrade(grade)
  if (gradeNum === null) return false

  switch (range) {
    case '5.0-5.7':
      return gradeNum >= 0 && gradeNum < 8
    case '5.8-5.9':
      return gradeNum >= 8 && gradeNum < 10
    case '5.10':
      return gradeNum >= 10 && gradeNum < 11
    case '5.11':
      return gradeNum >= 11 && gradeNum < 12
    case '5.12':
      return gradeNum >= 12 && gradeNum < 13
    case '5.13+':
      return gradeNum >= 13
    default:
      return true
  }
}

/**
 * 解析難度為數字（用於排序和篩選）
 */
function parseGrade(grade: string): number | null {
  const match = grade.match(/5\.(\d+)([a-d]?)/)
  if (!match) return null

  const main = parseInt(match[1], 10)
  const sub = match[2] ? 'abcd'.indexOf(match[2]) * 0.25 : 0

  return main + sub
}
