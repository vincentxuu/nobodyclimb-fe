/**
 * Token 儲存工具
 *
 * 解決 Android WebView 和某些 Android 瀏覽器中 cookie 不穩定的問題
 * 同時使用 cookie 和 localStorage 作為備用方案
 */
import Cookies from 'js-cookie'
import { AUTH_TOKEN_KEY, AUTH_REFRESH_TOKEN_KEY } from '../constants'

// 時間常數
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000

// 預設過期時間（天數）
const DEFAULT_ACCESS_TOKEN_DAYS = 1
const DEFAULT_REFRESH_TOKEN_DAYS = 7

// localStorage keys (加上前綴以區分)
const LS_ACCESS_TOKEN_KEY = `ls_${AUTH_TOKEN_KEY}`
const LS_REFRESH_TOKEN_KEY = `ls_${AUTH_REFRESH_TOKEN_KEY}`

/**
 * 檢查 localStorage 是否可用
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const testKey = '__storage_test__'
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * 檢查 cookie 是否可用且可以正常寫入
 */
function isCookieAvailable(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const testKey = '__cookie_test__'
    Cookies.set(testKey, 'test', { expires: 1 })
    const result = Cookies.get(testKey) === 'test'
    Cookies.remove(testKey)
    return result
  } catch {
    return false
  }
}

/**
 * Cookie 設定選項
 * 添加 SameSite 和 Secure 以提高相容性
 */
function getCookieOptions(days: number): Cookies.CookieAttributes {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  return {
    expires: days,
    sameSite: 'lax',
    secure: isSecure,
    path: '/',
  }
}

/**
 * 通用 token 儲存函數
 */
function _setToken(token: string, cookieKey: string, lsKey: string, days: number): void {
  // 優先嘗試 cookie
  try {
    Cookies.set(cookieKey, token, getCookieOptions(days))
  } catch (e) {
    console.warn(`Failed to set token in cookie (${cookieKey}):`, e)
  }

  // 同時儲存到 localStorage 作為備用
  if (isLocalStorageAvailable()) {
    try {
      const data = {
        token,
        expiresAt: Date.now() + days * ONE_DAY_IN_MS,
      }
      window.localStorage.setItem(lsKey, JSON.stringify(data))
    } catch (e) {
      console.warn(`Failed to set token in localStorage (${lsKey}):`, e)
    }
  }
}

/**
 * 通用 token 取得函數
 * 優先從 cookie 取得，若失敗則從 localStorage 取得
 */
function _getToken(cookieKey: string, lsKey: string, defaultDays: number): string | undefined {
  // 嘗試從 cookie 取得
  const cookieToken = Cookies.get(cookieKey)
  if (cookieToken) return cookieToken

  // Cookie 取不到，嘗試從 localStorage 取得
  if (isLocalStorageAvailable()) {
    try {
      const stored = window.localStorage.getItem(lsKey)
      if (stored) {
        const data = JSON.parse(stored)
        // 檢查是否過期且資料格式正確
        if (
          data &&
          typeof data.token === 'string' &&
          typeof data.expiresAt === 'number' &&
          data.expiresAt > Date.now()
        ) {
          const localToken: string = data.token
          // 嘗試同步回 cookie (可能下次就能用了)
          if (isCookieAvailable()) {
            Cookies.set(cookieKey, localToken, getCookieOptions(defaultDays))
          }
          return localToken
        } else {
          // 已過期或無效，清除
          window.localStorage.removeItem(lsKey)
        }
      }
    } catch (e) {
      console.warn(`Failed to get token from localStorage (${lsKey}):`, e)
    }
  }

  return undefined
}

/**
 * 儲存 access token
 * @param token - access token
 * @param days - 過期時間（天數），預設為 1 天
 */
export function setAccessToken(token: string, days: number = DEFAULT_ACCESS_TOKEN_DAYS): void {
  _setToken(token, AUTH_TOKEN_KEY, LS_ACCESS_TOKEN_KEY, days)
}

/**
 * 儲存 refresh token
 * @param token - refresh token
 * @param days - 過期時間（天數），預設為 7 天
 */
export function setRefreshToken(token: string, days: number = DEFAULT_REFRESH_TOKEN_DAYS): void {
  _setToken(token, AUTH_REFRESH_TOKEN_KEY, LS_REFRESH_TOKEN_KEY, days)
}

/**
 * 取得 access token
 * 優先從 cookie 取得，若失敗則從 localStorage 取得
 */
export function getAccessToken(): string | undefined {
  return _getToken(AUTH_TOKEN_KEY, LS_ACCESS_TOKEN_KEY, DEFAULT_ACCESS_TOKEN_DAYS)
}

/**
 * 取得 refresh token
 * 優先從 cookie 取得，若失敗則從 localStorage 取得
 */
export function getRefreshToken(): string | undefined {
  return _getToken(AUTH_REFRESH_TOKEN_KEY, LS_REFRESH_TOKEN_KEY, DEFAULT_REFRESH_TOKEN_DAYS)
}

/**
 * 移除所有 tokens
 */
export function removeTokens(): void {
  // 移除 cookies
  try {
    Cookies.remove(AUTH_TOKEN_KEY, { path: '/' })
    Cookies.remove(AUTH_REFRESH_TOKEN_KEY, { path: '/' })
  } catch (e) {
    console.warn('Failed to remove tokens from cookies:', e)
  }

  // 移除 localStorage
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.removeItem(LS_ACCESS_TOKEN_KEY)
      window.localStorage.removeItem(LS_REFRESH_TOKEN_KEY)
      // 同時清除 Zustand auth store 的 persist storage
      // 避免 isAuthenticated 狀態殘留導致重新導向循環
      window.localStorage.removeItem('auth-storage')
    } catch (e) {
      console.warn('Failed to remove tokens from localStorage:', e)
    }
  }
}

/**
 * 儲存 tokens (一次儲存 access 和 refresh)
 * @param accessToken - access token
 * @param refreshToken - refresh token
 * @param accessDays - access token 過期時間（天數），預設為 1 天
 * @param refreshDays - refresh token 過期時間（天數），預設為 7 天
 */
export function setTokens(
  accessToken: string,
  refreshToken: string,
  accessDays: number = DEFAULT_ACCESS_TOKEN_DAYS,
  refreshDays: number = DEFAULT_REFRESH_TOKEN_DAYS
): void {
  setAccessToken(accessToken, accessDays)
  setRefreshToken(refreshToken, refreshDays)
}
