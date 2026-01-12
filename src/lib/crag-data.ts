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
    lastUpdated: string
    maintainer: string
  }
}

// ============ 資料存儲 ============

// 所有已載入的岩場資料
const cragsDataMap: Map<string, CragFullData> = new Map()

// 初始化時載入所有岩場資料
cragsDataMap.set('longdong', longdongData as CragFullData)
cragsDataMap.set('defulan', defulanData as CragFullData)
cragsDataMap.set('guanziling', guanzilingData as CragFullData)
cragsDataMap.set('shoushan', shoushanData as CragFullData)
cragsDataMap.set('kenting', kentingData as CragFullData)

// ============ 列表頁用的簡化資料格式 ============

export interface CragListItem {
  id: string
  name: string
  nameEn: string
  image: string
  location: string
  type: string
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
      image: `/images/crag/${data.crag.slug}.jpg`,
      location: data.crag.location.address,
      type: data.crag.rockType,
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
 * 根據區域 ID 獲取區域詳情
 */
export function getAreaById(cragId: string, areaId: string): CragArea | null {
  const data = cragsDataMap.get(cragId)
  if (!data) return null
  return data.areas.find(area => area.id === areaId) || null
}

/**
 * 獲取岩區詳細頁面所需的資料
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

  // 獲取同一岩場的其他岩區
  const otherAreas = fullData.areas
    .filter(a => a.id !== areaId)
    .map(a => ({
      id: a.id,
      name: a.name,
      nameEn: a.nameEn,
      difficulty: a.difficulty ? `${a.difficulty.min} - ${a.difficulty.max}` : '',
      routesCount: a.routesCount,
      image: a.image || `/images/crag/${fullData.crag.slug}-${a.id}.jpg`,
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
      image: area.image || `/images/crag/${fullData.crag.slug}-${area.id}.jpg`,
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
      popularity: route.popularity ?? 0,
      views: route.views ?? 0,
      images: route.images || [],
      videos: route.videos || [],
      tips: route.tips || '',
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

  const { crag, areas, routes } = fullData

  // 使用 JSON 中的圖片或生成預設圖片
  const defaultImages = [
    `/images/crag/${crag.slug}-1.jpg`,
    `/images/crag/${crag.slug}-2.jpg`,
    `/images/crag/${crag.slug}-3.jpg`,
    `/images/crag/${crag.slug}-4.jpg`,
  ]

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
    images: crag.images && crag.images.length > 0 ? crag.images : defaultImages,
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
    geoCoordinates: {
      latitude: crag.location.latitude,
      longitude: crag.location.longitude,
    },
    weather: {
      current: {
        temp: 23,
        condition: '晴時多雲',
        precipitation: '10%',
        wind: '東北風 3級',
      },
      forecast: [
        { day: '今天', high: 24, low: 19, condition: '晴時多雲', precipitation: '10%' },
        { day: '明天', high: 25, low: 20, condition: '多雲', precipitation: '20%' },
        { day: '後天', high: 23, low: 18, condition: '陰有雨', precipitation: '60%' },
      ],
    },
    areas: areas.map(area => ({
      id: area.id,
      name: area.name,
      description: area.description || '',
      difficulty: area.difficulty
        ? `${area.difficulty.min} - ${area.difficulty.max}`
        : '',
      routes: area.routesCount,
      image: area.image || `/images/crag/${crag.slug}-${area.id}.jpg`,
    })),
    routes_details: routes.map(route => {
      const routeArea = areas.find(a => a.id === route.areaId)
      return {
        id: route.id,
        name: route.name,
        englishName: route.nameEn,
        grade: route.grade,
        length: route.length || '',
        type: route.typeEn,
        firstAscent: route.firstAscent || '',
        area: routeArea?.name || route.sector || '',
        description: route.description || '',
        protection: route.protection || '',
        popularity: route.popularity ?? 0,
        views: route.views ?? 0,
        images: route.images || [],
        videos: route.videos || [],
        tips: route.tips || '',
      }
    }),
  }
}
