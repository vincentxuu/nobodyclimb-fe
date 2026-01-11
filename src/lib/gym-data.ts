/**
 * 岩館資料服務層
 * 負責讀取和處理岩館 JSON 資料
 */

// ============ 類型定義 ============

export interface GymLocation {
  address: string
  addressEn: string
  city: string
  district: string
  region: string
  regionEn: string
  latitude: number
  longitude: number
}

export interface GymOpeningHours {
  weekday: string
  weekend: string
  monday: string
  tuesday: string
  wednesday: string
  thursday: string
  friday: string
  saturday: string
  sunday: string
  holiday: string
}

export interface GymPricing {
  singleEntry: {
    weekday: number
    weekend: number
    twilight?: number
    student?: number
    child?: number
  }
  rental: {
    shoes: number
    chalkBag: number
    harness?: number
  }
  membership?: {
    monthly?: number
    quarterly?: number
    annual?: number
  }
  course?: Record<string, unknown>
  notes?: string
}

export interface GymTransportation {
  mrt?: string
  bus?: string
  train?: string
  parking?: string
}

export interface GymContact {
  phone: string
  facebook: string
  facebookUrl?: string
  instagram: string
  instagramUrl?: string
  website: string
  line: string
  youtube?: string
}

export interface GymData {
  id: string
  slug: string
  name: string
  nameEn: string
  type: 'bouldering' | 'lead' | 'mixed'
  location: GymLocation
  description: string
  descriptionEn: string
  coverImage: string
  images: string[]
  facilities: string[]
  facilitiesEn: string[]
  openingHours: GymOpeningHours
  pricing: GymPricing
  transportation: GymTransportation
  contact: GymContact
  notes: string
  rating: number
  featured: boolean
  status: string
  createdAt: string
  updatedAt: string
}

export interface GymsJsonData {
  gyms: GymData[]
  metadata: {
    version: string
    totalGyms: number
    lastUpdated: string
    source: string
    regions: string[]
    types: string[]
  }
}

// ============ 列表頁用的簡化資料格式 ============

export interface GymListItem {
  id: string
  slug: string
  name: string
  nameEn: string
  image: string
  location: string
  city: string
  district: string
  region: string
  type: 'bouldering' | 'lead' | 'mixed'
  typeLabel: string
  facilities: string[]
  rating: number
  featured: boolean
}

// ============ 詳情頁用的完整資料格式 ============

export interface GymDetailData {
  id: string
  slug: string
  name: string
  nameEn: string
  type: 'bouldering' | 'lead' | 'mixed'
  typeLabel: string
  location: {
    address: string
    city: string
    district: string
    region: string
    latitude: number
    longitude: number
  }
  description: string
  coverImage: string
  images: string[]
  facilities: string[]
  openingHours: {
    weekday: string
    weekend: string
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
    holiday: string
  }
  pricing: GymPricing
  transportation: GymTransportation
  contact: GymContact
  notes: string
  rating: number
  featured: boolean
  updatedAt: string
}

// ============ 資料快取 ============

let cachedGymsData: GymsJsonData | null = null

// ============ 資料載入函數 ============

/**
 * 載入岩館 JSON 資料（客戶端用）
 */
export async function loadGymsData(): Promise<GymsJsonData> {
  if (cachedGymsData) {
    return cachedGymsData
  }

  const response = await fetch('/data/gyms.json')
  if (!response.ok) {
    throw new Error('Failed to load gyms data')
  }

  cachedGymsData = await response.json()
  return cachedGymsData!
}

/**
 * 清除快取（用於強制重新載入）
 */
export function clearGymsCache(): void {
  cachedGymsData = null
}

// ============ 輔助函數 ============

/**
 * 取得類型標籤
 */
function getTypeLabel(type: 'bouldering' | 'lead' | 'mixed'): string {
  const typeLabels: Record<string, string> = {
    bouldering: '抱石',
    lead: '上攀',
    mixed: '上攀和抱石',
  }
  return typeLabels[type] || type
}

/**
 * 將 GymData 轉換為 GymListItem
 */
function toGymListItem(gym: GymData): GymListItem {
  return {
    id: gym.id,
    slug: gym.slug,
    name: gym.name,
    nameEn: gym.nameEn,
    image: gym.coverImage,
    location: `${gym.location.city} ${gym.location.district}`,
    city: gym.location.city,
    district: gym.location.district,
    region: gym.location.region,
    type: gym.type,
    typeLabel: getTypeLabel(gym.type),
    facilities: gym.facilities,
    rating: gym.rating,
    featured: gym.featured,
  }
}

/**
 * 將 GymData 轉換為 GymDetailData
 */
function toGymDetailData(gym: GymData): GymDetailData {
  return {
    id: gym.id,
    slug: gym.slug,
    name: gym.name,
    nameEn: gym.nameEn,
    type: gym.type,
    typeLabel: getTypeLabel(gym.type),
    location: {
      address: gym.location.address,
      city: gym.location.city,
      district: gym.location.district,
      region: gym.location.region,
      latitude: gym.location.latitude,
      longitude: gym.location.longitude,
    },
    description: gym.description,
    coverImage: gym.coverImage,
    images: gym.images,
    facilities: gym.facilities,
    openingHours: gym.openingHours,
    pricing: gym.pricing,
    transportation: gym.transportation,
    contact: gym.contact,
    notes: gym.notes,
    rating: gym.rating,
    featured: gym.featured,
    updatedAt: gym.updatedAt,
  }
}

// ============ 資料服務函數 ============

/**
 * 獲取所有岩館列表（簡化格式）
 */
