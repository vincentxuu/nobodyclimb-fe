/**
 * 路線相關的通用工具函數
 */

/**
 * 獲取路線名稱
 * 優先顯示中文名稱，如果沒有中文則顯示英文名稱
 * @param name 中文名稱
 * @param nameEn 英文名稱
 * @returns 要顯示的路線名稱
 */
export function getRouteName(name: string, nameEn?: string | null): string {
  // 如果有中文名稱就顯示中文
  if (name && name.trim()) {
    return name
  }
  // 沒有中文就顯示英文
  if (nameEn && nameEn.trim()) {
    return nameEn
  }
  // 都沒有就回傳空字串
  return ''
}

/**
 * 獲取區域名稱
 * 優先顯示中文名稱，如果沒有中文則顯示英文名稱
 * @param name 中文名稱
 * @param nameEn 英文名稱
 * @returns 要顯示的區域名稱
 */
export function getAreaName(name: string, nameEn?: string | null): string {
  return getRouteName(name, nameEn)
}
