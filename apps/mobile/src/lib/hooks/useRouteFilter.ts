/**
 * useRouteFilter Hook
 *
 * 對應 apps/web/src/lib/hooks/useRouteFilter.ts
 */
import { useState, useMemo, useCallback } from 'react'

interface Route {
  id: string
  name: string
  grade: string
  type: string
  style?: string
  stars?: number
  height?: number
}

interface RouteFilterOptions {
  grades?: string[]
  types?: string[]
  styles?: string[]
  minStars?: number
  maxStars?: number
  minHeight?: number
  maxHeight?: number
  searchQuery?: string
  sortBy?: 'name' | 'grade' | 'stars' | 'height'
  sortOrder?: 'asc' | 'desc'
}

interface UseRouteFilterResult<T extends Route> {
  filteredRoutes: T[]
  filters: RouteFilterOptions
  setFilter: <K extends keyof RouteFilterOptions>(key: K, value: RouteFilterOptions[K]) => void
  setFilters: (filters: Partial<RouteFilterOptions>) => void
  resetFilters: () => void
  hasActiveFilters: boolean
  activeFilterCount: number
}

const DEFAULT_FILTERS: RouteFilterOptions = {
  grades: [],
  types: [],
  styles: [],
  searchQuery: '',
  sortBy: 'name',
  sortOrder: 'asc',
}

// 難度排序映射
const GRADE_ORDER: Record<string, number> = {
  '5.5': 1, '5.6': 2, '5.7': 3, '5.8': 4, '5.9': 5,
  '5.10a': 6, '5.10b': 7, '5.10c': 8, '5.10d': 9,
  '5.11a': 10, '5.11b': 11, '5.11c': 12, '5.11d': 13,
  '5.12a': 14, '5.12b': 15, '5.12c': 16, '5.12d': 17,
  '5.13a': 18, '5.13b': 19, '5.13c': 20, '5.13d': 21,
  '5.14a': 22, '5.14b': 23, '5.14c': 24, '5.14d': 25,
  'V0': 1, 'V1': 2, 'V2': 3, 'V3': 4, 'V4': 5,
  'V5': 6, 'V6': 7, 'V7': 8, 'V8': 9, 'V9': 10,
  'V10': 11, 'V11': 12, 'V12': 13, 'V13': 14, 'V14': 15,
}

export function useRouteFilter<T extends Route>(routes: T[]): UseRouteFilterResult<T> {
  const [filters, setFiltersState] = useState<RouteFilterOptions>(DEFAULT_FILTERS)

  const setFilter = useCallback(<K extends keyof RouteFilterOptions>(
    key: K,
    value: RouteFilterOptions[K]
  ) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setFilters = useCallback((newFilters: Partial<RouteFilterOptions>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
  }, [])

  const filteredRoutes = useMemo(() => {
    let result = [...routes]

    // 搜尋過濾
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      result = result.filter((route) =>
        route.name.toLowerCase().includes(query)
      )
    }

    // 難度過濾
    if (filters.grades && filters.grades.length > 0) {
      result = result.filter((route) =>
        filters.grades!.includes(route.grade)
      )
    }

    // 類型過濾
    if (filters.types && filters.types.length > 0) {
      result = result.filter((route) =>
        filters.types!.includes(route.type)
      )
    }

    // 風格過濾
    if (filters.styles && filters.styles.length > 0) {
      result = result.filter((route) =>
        route.style && filters.styles!.includes(route.style)
      )
    }

    // 星級過濾
    if (filters.minStars !== undefined) {
      result = result.filter((route) =>
        (route.stars ?? 0) >= filters.minStars!
      )
    }
    if (filters.maxStars !== undefined) {
      result = result.filter((route) =>
        (route.stars ?? 0) <= filters.maxStars!
      )
    }

    // 高度過濾
    if (filters.minHeight !== undefined) {
      result = result.filter((route) =>
        (route.height ?? 0) >= filters.minHeight!
      )
    }
    if (filters.maxHeight !== undefined) {
      result = result.filter((route) =>
        (route.height ?? 0) <= filters.maxHeight!
      )
    }

    // 排序
    if (filters.sortBy) {
      result.sort((a, b) => {
        let comparison = 0

        switch (filters.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name)
            break
          case 'grade':
            comparison = (GRADE_ORDER[a.grade] ?? 0) - (GRADE_ORDER[b.grade] ?? 0)
            break
          case 'stars':
            comparison = (a.stars ?? 0) - (b.stars ?? 0)
            break
          case 'height':
            comparison = (a.height ?? 0) - (b.height ?? 0)
            break
        }

        return filters.sortOrder === 'desc' ? -comparison : comparison
      })
    }

    return result
  }, [routes, filters])

  const hasActiveFilters = useMemo(() => {
    return (
      (filters.grades?.length ?? 0) > 0 ||
      (filters.types?.length ?? 0) > 0 ||
      (filters.styles?.length ?? 0) > 0 ||
      filters.minStars !== undefined ||
      filters.maxStars !== undefined ||
      filters.minHeight !== undefined ||
      filters.maxHeight !== undefined ||
      (filters.searchQuery?.length ?? 0) > 0
    )
  }, [filters])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if ((filters.grades?.length ?? 0) > 0) count++
    if ((filters.types?.length ?? 0) > 0) count++
    if ((filters.styles?.length ?? 0) > 0) count++
    if (filters.minStars !== undefined || filters.maxStars !== undefined) count++
    if (filters.minHeight !== undefined || filters.maxHeight !== undefined) count++
    if ((filters.searchQuery?.length ?? 0) > 0) count++
    return count
  }, [filters])

  return {
    filteredRoutes,
    filters,
    setFilter,
    setFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  }
}
