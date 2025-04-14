import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
/**
 * 合併 Tailwind CSS 的類名
 * @param {ClassValue[]} inputs - 傳入的類名
 * @returns {string} 合併後的類名
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期
 * @param {Date} date - 日期物件
 * @returns {string} 格式化後的日期字串
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * 截斷文字
 * @param {string} text - 需要截斷的文字
 * @param {number} maxLength - 最大長度
 * @returns {string} 截斷後的文字
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * 生成隨機ID
 * @returns {string} 隨機ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * 防抖函數
 * @param {Function} fn - 要執行的函數
 * @param {number} ms - 延遲時間，單位毫秒
 * @returns {Function} 防抖處理後的函數
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), ms)
  }
}

/**
 * 檢查是否為客戶端
 * @returns {boolean} 是否為客戶端環境
 */
export const isClient = typeof window !== 'undefined'

/**
 * 獲取媒體查詢符合的結果
 * @param {string} query - 媒體查詢字串
 * @returns {boolean} 是否符合媒體查詢
 */
export function getMediaQuery(query: string): boolean {
  if (!isClient) return false
  return window.matchMedia(query).matches
}

/**
 * 滾動到頁面頂部
 */
export function scrollToTop(): void {
  if (!isClient) return
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
