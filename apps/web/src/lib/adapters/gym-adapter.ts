/**
 * 岩館型別適配器
 * 將後端 API 回應轉換為前端使用的格式
 */

import type { ApiGym, ApiGymOpeningHours, ApiGymPriceInfo } from '@/lib/types/api-gym'
import type { GymListItem, GymDetailData, GymPricing, GymTransportation, GymContact, GymUnboxingReview } from '@/lib/gym-data'

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
 * 根據設施推斷岩館類型
 */
function inferGymType(facilities: string[]): 'bouldering' | 'lead' | 'mixed' {
  const hasBouldering = facilities.some(f =>
    f.includes('抱石') || f.toLowerCase().includes('boulder')
  )
  const hasLead = facilities.some(f =>
    f.includes('上攀') || f.includes('先鋒') || f.toLowerCase().includes('lead')
  )

  if (hasBouldering && hasLead) return 'mixed'
  if (hasLead) return 'lead'
  return 'bouldering'
}

/**
 * 將 API 岩館資料轉換為列表項目格式
 */
export function adaptGymToListItem(apiGym: ApiGym): GymListItem {
  const type = inferGymType(apiGym.facilities || [])

  return {
    id: apiGym.id,
    slug: apiGym.slug,
    name: apiGym.name,
    nameEn: '', // 後端目前沒有英文名稱欄位
    image: apiGym.cover_image || '/photo/gym-placeholder.jpeg',
    location: `${apiGym.city || ''} ${apiGym.region || ''}`.trim(),
    city: apiGym.city || '',
    district: '', // 後端沒有區域欄位
    region: apiGym.region || '',
    type,
    typeLabel: getTypeLabel(type),
    facilities: apiGym.facilities || [],
    rating: apiGym.rating_avg || 0,
    featured: apiGym.is_featured === 1,
  }
}

/**
 * 轉換營業時間格式
 */
function adaptOpeningHours(hours: ApiGymOpeningHours | null): GymDetailData['openingHours'] {
  const defaultHours = {
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: '',
    holiday: '',
  }

  if (!hours) return defaultHours

  return {
    monday: hours.monday || '',
    tuesday: hours.tuesday || '',
    wednesday: hours.wednesday || '',
    thursday: hours.thursday || '',
    friday: hours.friday || '',
    saturday: hours.saturday || '',
    sunday: hours.sunday || '',
    holiday: hours.holiday || '',
  }
}

/**
 * 轉換價格資訊格式
 */
function adaptPricing(priceInfo: ApiGymPriceInfo | null): GymPricing {
  const defaultPricing: GymPricing = {
    singleEntry: {
      weekday: 0,
      weekend: 0,
    },
    rental: {
      shoes: 0,
      chalkBag: 0,
    },
  }

  if (!priceInfo) return defaultPricing

  return {
    singleEntry: {
      weekday: priceInfo.singleEntry?.weekday || 0,
      weekend: priceInfo.singleEntry?.weekend || 0,
      twilight: priceInfo.singleEntry?.twilight,
      student: priceInfo.singleEntry?.student,
      child: priceInfo.singleEntry?.child,
    },
    rental: {
      shoes: priceInfo.rental?.shoes || 0,
      chalkBag: priceInfo.rental?.chalkBag || 0,
      harness: priceInfo.rental?.harness,
    },
    membership: priceInfo.membership,
    notes: priceInfo.notes,
  }
}

/**
 * 將 API 岩館資料轉換為詳情頁格式
 */
