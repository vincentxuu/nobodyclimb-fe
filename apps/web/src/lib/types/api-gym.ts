/**
 * API 岩館回應型別
 * 定義後端 API 回傳的 snake_case 扁平結構
 */

/**
 * 岩館營業時間（JSON 格式）
 */
export interface ApiGymOpeningHours {
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
  holiday?: string
}

/**
 * 岩館價格資訊（JSON 格式）
 */
export interface ApiGymPriceInfo {
  singleEntry?: {
    weekday?: number
    weekend?: number
    twilight?: number
    student?: number
    child?: number
  }
  rental?: {
    shoes?: number
    chalkBag?: number
    harness?: number
  }
  membership?: {
    monthly?: number
    quarterly?: number
    annual?: number
  }
  notes?: string
}

/**
 * 後端岩館資料（D1 資料庫格式 + JSON parse 後的欄位）
 */
export interface ApiGym {
  id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  city: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  email: string | null
  website: string | null
  cover_image: string | null
  is_featured: number
  opening_hours: ApiGymOpeningHours | null
  facilities: string[]
  price_info: ApiGymPriceInfo | null
  rating_avg: number
  review_count: number
  created_at: string
  updated_at: string
}

/**
 * 岩館列表 API 回應
 */
export interface ApiGymListResponse {
  success: boolean
  data: ApiGym[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

/**
 * 岩館詳情 API 回應
 */
export interface ApiGymDetailResponse {
  success: boolean
  data: ApiGym
}
