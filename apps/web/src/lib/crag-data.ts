/**
 * 岩場資料服務層
 * 負責讀取和處理岩場 JSON 資料
 */

import longdongData from '@/data/crags/longdong.json'
import defulanData from '@/data/crags/defulan.json'
import guanzilingData from '@/data/crags/guanziling.json'
import shoushanData from '@/data/crags/shoushan.json'
import kentingData from '@/data/crags/kenting.json'

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
  // 社群媒體連結
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

// ============ 常數定義 ============

// 岩場備用圖片（當實際圖片不存在時使用）
const CRAG_FALLBACK_IMAGE = '/photo/climbspot-photo.jpeg'

// ============ 資料存儲 ============

// 所有已載入的岩場資料
const cragsDataMap: Map<string, CragFullData> = new Map()

// 初始化時載入所有岩場資料
cragsDataMap.set('longdong', longdongData as CragFullData)
cragsDataMap.set('defulan', defulanData as CragFullData)
cragsDataMap.set('guanziling', guanzilingData as CragFullData)
cragsDataMap.set('shoushan', shoushanData as CragFullData)
cragsDataMap.set('kenting', kentingData as CragFullData)

// ============ 預計算緩存 ============

// Sector 緩存：Map<cragId:areaId, sectors[]>
const sectorsCache: Map<string, Array<{ id: string; name: string }>> = new Map()

// 區域名稱映射緩存：Map<cragId, Map<areaId, areaName>>
const areaNameCache: Map<string, Map<string, string>> = new Map()

// 初始化緩存
function initializeCache() {
  cragsDataMap.forEach((data, cragId) => {
    // 緩存區域名稱映射
    const areaMap = new Map<string, string>()
    data.areas.forEach(area => {
      areaMap.set(area.id, area.name)
    })
    areaNameCache.set(cragId, areaMap)

    // 預計算每個區域的 sectors
    data.areas.forEach(area => {
      const cacheKey = `${cragId}:${area.id}`
      const sectorsSet = new Set<string>()
      data.routes
        .filter(route => route.areaId === area.id && route.sector)
        .forEach(route => sectorsSet.add(route.sector!))

      sectorsCache.set(
        cacheKey,
        Array.from(sectorsSet).map(sector => ({ id: sector, name: sector }))
      )
    })
  })
}

// 執行初始化
initializeCache()

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

// ============ 資料服務函數 ============

/**
 * 獲取所有岩場列表（簡化格式）
 */
export function getAllCrags(): CragListItem[] {
  const crags: CragListItem[] = []

  // eslint-disable-next-line no-unused-vars
  cragsDataMap.forEach((data, _key) => {
    crags.push({
      id: data.crag.id,
      name: data.crag.name,
      nameEn: data.crag.nameEn,
      image: data.crag.images?.[0] || CRAG_FALLBACK_IMAGE,
      location: data.crag.location.address,
      type: data.crag.rockType,
      rockType: data.crag.rockType,
      routes: data.crag.routesCount,
      difficulty: `${data.crag.difficulty.min} - ${data.crag.difficulty.max}`,
      seasons: data.crag.seasons,
    })
  })

  return crags
}

/**
 * 根據 ID 獲取岩場完整資料
 */
export function getCragById(id: string): CragFullData | null {
  return cragsDataMap.get(id) || null
}

/**
 * 根據 slug 獲取岩場完整資料
 */
export function getCragBySlug(slug: string): CragFullData | null {
  // eslint-disable-next-line no-unused-vars
  for (const [_key, data] of cragsDataMap) {
    if (data.crag.slug === slug) {
      return data
    }
  }
  return null
}

/**
 * 獲取岩場的所有區域
 */
export function getCragAreas(cragId: string): CragArea[] {
  const data = cragsDataMap.get(cragId)
  return data?.areas || []
}

/**
 * 獲取岩場的所有路線
 */
export function getCragRoutes(cragId: string): CragRoute[] {
  const data = cragsDataMap.get(cragId)
  return data?.routes || []
}

/**
 * 路線搜尋結果項目（包含岩場資訊）
 */
export interface RouteSearchItem {
  route: CragRoute
  cragId: string
  cragName: string
  areaName: string
}

/**
 * 獲取所有岩場的所有路線（用於搜尋）
 */
export function getAllRoutes(): RouteSearchItem[] {
  return [...cragsDataMap.values()].flatMap((data) => {
    const areaIdToNameMap = new Map(data.areas.map((area) => [area.id, area.name]))
    return data.routes.map((route) => ({
      route,
      cragId: data.crag.id,
      cragName: data.crag.name,
      areaName: areaIdToNameMap.get(route.areaId) || '',
    }))
  })
}

