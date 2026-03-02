/**
 * Native Token Storage (使用 expo-secure-store)
 *
 * 實作 @nobodyclimb/api-client 的 TokenStorage 介面
 */
import * as SecureStore from 'expo-secure-store'
import type { TokenStorage } from '@nobodyclimb/api-client'

const ACCESS_TOKEN_KEY = 'nobodyclimb-auth-token'
const REFRESH_TOKEN_KEY = 'nobodyclimb-refresh-token'

/**
 * 異步載入 tokens（用於 app 啟動時）
 */
export async function loadTokens(): Promise<{
  accessToken: string | null
  refreshToken: string | null
}> {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ])
    return { accessToken, refreshToken }
  } catch (e) {
    console.warn('Failed to load tokens:', e)
    return { accessToken: null, refreshToken: null }
  }
}

/**
 * 建立支援異步操作的 Token Storage
 *
 * 這是為了解決 SecureStore 異步特性與 TokenStorage 同步介面的不匹配
 */
export function createAsyncTokenStorage(): TokenStorage & {
  loadTokens: () => Promise<void>
} {
  let cachedAccessToken: string | undefined
  let cachedRefreshToken: string | undefined

  return {
    getAccessToken() {
      return cachedAccessToken
    },

    setAccessToken(token: string) {
      cachedAccessToken = token
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token).catch((e) =>
        console.warn('Failed to set access token:', e)
      )
    },

    getRefreshToken() {
      return cachedRefreshToken
    },

    setRefreshToken(token: string) {
      cachedRefreshToken = token
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token).catch((e) =>
        console.warn('Failed to set refresh token:', e)
      )
    },

    removeTokens() {
      cachedAccessToken = undefined
      cachedRefreshToken = undefined
      Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      ]).catch((e) => console.warn('Failed to remove tokens:', e))
    },

    setTokens(accessToken: string, refreshToken: string) {
      this.setAccessToken(accessToken)
      this.setRefreshToken(refreshToken)
    },

    async loadTokens() {
      try {
        const [accessToken, refreshToken] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        ])
        cachedAccessToken = accessToken ?? undefined
        cachedRefreshToken = refreshToken ?? undefined
      } catch (e) {
        console.warn('Failed to load tokens:', e)
      }
    },
  }
}

/**
 * 單例 Token Storage 實例
 * 用於整個 App 共用
 */
export const tokenStorage = createAsyncTokenStorage()
