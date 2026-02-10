import { useState, useEffect } from 'react'

// 後端路線型別（snake_case，對應 API 回應）
export interface AdminRoute {
  id: string
  crag_id: string
  area_id: string | null
  sector_id: string | null
  name: string
  grade: string | null
  grade_system: string
  height: number | null
  bolt_count: number | null
  route_type: 'sport' | 'trad' | 'boulder' | 'mixed'
  description: string | null
  first_ascent: string | null
  created_at: string
}

// 路線表單資料
export interface RouteFormData {
  name: string
  grade: string
  grade_system: string
  height: string
  bolt_count: string
  route_type: string
  description: string
  first_ascent: string
  area_id: string
  sector_id: string
}

export const emptyRouteForm: RouteFormData = {
  name: '',
  grade: '',
  grade_system: 'yds',
  height: '',
  bolt_count: '',
  route_type: 'sport',
  description: '',
  first_ascent: '',
  area_id: '',
  sector_id: '',
}

// 岩場表單資料
export interface CragFormData {
  name: string
  slug: string
  description: string
  location: string
  region: string
  latitude: string
  longitude: string
  altitude: string
  rock_type: string
  climbing_types: string
  difficulty_range: string
  is_featured: boolean
  access_info: string
  parking_info: string
  approach_time: string
  best_seasons: string
  restrictions: string
}

export const emptyCragForm: CragFormData = {
  name: '',
  slug: '',
  description: '',
  location: '',
  region: '',
  latitude: '',
  longitude: '',
  altitude: '',
  rock_type: '',
  climbing_types: '',
  difficulty_range: '',
  is_featured: false,
  access_info: '',
  parking_info: '',
  approach_time: '',
  best_seasons: '',
  restrictions: '',
}

export const routeTypeLabels: Record<string, string> = {
  sport: '運動攀登',
  trad: '傳統攀登',
  boulder: '抱石',
  mixed: '混合',
}

export const REGIONS = ['北部', '中部', '南部', '東部', '離島']

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