/**
 * 根據區域 ID 獲取該區域的路線
 */
export function getRoutesByArea(cragId: string, areaId: string): CragRoute[] {
  const data = cragsDataMap.get(cragId)
  if (!data) return []
  return data.routes.filter(route => route.areaId === areaId)
}

/**
 * 根據路線 ID 獲取路線詳情
 */
export function getRouteById(cragId: string, routeId: string): CragRoute | null {
  const data = cragsDataMap.get(cragId)
  if (!data) return null
  return data.routes.find(route => route.id === routeId) || null
}

/**
 * 路線詳情頁所需的完整資料格式
 */
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

/**
 * 獲取路線詳情頁所需的完整資料
 */
export function getRouteDetailData(cragId: string, routeId: string): RouteDetailData | null {
  const fullData = getCragById(cragId)
  if (!fullData) return null

  const route = fullData.routes.find(r => r.id === routeId)
  if (!route) return null

  const area = fullData.areas.find(a => a.id === route.areaId)

  // 獲取同區域的相關路線（排除當前路線，最多 5 條）
  const relatedRoutes = fullData.routes
    .filter(r => r.areaId === route.areaId && r.id !== routeId)
    .slice(0, 5)
    .map(r => ({
      id: r.id,
      name: r.name,
      grade: r.grade,
      type: r.typeEn,
    }))

  return {
    route: {
      id: route.id,
      name: route.name,
      englishName: route.nameEn,
      grade: route.grade,
      length: route.length || '',
      type: route.type,
      typeEn: route.typeEn,
      firstAscent: route.firstAscent || '',
      firstAscentDate: route.firstAscentDate || '',
      description: route.description || '',
      protection: route.protection || '',
      tips: route.tips || '',
      boltCount: route.boltCount,
      safetyRating: route.safetyRating || '',
      popularity: route.popularity ?? 0,
      views: route.views ?? 0,
      images: route.images || [],
      videos: route.videos || [],
      youtubeVideos: route.youtubeVideos || [],
      instagramPosts: route.instagramPosts || [],
    },
    crag: {
      id: fullData.crag.id,
      name: fullData.crag.name,
      nameEn: fullData.crag.nameEn,
      slug: fullData.crag.slug,
      location: fullData.crag.location.address,
    },
    area: area ? {
      id: area.id,
      name: area.name,
      nameEn: area.nameEn,
    } : null,
    relatedRoutes,
  }
}

/**
 * 側邊欄用的輕量路線資料格式
 */
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

/**
 * 獲取岩場路線列表（側邊欄專用輕量版）
 */
export function getCragRoutesForSidebar(cragId: string): RouteSidebarItem[] {
  const data = cragsDataMap.get(cragId)
  if (!data) return []

  const areaMap = new Map(data.areas.map((a) => [a.id, a.name]))

  return data.routes.map((route) => ({
    id: route.id,
    name: route.name,
    grade: route.grade,
    type: route.typeEn,
    areaId: route.areaId,
    areaName: areaMap.get(route.areaId) || '',
    sector: route.sector,
    sectorEn: route.sectorEn,
  }))
}

/**
 * 獲取岩場區域列表（側邊欄篩選用）
 */
export function getCragAreasForFilter(cragId: string): Array<{ id: string; name: string }> {
  const data = cragsDataMap.get(cragId)
  if (!data) return []

  return data.areas.map((area) => ({
    id: area.id,
    name: area.name,
  }))
}

/**
 * 獲取指定區域的 sector 列表（側邊欄篩選用）
 * 使用預計算緩存，避免每次都遍歷所有路線
 */
export function getSectorsForArea(cragId: string, areaId: string): Array<{ id: string; name: string }> {
  const cacheKey = `${cragId}:${areaId}`
  return sectorsCache.get(cacheKey) || []
}

/**
 * 路線預覽資料（用於岩場頁面的路線簡介面板）
 */
export interface RoutePreviewItem {
  id: string
  name: string
  englishName?: string
  grade: string
  type: string
  typeEn: string
  areaId: string
  areaName: string
  length?: string
  firstAscent?: string
  description?: string
  youtubeVideos?: string[]
  boltCount?: number
}

/**
 * 根據路線 ID 獲取路線預覽資料
 */
