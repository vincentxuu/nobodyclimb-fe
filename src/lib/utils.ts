import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isYesterday } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { DATE_FORMAT, DATE_TIME_FORMAT } from './constants'

/**
 * 合併 Tailwind CSS 類名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期
 * @param date 日期
 * @param showTime 是否顯示時間
 */
export function formatDate(date: Date | string | number, showTime = false): string {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  
  if (isToday(dateObj)) {
    return `今天 ${format(dateObj, 'HH:mm')}`
  }
  
  if (isYesterday(dateObj)) {
    return `昨天 ${format(dateObj, 'HH:mm')}`
  }
  
  return format(dateObj, showTime ? DATE_TIME_FORMAT : DATE_FORMAT, { locale: zhTW })
}

/**
 * 截斷文字
 * @param text 文字
 * @param maxLength 最大長度
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  
  return text.slice(0, maxLength) + '...'
}

/**
 * 格式化大數字
 * @param num 數字
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  
  return num.toString()
}

/**
 * 產生隨機 ID
 * @param length ID 長度
 */
export function generateId(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * 延遲函數
 * @param ms 毫秒
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 將 URL 參數轉換為物件
 * @param query URL 參數字串
 */
export function parseQueryString(query: string): Record<string, string> {
  const params = new URLSearchParams(query)
  const result: Record<string, string> = {}
  
  params.forEach((value, key) => {
    result[key] = value
  })
  
  return result
}

/**
 * 將物件轉換為 URL 參數
 * @param params 參數物件
 */
export function objectToQueryString(params: Record<string, any>): string {
  const urlParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      urlParams.append(key, String(value))
    }
  })
  
  return urlParams.toString()
}
