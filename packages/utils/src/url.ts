/**
 * URL 相關工具函數
 */

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
export function objectToQueryString(params: Record<string, unknown>): string {
  const urlParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      urlParams.append(key, String(value))
    }
  })

  return urlParams.toString()
}

/**
 * 組合 URL 路徑
 */
export function joinPaths(...paths: string[]): string {
  return paths
    .map((path, index) => {
      if (index === 0) {
        return path.replace(/\/+$/, '')
      }
      return path.replace(/^\/+|\/+$/g, '')
    })
    .filter(Boolean)
    .join('/')
}
