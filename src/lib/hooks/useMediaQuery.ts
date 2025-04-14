'use client'

import { useState, useEffect } from 'react'

/**
 * 媒體查詢 Hook
 * 用於響應式設計，檢測當前視窗寬度是否符合特定媒體查詢
 * 
 * @param query 媒體查詢字串
 * @returns 是否符合媒體查詢
 * 
 * @example
 * const isDesktop = useMediaQuery('(min-width: 1024px)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // 一開始先檢查是否在瀏覽器環境
    if (typeof window === 'undefined') {
      return
    }

    // 建立媒體查詢物件
    const media = window.matchMedia(query)

    // 更新狀態
    const updateMatches = () => {
      setMatches(media.matches)
    }

    // 初始化
    updateMatches()

    // 監聽變更
    if (media.addEventListener) {
      media.addEventListener('change', updateMatches)
      return () => media.removeEventListener('change', updateMatches)
    } else {
      // 兼容舊版瀏覽器
      media.addListener(updateMatches)
      return () => media.removeListener(updateMatches)
    }
  }, [query])

  return matches
}
