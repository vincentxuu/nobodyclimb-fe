'use client'

import { useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useDebounce } from './useDebounce'
import type { RouteSidebarItem } from '@/lib/crag-data'
import type { RouteFilterState } from './useRouteFilter'

// 預編譯的正則表達式（避免每次過濾時重新編譯）
const GRADE_PATTERNS = {
  '5.0-5.7': /^5\.[0-7](?!\d)/,
  '5.8-5.9': /^5\.[89](?!\d)/,
  '5.10': /^5\.10/,
  '5.11': /^5\.11/,
  '5.12': /^5\.12/,
  '5.13+': /^5\.1[3-5]/,
} as const

type GradeFilter = keyof typeof GRADE_PATTERNS | 'all'

// URL 參數名稱
const PARAM_KEYS = {
  search: 'q',
  area: 'area',
  sector: 'sector',
  grade: 'grade',
  type: 'type',
} as const

export interface UseRouteFilterParamsResult {
  // 篩選狀態
  filterState: RouteFilterState
  // 篩選後的路線
  filteredRoutes: RouteSidebarItem[]
  // 更新函數
  setSearchQuery: (query: string) => void
  setSelectedArea: (area: string) => void
  setSelectedSector: (sector: string) => void
  setSelectedGrade: (grade: string) => void
  setSelectedType: (type: string) => void
  // 重設所有篩選
  resetFilters: () => void
}

/**
 * 路線過濾 Hook（使用 URL 參數）
 * 統一管理路線列表的過濾邏輯，將篩選狀態保存在 URL 參數中
 * 支援頁面重整、分享連結時保留篩選設定
 */
export function useRouteFilterParams(routes: RouteSidebarItem[]): UseRouteFilterParamsResult {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // 從 URL 參數讀取篩選狀態
  const filterState: RouteFilterState = useMemo(() => ({
    searchQuery: searchParams.get(PARAM_KEYS.search) || '',
    selectedArea: searchParams.get(PARAM_KEYS.area) || 'all',
    selectedSector: searchParams.get(PARAM_KEYS.sector) || 'all',
    selectedGrade: (searchParams.get(PARAM_KEYS.grade) || 'all') as GradeFilter,
    selectedType: searchParams.get(PARAM_KEYS.type) || 'all',
  }), [searchParams])

  // 搜尋字串使用防抖，減少過濾頻率
  const debouncedSearchQuery = useDebounce(filterState.searchQuery, 200)

  // 更新 URL 參數的輔助函數
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [searchParams, pathname, router])

  // 設置函數
  const setSearchQuery = useCallback((query: string) => {
    updateParams({ [PARAM_KEYS.search]: query })
  }, [updateParams])

  const setSelectedArea = useCallback((area: string) => {
    // 區域改變時重置 sector
    updateParams({
      [PARAM_KEYS.area]: area,
      [PARAM_KEYS.sector]: null,
    })
  }, [updateParams])

  const setSelectedSector = useCallback((sector: string) => {
    updateParams({ [PARAM_KEYS.sector]: sector })
  }, [updateParams])

  const setSelectedGrade = useCallback((grade: string) => {
    updateParams({ [PARAM_KEYS.grade]: grade })
  }, [updateParams])

  const setSelectedType = useCallback((type: string) => {
    updateParams({ [PARAM_KEYS.type]: type })
  }, [updateParams])

  const resetFilters = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [router, pathname])

  // 解構篩選狀態為純量值
  const { selectedArea, selectedSector, selectedGrade, selectedType } = filterState

  // 過濾邏輯
  const filteredRoutes = useMemo(() => {
    if (!routes || !Array.isArray(routes) || routes.length === 0) {
      return []
    }

    const searchLower = debouncedSearchQuery.toLowerCase()

    // 如果沒有任何篩選條件，直接返回原陣列
    if (
      !debouncedSearchQuery &&
      selectedArea === 'all' &&
      selectedSector === 'all' &&
      selectedGrade === 'all' &&
      selectedType === 'all'
    ) {
      return routes
    }

    return routes.filter((route) => {
      // 防護檢查
      if (!route || typeof route !== 'object') return false

      // 區域篩選（最快的檢查，優先執行）
      if (selectedArea !== 'all' && route.areaId !== selectedArea) {
        return false
      }

      // Sector 篩選
      if (selectedSector !== 'all' && route.sector !== selectedSector) {
        return false
      }

      // 類型篩選
      if (selectedType !== 'all' && route.type !== selectedType) {
        return false
      }

      // 難度篩選（使用預編譯的正則）
      if (selectedGrade !== 'all' && route.grade) {
        const pattern = GRADE_PATTERNS[selectedGrade as keyof typeof GRADE_PATTERNS]
        if (pattern && !pattern.test(route.grade)) {
          return false
        }
      }

      // 文字搜尋（最慢的檢查，最後執行）
      if (searchLower) {
        const nameMatch = route.name?.toLowerCase().includes(searchLower)
        const gradeMatch = route.grade?.toLowerCase().includes(searchLower)
        const typeMatch = route.type?.toLowerCase().includes(searchLower)
        const sectorMatch = route.sector?.toLowerCase().includes(searchLower)

        if (!nameMatch && !gradeMatch && !typeMatch && !sectorMatch) {
          return false
        }
      }

      return true
    })
  }, [routes, debouncedSearchQuery, selectedArea, selectedSector, selectedGrade, selectedType])

  return {
    filterState,
    filteredRoutes,
    setSearchQuery,
    setSelectedArea,
    setSelectedSector,
    setSelectedGrade,
    setSelectedType,
    resetFilters,
  }
}
