/**
 * Web 平台的 API Client
 */

import { createApiClient } from '../core/client'
import { createWebTokenStorage } from './tokenStorage'

export { createWebTokenStorage } from './tokenStorage'
export { createApiClient } from '../core/client'

/**
 * 建立 Web 平台的 API Client
 */
export function createWebApiClient(baseURL: string, onAuthError?: () => void) {
  const tokenStorage = createWebTokenStorage()

  return createApiClient({
    baseURL,
    tokenStorage,
    onAuthError,
  })
}

// 匯出 tokenStorage 相關函數（向後相容）
const webTokenStorage = createWebTokenStorage()

export const getAccessToken = webTokenStorage.getAccessToken.bind(webTokenStorage)
export const setAccessToken = webTokenStorage.setAccessToken.bind(webTokenStorage)
export const getRefreshToken = webTokenStorage.getRefreshToken.bind(webTokenStorage)
export const setRefreshToken = webTokenStorage.setRefreshToken.bind(webTokenStorage)
export const removeTokens = webTokenStorage.removeTokens.bind(webTokenStorage)
export const setTokens = webTokenStorage.setTokens.bind(webTokenStorage)
