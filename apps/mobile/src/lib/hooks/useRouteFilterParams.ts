/**
 * useRouteFilterParams Hook
 *
 * 對應 apps/web/src/lib/hooks/useRouteFilterParams.ts
 * 在 React Native 中使用 Expo Router 的 URL 參數實作
 */
import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router'
import { useDebounce } from './useDebounce'

// 路線項目介面
interface RouteSidebarItem {
  id: string
  name: string
  grade?: string
  type?: string
  areaId?: string
  sector?: string
}

// 篩選狀態介面
export interface RouteFilterState {
  searchQuery: string
  selectedArea: string
  selectedSector: string
  selectedGrade: string
  selectedType: string
}

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
  const searchParams = useLocalSearchParams<{
    q?: string
    area?: string
    sector?: string
    grade?: string
    type?: string
  }>()
  const router = useRouter()
  const pathname = usePathname()

  // 搜尋輸入使用本地狀態，避免每次按鍵都更新 URL
  const urlSearchQuery = (searchParams.q as string) || ''
  const [localSearchQuery, setLocalSearchQuery] = useState(urlSearchQuery)
  const isInitialMount = useRef(true)

  // URL 參數變更時同步本地狀態（例如瀏覽器上一頁/下一頁）
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    setLocalSearchQuery(urlSearchQuery)
  }, [urlSearchQuery])

  // 搜尋字串防抖後更新 URL
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300)

  // 從 URL 參數讀取其他篩選狀態
  const filterState: RouteFilterState = useMemo(() => ({
    searchQuery: localSearchQuery, // 使用本地狀態讓輸入即時響應
    selectedArea: (searchParams.area as string) || 'all',
    selectedSector: (searchParams.sector as string) || 'all',
    selectedGrade: ((searchParams.grade as string) || 'all') as GradeFilter,
    selectedType: (searchParams.type as string) || 'all',
  }), [localSearchQuery, searchParams.area, searchParams.sector, searchParams.grade, searchParams.type])

  // 更新 URL 參數的輔助函數
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const newParams: Record<string, string> = {}

    // 保留現有參數
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value !== 'all') {
        newParams[key] = value
      }
    })

    // 應用更新
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        delete newParams[key]
      } else {
        newParams[key] = value
      }
    })

    // 使用 Expo Router 的 setParams
    router.setParams(newParams)
  }, [searchParams, router])

  // 防抖後的搜尋 URL 更新
  const prevDebouncedQuery = useRef(debouncedSearchQuery)
  useEffect(() => {
    // 只在防抖值變更且非初始載入時更新 URL
    if (prevDebouncedQuery.current !== debouncedSearchQuery) {
      prevDebouncedQuery.current = debouncedSearchQuery
      updateParams({ [PARAM_KEYS.search]: debouncedSearchQuery || null })
    }
  }, [debouncedSearchQuery, updateParams])

  // 設置函數 - 搜尋只更新本地狀態，URL 由 useEffect 防抖更新
  const setSearchQuery = useCallback((query: string) => {
    setLocalSearchQuery(query)
  }, [])

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
    setLocalSearchQuery('') // 清除本地搜尋狀態
    router.setParams({})
  }, [router])

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