export function getRoutePreviewData(cragId: string, routeId: string): RoutePreviewItem | null {
  const data = cragsDataMap.get(cragId)
  if (!data) return null

  const route = data.routes.find((r) => r.id === routeId)
  if (!route) return null

  const areaMap = new Map(data.areas.map((a) => [a.id, a.name]))

  return {
    id: route.id,
    name: route.name,
    englishName: route.nameEn,
    grade: route.grade,
    type: route.type,
    typeEn: route.typeEn,
    areaId: route.areaId,
    areaName: areaMap.get(route.areaId) || '',
    length: route.length,
    firstAscent: route.firstAscent,
    description: route.description,
    youtubeVideos: route.youtubeVideos,
    boltCount: route.boltCount,
  }
}

/**
 * 獲取所有路線的參數（用於 generateStaticParams）
 */
export function getAllRouteParams(): Array<{ id: string; routeId: string }> {
  const params: Array<{ id: string; routeId: string }> = []

  cragsDataMap.forEach((data) => {
    data.routes.forEach((route) => {
      params.push({
        id: data.crag.id,
        routeId: route.id,
      })
    })
  })

  return params
}

/**
 * 根據區域 ID 獲取區域詳情
 */
export function getAreaById(cragId: string, areaId: string): CragArea | null {
  const data = cragsDataMap.get(cragId)
  if (!data) return null
  return data.areas.find(area => area.id === areaId) || null
}

/**
 * 獲取區域詳細頁面所需的資料
 */
export function getAreaDetailData(cragId: string, areaId: string) {
  const fullData = getCragById(cragId)
  if (!fullData) return null

  const area = fullData.areas.find(a => a.id === areaId)
  if (!area) return null

  const areaRoutes = fullData.routes.filter(route => route.areaId === areaId)

  // 計算該區的難度分佈
  const gradeDistribution: Record<string, number> = {}
  areaRoutes.forEach(route => {
    const grade = route.grade
    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1
  })

  // 計算難度範圍分組
  const gradeRanges: Record<string, number> = {
    '5.6-5.9': 0,
    '5.10a-5.10d': 0,
    '5.11a-5.11d': 0,
    '5.12a-5.12d': 0,
    '5.13a-5.13d': 0,
    '5.14+': 0,
  }

  areaRoutes.forEach(route => {
    const grade = route.grade
    if (grade.startsWith('5.6') || grade.startsWith('5.7') || grade.startsWith('5.8') || grade.startsWith('5.9')) {
      gradeRanges['5.6-5.9']++
    } else if (grade.startsWith('5.10')) {
      gradeRanges['5.10a-5.10d']++
    } else if (grade.startsWith('5.11')) {
      gradeRanges['5.11a-5.11d']++
    } else if (grade.startsWith('5.12')) {
      gradeRanges['5.12a-5.12d']++
    } else if (grade.startsWith('5.13')) {
      gradeRanges['5.13a-5.13d']++
    } else if (grade.startsWith('5.14') || grade.startsWith('5.15')) {
      gradeRanges['5.14+']++
    }
  })

  // 計算路線類型分佈
  const typeDistribution: Record<string, number> = {}
  areaRoutes.forEach(route => {
    const type = route.type
    typeDistribution[type] = (typeDistribution[type] || 0) + 1
  })

  // 獲取同一岩場的其他區域
  const otherAreas = fullData.areas
    .filter(a => a.id !== areaId)
    .map(a => ({
      id: a.id,
      name: a.name,
      nameEn: a.nameEn,
      difficulty: a.difficulty ? `${a.difficulty.min} - ${a.difficulty.max}` : '',
      routesCount: a.routesCount,
      image: CRAG_FALLBACK_IMAGE,
    }))

  return {
    crag: {
      id: fullData.crag.id,
      name: fullData.crag.name,
      nameEn: fullData.crag.nameEn,
      slug: fullData.crag.slug,
    },
    area: {
      id: area.id,
      name: area.name,
      nameEn: area.nameEn,
      description: area.description || '',
      descriptionEn: area.descriptionEn || '',
      difficulty: area.difficulty
        ? `${area.difficulty.min} - ${area.difficulty.max}`
        : '',
      difficultyMin: area.difficulty?.min || '',
      difficultyMax: area.difficulty?.max || '',
      image: CRAG_FALLBACK_IMAGE,
      boltCount: area.boltCount,
      routesCount: area.routesCount,
      sectors: area.sectors || [],
    },
    routes: areaRoutes.map(route => ({
      id: route.id,
      name: route.name,
      englishName: route.nameEn,
      grade: route.grade,
      length: route.length || '',
      type: route.typeEn,
      firstAscent: route.firstAscent || '',
      area: route.sector || '',
      description: route.description || '',
      protection: route.protection || '',
      boltCount: route.boltCount,
      popularity: route.popularity ?? 0,
      views: route.views ?? 0,
      images: route.images || [],
      videos: route.videos || [],
      tips: route.tips || '',
      instagramPosts: route.instagramPosts || [],
      youtubeVideos: route.youtubeVideos || [],
    })),
    otherAreas,
    statistics: {
      totalRoutes: areaRoutes.length,
      totalBolts: area.boltCount,
      gradeDistribution,
      gradeRanges,
      typeDistribution,
    },
  }
}