export async function getAllGyms(): Promise<GymListItem[]> {
  const data = await loadGymsData()
  return data.gyms.map(toGymListItem)
}

/**
 * 根據 ID 獲取岩館詳細資料
 */
export async function getGymById(id: string): Promise<GymDetailData | null> {
  const data = await loadGymsData()
  const gym = data.gyms.find((g) => g.id === id)
  return gym ? toGymDetailData(gym) : null
}

/**
 * 根據 slug 獲取岩館詳細資料
 */
export async function getGymBySlug(slug: string): Promise<GymDetailData | null> {
  const data = await loadGymsData()
  const gym = data.gyms.find((g) => g.slug === slug)
  return gym ? toGymDetailData(gym) : null
}

/**
 * 獲取精選岩館
 */
export async function getFeaturedGyms(): Promise<GymListItem[]> {
  const data = await loadGymsData()
  return data.gyms.filter((g) => g.featured).map(toGymListItem)
}

/**
 * 根據地區獲取岩館
 */
export async function getGymsByRegion(region: string): Promise<GymListItem[]> {
  const data = await loadGymsData()
  return data.gyms.filter((g) => g.location.region === region).map(toGymListItem)
}

/**
 * 根據類型獲取岩館
 */
export async function getGymsByType(type: 'bouldering' | 'lead' | 'mixed'): Promise<GymListItem[]> {
  const data = await loadGymsData()
  return data.gyms.filter((g) => g.type === type).map(toGymListItem)
}

/**
 * 搜尋岩館
 */
export async function searchGyms(options: {
  query?: string
  region?: string
  type?: string
  city?: string
}): Promise<GymListItem[]> {
  const data = await loadGymsData()
  let gyms = data.gyms

  // 搜尋關鍵字
  if (options.query) {
    const query = options.query.toLowerCase()
    gyms = gyms.filter(
      (gym) =>
        gym.name.toLowerCase().includes(query) ||
        gym.nameEn.toLowerCase().includes(query) ||
        gym.location.address.toLowerCase().includes(query) ||
        gym.location.city.includes(query) ||
        gym.location.district.includes(query)
    )
  }

  // 地區篩選
  if (options.region && options.region !== '所有地區') {
    if (options.region === '大台北') {
      gyms = gyms.filter(
        (gym) => gym.location.city === '台北市' || gym.location.city === '新北市'
      )
    } else {
      gyms = gyms.filter(
        (gym) =>
          gym.location.city.includes(options.region!) ||
          gym.location.region === options.region
      )
    }
  }

  // 類型篩選
  if (options.type && options.type !== '所有類型') {
    if (options.type === '抱石') {
      gyms = gyms.filter((gym) => gym.type === 'bouldering' || gym.type === 'mixed')
    } else if (options.type === '上攀') {
      gyms = gyms.filter((gym) => gym.type === 'lead' || gym.type === 'mixed')
    }
  }

  // 城市篩選
  if (options.city) {
    gyms = gyms.filter((gym) => gym.location.city === options.city)
  }

  return gyms.map(toGymListItem)
}

/**
 * 獲取相關岩館（同地區的其他岩館）
 */
export async function getRelatedGyms(
  currentGymId: string,
  limit: number = 3
): Promise<GymListItem[]> {
  const data = await loadGymsData()
  const currentGym = data.gyms.find((g) => g.id === currentGymId)

  if (!currentGym) {
    return []
  }

  // 優先選同城市，其次同地區
  const relatedGyms = data.gyms
    .filter((g) => g.id !== currentGymId)
    .sort((a, b) => {
      // 同城市優先
      if (a.location.city === currentGym.location.city && b.location.city !== currentGym.location.city) {
        return -1
      }
      if (b.location.city === currentGym.location.city && a.location.city !== currentGym.location.city) {
        return 1
      }
      // 同地區次之
      if (a.location.region === currentGym.location.region && b.location.region !== currentGym.location.region) {
        return -1
      }
      if (b.location.region === currentGym.location.region && a.location.region !== currentGym.location.region) {
        return 1
      }
      // 按評分排序
      return b.rating - a.rating
    })
    .slice(0, limit)

  return relatedGyms.map(toGymListItem)
}

/**
 * 獲取上一個和下一個岩館（用於導航）
 */
export async function getAdjacentGyms(currentGymId: string): Promise<{
  prev: GymListItem | null
  next: GymListItem | null
}> {
  const data = await loadGymsData()
  const currentIndex = data.gyms.findIndex((g) => g.id === currentGymId)

  if (currentIndex === -1) {
    return { prev: null, next: null }
  }

  const prevGym = currentIndex > 0 ? data.gyms[currentIndex - 1] : data.gyms[data.gyms.length - 1]
  const nextGym = currentIndex < data.gyms.length - 1 ? data.gyms[currentIndex + 1] : data.gyms[0]

  return {
    prev: toGymListItem(prevGym),
    next: toGymListItem(nextGym),
  }
}

/**
 * 獲取所有地區列表
 */
export async function getAllRegions(): Promise<string[]> {
  const data = await loadGymsData()
  return data.metadata.regions
}

/**
 * 獲取所有城市列表
 */
export async function getAllCities(): Promise<string[]> {
  const data = await loadGymsData()
  const cities = new Set(data.gyms.map((g) => g.location.city))
  return Array.from(cities).sort()
}

/**
 * 獲取元資料
 */
export async function getGymsMetadata(): Promise<GymsJsonData['metadata']> {
  const data = await loadGymsData()
  return data.metadata
}
