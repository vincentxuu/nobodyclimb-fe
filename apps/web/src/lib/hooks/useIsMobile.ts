'use client'

import { useMediaQuery } from './useMediaQuery'

/**
 * 檢測是否為手機版的 Hook
 * 基於 Tailwind CSS 的 md 斷點 (768px)
 *
 * @returns 是否為手機版（視窗寬度 < 768px）
 *
 * @example
 * const isMobile = useIsMobile()
 * // isMobile 為 true 時表示當前視窗寬度小於 768px
 */
export function useIsMobile(): boolean {
  // 使用 max-width 查詢，當視窗寬度小於 768px 時返回 true
  return useMediaQuery('(max-width: 767px)')
}
