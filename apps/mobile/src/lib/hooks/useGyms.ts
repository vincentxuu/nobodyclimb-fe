/**
 * 岩館相關 TanStack Query Hooks
 *
 * 對應 apps/web/src/hooks/api/useGyms.ts
 * 使用 API 取得真實資料，取代靜態 gym-data.ts 的 JSON fetch
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { GymListItem, GymDetailData, GymPricing } from '@/lib/gym-data'

const STALE_TIME = 5 * 60 * 1000 // 5 分鐘
const GC_TIME = 30 * 60 * 1000 // 30 分鐘

/**
 * 從 API 回應中提取資料
 */
function extractData<T>(response: any): T {
  return response.data?.data ?? response.data
}

/**
 * 取得類型標籤
 */
function getTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    bouldering: '抱石',
    lead: '上攀',
    mixed: '上攀和抱石',
  }
  return typeLabels[type] || type
}

/**
 * 將 API 岩館資料轉為 GymListItem
 */
function adaptGymToListItem(apiGym: any): GymListItem {
  const location = apiGym.location || {}
  return {
    id: apiGym.id,
    slug: apiGym.slug || apiGym.id,
    name: apiGym.name,
    nameEn: apiGym.name_en || apiGym.nameEn || '',
    image: apiGym.cover_image || apiGym.coverImage || '',
    location: location.address
      ? `${location.city || ''} ${location.district || ''}`.trim()
      : typeof apiGym.location === 'string'
        ? apiGym.location
        : '',
    city: location.city || '',
    district: location.district || '',
    region: location.region || location.region_en || '',
    type: apiGym.type || 'mixed',
    typeLabel: getTypeLabel(apiGym.type || 'mixed'),
    facilities: apiGym.facilities || [],
    rating: apiGym.rating || 0,
    featured: apiGym.featured || false,
  }
}

/**
 * 將 API 岩館資料轉為 GymDetailData
 */
function adaptGymToDetail(apiGym: any): GymDetailData {
  const location = apiGym.location || {}
  const openingHours = apiGym.opening_hours || apiGym.openingHours || {}
  const pricing = apiGym.pricing || {}
  const transportation = apiGym.transportation || {}
  const contact = apiGym.contact || {}

  return {
    id: apiGym.id,
    slug: apiGym.slug || apiGym.id,
    name: apiGym.name,
    nameEn: apiGym.name_en || apiGym.nameEn || '',
    type: apiGym.type || 'mixed',
    typeLabel: getTypeLabel(apiGym.type || 'mixed'),
    location: {
      address: location.address || '',
      city: location.city || '',
      district: location.district || '',
      region: location.region || '',
      latitude: location.latitude || 0,
      longitude: location.longitude || 0,
    },
    description: apiGym.description || '',
    coverImage: apiGym.cover_image || apiGym.coverImage || '',
    images: apiGym.images || [],
    facilities: apiGym.facilities || [],
    openingHours: {
      monday: openingHours.monday || '休息',
      tuesday: openingHours.tuesday || '休息',
      wednesday: openingHours.wednesday || '休息',
      thursday: openingHours.thursday || '休息',
      friday: openingHours.friday || '休息',
      saturday: openingHours.saturday || '休息',
      sunday: openingHours.sunday || '休息',
      holiday: openingHours.holiday || '休息',
    },
    pricing: {
      singleEntry: pricing.singleEntry || pricing.single_entry || { weekday: 0, weekend: 0 },
      rental: pricing.rental || { shoes: 0, chalkBag: 0 },
      membership: pricing.membership,
      course: pricing.course,
      notes: pricing.notes,
    },
    transportation: {
      mrt: transportation.mrt,
      bus: transportation.bus,
      train: transportation.train,
      parking: transportation.parking,
    },
    contact: {
      phone: contact.phone || '',
      facebook: contact.facebook || '',
      facebookUrl: contact.facebook_url || contact.facebookUrl,
      instagram: contact.instagram || '',
      instagramUrl: contact.instagram_url || contact.instagramUrl,
      website: contact.website || '',
      line: contact.line || '',
      youtube: contact.youtube,
    },
    unboxingReviews: apiGym.unboxing_reviews || apiGym.unboxingReviews,
    notes: apiGym.notes || '',
    rating: apiGym.rating || 0,
    featured: apiGym.featured || false,
    updatedAt: apiGym.updated_at || apiGym.updatedAt || '',
  }
}

