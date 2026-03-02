/**
 * useMediaQuery Hook
 *
 * 對應 apps/web/src/lib/hooks/useMediaQuery.ts
 * 在 React Native 中使用 Dimensions API 實作響應式設計
 */
import { useState, useEffect } from 'react'
import { Dimensions, ScaledSize } from 'react-native'

// 常用的螢幕尺寸斷點（對應 Tailwind CSS）
export const BREAKPOINTS = {
  sm: 640,  // Tailwind sm
  md: 768,  // Tailwind md
  lg: 1024, // Tailwind lg
  xl: 1280, // Tailwind xl
} as const

interface ScreenSize {
  width: number
  height: number
}

/**
 * 解析媒體查詢字串
 * 支援簡單的 min-width 和 max-width 查詢
 */
function parseMediaQuery(query: string): (size: ScreenSize) => boolean {
  const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/)
  const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/)
  const minHeightMatch = query.match(/\(min-height:\s*(\d+)px\)/)
  const maxHeightMatch = query.match(/\(max-height:\s*(\d+)px\)/)

  return (size: ScreenSize) => {
    let result = true

    if (minWidthMatch) {
      const minWidth = parseInt(minWidthMatch[1], 10)
      result = result && size.width >= minWidth
    }

    if (maxWidthMatch) {
      const maxWidth = parseInt(maxWidthMatch[1], 10)
      result = result && size.width <= maxWidth
    }

    if (minHeightMatch) {
      const minHeight = parseInt(minHeightMatch[1], 10)
      result = result && size.height >= minHeight
    }

    if (maxHeightMatch) {
      const maxHeight = parseInt(maxHeightMatch[1], 10)
      result = result && size.height <= maxHeight
    }

    return result
  }
}

/**
 * 媒體查詢 Hook
 * 用於響應式設計，檢測當前螢幕尺寸是否符合特定媒體查詢
 *
 * @param query 媒體查詢字串 (支援 min-width, max-width, min-height, max-height)
 * @returns 是否符合媒體查詢
 *
 * @example
 * const isTablet = useMediaQuery('(min-width: 768px)')
 * const isLandscape = useMediaQuery('(min-width: 768px)') && dimensions.width > dimensions.height
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    const { width, height } = Dimensions.get('window')
    const checkQuery = parseMediaQuery(query)
    return checkQuery({ width, height })
  })

  useEffect(() => {
    const checkQuery = parseMediaQuery(query)

    const handleChange = ({ window }: { window: ScaledSize }) => {
      const newMatches = checkQuery({ width: window.width, height: window.height })
      setMatches(newMatches)
    }

    // 監聽螢幕尺寸變化（例如旋轉裝置）
    const subscription = Dimensions.addEventListener('change', handleChange)

    return () => {
      subscription?.remove()
    }
  }, [query])

  return matches
}

/**
 * 螢幕尺寸 Hook
 * 提供當前螢幕尺寸和常用的響應式檢查
 *
 * @example
 * const { width, height, isSmall, isMedium, isLarge } = useScreenSize()
 */
export function useScreenSize() {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'))

  useEffect(() => {
    const handleChange = ({ window }: { window: ScaledSize }) => {
      setDimensions(window)
    }

    const subscription = Dimensions.addEventListener('change', handleChange)

    return () => {
      subscription?.remove()
    }
  }, [])

  return {
    width: dimensions.width,
    height: dimensions.height,
    // 響應式斷點檢查
    isSmall: dimensions.width < BREAKPOINTS.sm,
    isMedium: dimensions.width >= BREAKPOINTS.sm && dimensions.width < BREAKPOINTS.md,
    isLarge: dimensions.width >= BREAKPOINTS.md && dimensions.width < BREAKPOINTS.lg,
    isExtraLarge: dimensions.width >= BREAKPOINTS.lg,
    // 方向檢查
    isPortrait: dimensions.height > dimensions.width,
    isLandscape: dimensions.width > dimensions.height,
  }
}

/**
 * 檢測是否為平板裝置（基於螢幕寬度）
 * 在 React Native 中，這比 useIsMobile 更有用
 */
export function useIsTablet(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`)
}
