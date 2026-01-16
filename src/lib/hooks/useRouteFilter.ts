import { useMemo, useState, useCallback } from 'react'
import { useDebounce } from './useDebounce'
import type { RouteSidebarItem } from '@/lib/crag-data'

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

export interface RouteFilterState {
  searchQuery: string
  selectedArea: string
  selectedSector: string
  selectedGrade: GradeFilter
  selectedType: string
}

export interface UseRouteFilterResult {
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

const initialFilterState: RouteFilterState = {
  searchQuery: '',
  selectedArea: 'all',
  selectedSector: 'all',
  selectedGrade: 'all',
  selectedType: 'all',
}

/**
 * 路線過濾 Hook
 * 統一管理路線列表的過濾邏輯，並使用防抖優化搜尋性能
 */
export function useRouteFilter(routes: RouteSidebarItem[]): UseRouteFilterResult {
  const [filterState, setFilterState] = useState<RouteFilterState>(initialFilterState)

  // 搜尋字串使用防抖，減少過濾頻率
  const debouncedSearchQuery = useDebounce(filterState.searchQuery, 200)

  // 設置函數
  const setSearchQuery = useCallback((query: string) => {
    setFilterState(prev => ({ ...prev, searchQuery: query }))
  }, [])

  const setSelectedArea = useCallback((area: string) => {
    setFilterState(prev => ({
      ...prev,
      selectedArea: area,
      // 區域改變時重置 sector
      selectedSector: 'all'
    }))
  }, [])

  const setSelectedSector = useCallback((sector: string) => {
    setFilterState(prev => ({ ...prev, selectedSector: sector }))
  }, [])

  const setSelectedGrade = useCallback((grade: string) => {
    setFilterState(prev => ({ ...prev, selectedGrade: grade as GradeFilter }))
  }, [])

  const setSelectedType = useCallback((type: string) => {
    setFilterState(prev => ({ ...prev, selectedType: type }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilterState(initialFilterState)
  }, [])

  // 解構篩選狀態為純量值，避免 useMemo 因物件參考改變而不必要地重新計算
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
        const pattern = GRADE_PATTERNS[selectedGrade]
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
    // 返回即時的 filterState，讓 UI 能立即更新（搜尋框等）
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
