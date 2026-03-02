/**
 * 分頁相關工具函數
 */

export interface ParsedPagination {
  page: number
  limit: number
  offset: number
}

/**
 * 解析分頁參數
 * @param page 頁碼（字串或 null）
 * @param limit 每頁數量（字串或 null）
 * @param defaultLimit 預設每頁數量
 * @param maxLimit 最大每頁數量
 */
export function parsePagination(
  page?: string | null,
  limit?: string | null,
  defaultLimit = 20,
  maxLimit = 100
): ParsedPagination {
  const p = Math.max(1, parseInt(page || '1', 10) || 1)
  const l = Math.min(maxLimit, Math.max(1, parseInt(limit || String(defaultLimit), 10) || defaultLimit))
  return { page: p, limit: l, offset: (p - 1) * l }
}

/**
 * 計算總頁數
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit)
}

/**
 * 檢查是否有下一頁
 */
export function hasNextPage(page: number, totalPages: number): boolean {
  return page < totalPages
}

/**
 * 檢查是否有上一頁
 */
export function hasPreviousPage(page: number): boolean {
  return page > 1
}
