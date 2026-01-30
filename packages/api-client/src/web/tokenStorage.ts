/**
 * Web 平台的 Token 儲存實作
 *
 * 解決 Android WebView 和某些 Android 瀏覽器中 cookie 不穩定的問題
 * 同時使用 cookie 和 localStorage 作為備用方案
 */
import Cookies from 'js-cookie'
import { AUTH_KEYS } from '@nobodyclimb/constants'
import type { TokenStorage } from '../core/types'

// 時間常數
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000

// 預設過期時間（天數）
const DEFAULT_ACCESS_TOKEN_DAYS = 1
const DEFAULT_REFRESH_TOKEN_DAYS = 7

// localStorage keys (加上前綴以區分)
const LS_ACCESS_TOKEN_KEY = `ls_${AUTH_KEYS.ACCESS_TOKEN}`
const LS_REFRESH_TOKEN_KEY = `ls_${AUTH_KEYS.REFRESH_TOKEN}`

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
        if (
          data &&
          typeof data.token === 'string' &&
          typeof data.expiresAt === 'number' &&
          data.expiresAt > Date.now()
        ) {
          const localToken: string = data.token
          // 嘗試同步回 cookie
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
 * 建立 Web 平台的 Token Storage 實作
 */
export function createWebTokenStorage(): TokenStorage {
  return {
    getAccessToken(): string | undefined {
      return _getToken(AUTH_KEYS.ACCESS_TOKEN, LS_ACCESS_TOKEN_KEY, DEFAULT_ACCESS_TOKEN_DAYS)
    },

    setAccessToken(token: string, days: number = DEFAULT_ACCESS_TOKEN_DAYS): void {
      _setToken(token, AUTH_KEYS.ACCESS_TOKEN, LS_ACCESS_TOKEN_KEY, days)
    },

    getRefreshToken(): string | undefined {
      return _getToken(AUTH_KEYS.REFRESH_TOKEN, LS_REFRESH_TOKEN_KEY, DEFAULT_REFRESH_TOKEN_DAYS)
    },

    setRefreshToken(token: string, days: number = DEFAULT_REFRESH_TOKEN_DAYS): void {
      _setToken(token, AUTH_KEYS.REFRESH_TOKEN, LS_REFRESH_TOKEN_KEY, days)
    },

    removeTokens(): void {
      // 移除 cookies
      try {
        Cookies.remove(AUTH_KEYS.ACCESS_TOKEN, { path: '/' })
        Cookies.remove(AUTH_KEYS.REFRESH_TOKEN, { path: '/' })
      } catch (e) {
        console.warn('Failed to remove tokens from cookies:', e)
      }

      // 移除 localStorage
      if (isLocalStorageAvailable()) {
        try {
          window.localStorage.removeItem(LS_ACCESS_TOKEN_KEY)
          window.localStorage.removeItem(LS_REFRESH_TOKEN_KEY)
        } catch (e) {
          console.warn('Failed to remove tokens from localStorage:', e)
        }
      }
    },

    setTokens(
      accessToken: string,
      refreshToken: string,
      accessDays: number = DEFAULT_ACCESS_TOKEN_DAYS,
      refreshDays: number = DEFAULT_REFRESH_TOKEN_DAYS
    ): void {
      this.setAccessToken(accessToken, accessDays)
      this.setRefreshToken(refreshToken, refreshDays)
    },
  }
}