/**
 * 獲取岩館列表
 */
export function useGyms(options?: { page?: number; limit?: number }) {
  const { page = 1, limit = 100 } = options || {}

  return useQuery({
    queryKey: ['gyms', { page, limit }],
    queryFn: async (): Promise<GymListItem[]> => {
      const response = await apiClient.get('/gyms', { params: { page, limit } })
      const apiGyms = extractData<any[]>(response) || []
      return apiGyms.map(adaptGymToListItem)
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取岩館詳情
 */
export function useGymDetail(id: string) {
  return useQuery({
    queryKey: ['gym', id],
    queryFn: async (): Promise<GymDetailData | null> => {
      const response = await apiClient.get(`/gyms/${id}`)
      const apiGym = extractData<any>(response)
      if (!apiGym) return null
      return adaptGymToDetail(apiGym)
    },
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取相關岩館（從全部列表中篩選同地區的）
 */
export function useRelatedGyms(currentGymId: string, limit: number = 3) {
  const { data: allGyms } = useGyms({ limit: 100 })

  return useQuery({
    queryKey: ['gyms', 'related', currentGymId, limit],
    queryFn: async (): Promise<GymListItem[]> => {
      if (!allGyms) return []
      const currentGym = allGyms.find((g) => g.id === currentGymId)
      if (!currentGym) return []

      return allGyms
        .filter((g) => g.id !== currentGymId)
        .sort((a, b) => {
          const cityScore = Number(b.city === currentGym.city) - Number(a.city === currentGym.city)
          if (cityScore !== 0) return cityScore
          const regionScore = Number(b.region === currentGym.region) - Number(a.region === currentGym.region)
          if (regionScore !== 0) return regionScore
          return b.rating - a.rating
        })
        .slice(0, limit)
    },
    enabled: !!currentGymId && !!allGyms,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 獲取相鄰岩館（上一個/下一個）
 */
export function useAdjacentGyms(currentGymId: string) {
  const { data: allGyms } = useGyms({ limit: 100 })

  return useQuery({
    queryKey: ['gyms', 'adjacent', currentGymId],
    queryFn: async (): Promise<{ prev: GymListItem | null; next: GymListItem | null }> => {
      if (!allGyms) return { prev: null, next: null }
      const currentIndex = allGyms.findIndex((g) => g.id === currentGymId)
      if (currentIndex === -1) return { prev: null, next: null }

      const prevGym = currentIndex > 0 ? allGyms[currentIndex - 1] : allGyms[allGyms.length - 1]
      const nextGym = currentIndex < allGyms.length - 1 ? allGyms[currentIndex + 1] : allGyms[0]

      return { prev: prevGym, next: nextGym }
    },
    enabled: !!currentGymId && !!allGyms,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * 搜尋岩館（客戶端過濾）
 */
export function useSearchGyms(options: {
  query?: string
  region?: string
  type?: string
}) {
  const { data: allGyms, isLoading, error } = useGyms({ limit: 100 })

  const filteredGyms = allGyms
    ? filterGyms(allGyms, options)
    : []

  return {
    data: filteredGyms,
    isLoading,
    error,
  }
}

/**
 * 客戶端篩選岩館
 */
function filterGyms(
  gyms: GymListItem[],
  options: { query?: string; region?: string; type?: string }
): GymListItem[] {
  let result = gyms

  if (options.query) {
    const query = options.query.toLowerCase()
    result = result.filter(
      (gym) =>
        gym.name.toLowerCase().includes(query) ||
        gym.nameEn.toLowerCase().includes(query) ||
        gym.location.toLowerCase().includes(query)
    )
  }

  if (options.region && options.region !== '所有地區') {
    result = result.filter(
      (gym) =>
        gym.city.includes(options.region!) ||
        gym.region === options.region
    )
  }

  if (options.type && options.type !== '所有類型') {
    if (options.type === '抱石') {
      result = result.filter((gym) => gym.type === 'bouldering' || gym.type === 'mixed')
    } else if (options.type === '上攀') {
      result = result.filter((gym) => gym.type === 'lead' || gym.type === 'mixed')
    }
  }

  return result
}