/**
 * 獲取岩場統計資料
 */
export function getCragStatistics(cragId: string): CragStatistics | null {
  const data = cragsDataMap.get(cragId)
  return data?.statistics || null
}

/**
 * 搜尋岩場（支援名稱、位置篩選）
 */
export function searchCrags(options: {
  query?: string
  region?: string
  rockType?: string
  season?: string
  difficulty?: string
}): CragListItem[] {
  let crags = getAllCrags()

  if (options.query) {
    const query = options.query.toLowerCase()
    crags = crags.filter(
      crag =>
        crag.name.toLowerCase().includes(query) ||
        crag.nameEn.toLowerCase().includes(query) ||
        crag.location.toLowerCase().includes(query)
    )
  }

  if (options.region && options.region !== '全部') {
    crags = crags.filter(crag => crag.location.includes(options.region!))
  }

  if (options.rockType && options.rockType !== '全部') {
    crags = crags.filter(crag => crag.type.includes(options.rockType!))
  }

  if (options.season && options.season !== '全部') {
    crags = crags.filter(crag => crag.seasons.includes(options.season!))
  }

  return crags
}

/**
 * 轉換為詳情頁所需的格式（向後兼容）
 */
export function getCragDetailData(id: string) {
  const fullData = getCragById(id)
  if (!fullData) return null

  const { crag, areas, routes, metadata } = fullData

  // 使用 JSON 中的圖片或使用備用圖片
  const defaultImages = [CRAG_FALLBACK_IMAGE]

  return {
    id: crag.id,
    name: crag.name,
    englishName: crag.nameEn,
    location: crag.location.address,
    description: crag.description,
    videoUrl: crag.videoUrl || '',
    liveVideoId: crag.liveVideoId,
    liveVideoTitle: crag.liveVideoTitle,
    liveVideoDescription: crag.liveVideoDescription,
    images: defaultImages,
    type: crag.rockType,
    rockType: crag.rockType,
    routes: crag.routesCount,
    difficulty: `${crag.difficulty.min} - ${crag.difficulty.max}`,
    height: `${crag.height.min}-${crag.height.max}${crag.height.unit}`,
    approach: crag.access.approach,
    seasons: crag.seasons,
    transportation: crag.access.transportation.map(t => ({
      type: t.type,
      description: t.description,
    })),
    parking: crag.access.parking,
    amenities: crag.amenities,
    googleMapsUrl: crag.location.googleMapsUrl,
    // 地圖嵌入用的座標
    geoCoordinates: {
      latitude: crag.location.latitude,
      longitude: crag.location.longitude,
    },
    // 天氣查詢用的位置資訊（優先使用地址，包含完整的縣市區域資訊）
    weatherLocation: crag.location.address || crag.location.region,
    areas: areas.map(area => ({
      id: area.id,
      name: area.name,
      description: area.description || '',
      difficulty: area.difficulty
        ? `${area.difficulty.min} - ${area.difficulty.max}`
        : '',
      routes: area.routesCount,
      image: CRAG_FALLBACK_IMAGE,
    })),
    routes_details: routes.map(route => {
      // 使用緩存的區域名稱映射，O(1) 查找取代 O(n) 的 .find()
      const areaNameMap = areaNameCache.get(id)
      const routeAreaName = areaNameMap?.get(route.areaId) || route.sector || ''
      return {
        id: route.id,
        name: route.name,
        englishName: route.nameEn,
        grade: route.grade,
        length: route.length || '',
        type: route.typeEn,
        firstAscent: route.firstAscent || '',
        area: routeAreaName,
        description: route.description || '',
        protection: route.protection || '',
        popularity: route.popularity ?? 0,
        views: route.views ?? 0,
        images: route.images || [],
        videos: route.videos || [],
        tips: route.tips || '',
        instagramPosts: route.instagramPosts || [],
        youtubeVideos: route.youtubeVideos || [],
      }
    }),
    // 資料來源資訊
    metadata: {
      source: metadata.source,
      sourceUrl: metadata.sourceUrl,
      lastUpdated: metadata.lastUpdated,
      maintainer: metadata.maintainer,
      maintainerUrl: metadata.maintainerUrl,
      version: metadata.version,
    },
  }
}