export function adaptGymToDetail(apiGym: ApiGym): GymDetailData {
  const type = inferGymType(apiGym.facilities || [])

  // 建構交通資訊（後端目前沒有這些欄位，使用空值）
  const transportation: GymTransportation = {
    mrt: undefined,
    bus: undefined,
    train: undefined,
    parking: undefined,
  }

  // 建構聯絡資訊
  const contact: GymContact = {
    phone: apiGym.phone || '',
    facebook: '',
    instagram: '',
    website: apiGym.website || '',
    line: '',
    youtube: undefined,
  }

  return {
    id: apiGym.id,
    slug: apiGym.slug,
    name: apiGym.name,
    nameEn: '', // 後端目前沒有英文名稱欄位
    type,
    typeLabel: getTypeLabel(type),
    location: {
      address: apiGym.address || '',
      city: apiGym.city || '',
      district: '', // 後端沒有區域欄位
      region: apiGym.region || '',
      latitude: apiGym.latitude || 0,
      longitude: apiGym.longitude || 0,
    },
    description: apiGym.description || '',
    coverImage: apiGym.cover_image || '/photo/gym-placeholder.jpeg',
    images: [], // 後端目前沒有多張圖片欄位
    facilities: apiGym.facilities || [],
    openingHours: adaptOpeningHours(apiGym.opening_hours),
    pricing: adaptPricing(apiGym.price_info),
    transportation,
    contact,
    unboxingReviews: undefined, // 後端目前沒有開箱介紹欄位
    notes: '',
    rating: apiGym.rating_avg || 0,
    featured: apiGym.is_featured === 1,
    updatedAt: apiGym.updated_at,
  }
}

/**
 * 搜尋岩館（在前端進行過濾）
 */
export function filterGyms(
  gyms: GymListItem[],
  options: {
    query?: string
    region?: string
    type?: string
    city?: string
  }
): GymListItem[] {
  let filtered = [...gyms]

  // 搜尋關鍵字
  if (options.query) {
    const query = options.query.toLowerCase()
    filtered = filtered.filter(
      (gym) =>
        gym.name.toLowerCase().includes(query) ||
        gym.nameEn.toLowerCase().includes(query) ||
        gym.location.toLowerCase().includes(query) ||
        gym.city.includes(query)
    )
  }

  // 地區篩選
  if (options.region && options.region !== '所有地區') {
    filtered = filtered.filter(
      (gym) =>
        gym.city.includes(options.region!) ||
        gym.region === options.region
    )
  }

  // 類型篩選
  if (options.type && options.type !== '所有類型') {
    if (options.type === '抱石') {
      filtered = filtered.filter((gym) => gym.type === 'bouldering' || gym.type === 'mixed')
    } else if (options.type === '上攀') {
      filtered = filtered.filter((gym) => gym.type === 'lead' || gym.type === 'mixed')
    }
  }

  // 城市篩選
  if (options.city) {
    filtered = filtered.filter((gym) => gym.city === options.city)
  }

  return filtered
}

/**
 * 獲取相關岩館（同地區的其他岩館）
 */
export function getRelatedGymsFromList(
  gyms: GymListItem[],
  currentGymId: string,
  limit: number = 3
): GymListItem[] {
  const currentGym = gyms.find((g) => g.id === currentGymId)

  if (!currentGym) {
    return []
  }

  // 優先選同城市，其次同地區，最後按評分排序
  return gyms
    .filter((g) => g.id !== currentGymId)
    .sort((a, b) => {
      // 排序優先級: 1. 同城市 2. 同地區 3. 評分
      const cityScore =
        Number(b.city === currentGym.city) - Number(a.city === currentGym.city)
      if (cityScore !== 0) return cityScore

      const regionScore =
        Number(b.region === currentGym.region) - Number(a.region === currentGym.region)
      if (regionScore !== 0) return regionScore

      return b.rating - a.rating
    })
    .slice(0, limit)
}

/**
 * 獲取上一個和下一個岩館（用於導航）
 */
export function getAdjacentGymsFromList(
  gyms: GymListItem[],
  currentGymId: string
): { prev: GymListItem | null; next: GymListItem | null } {
  const currentIndex = gyms.findIndex((g) => g.id === currentGymId)

  if (currentIndex === -1) {
    return { prev: null, next: null }
  }

  const prevGym = currentIndex > 0 ? gyms[currentIndex - 1] : gyms[gyms.length - 1]
  const nextGym = currentIndex < gyms.length - 1 ? gyms[currentIndex + 1] : gyms[0]

  return {
    prev: prevGym,
    next: nextGym,
  }
}
