/**
 * Token 儲存工具
 *
 * 解決 Android WebView 和某些 Android 瀏覽器中 cookie 不穩定的問題
 * 同時使用 cookie 和 localStorage 作為備用方案
 */
import Cookies from 'js-cookie'
import { AUTH_TOKEN_KEY, AUTH_REFRESH_TOKEN_KEY } from '../constants'

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
 * 儲存 access token
 */
export function setAccessToken(token: string): void {
  // 優先嘗試 cookie
  try {
    Cookies.set(AUTH_TOKEN_KEY, token, getCookieOptions(1))
  } catch (e) {
    console.warn('Failed to set access token in cookie:', e)
  }

  // 同時儲存到 localStorage 作為備用
  if (isLocalStorageAvailable()) {
    try {
      const data = {
        token,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 1 天
      }
      window.localStorage.setItem(LS_ACCESS_TOKEN_KEY, JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to set access token in localStorage:', e)
    }
  }
}

/**
 * 儲存 refresh token
 */
export function setRefreshToken(token: string): void {
  // 優先嘗試 cookie
  try {
    Cookies.set(AUTH_REFRESH_TOKEN_KEY, token, getCookieOptions(7))
  } catch (e) {
    console.warn('Failed to set refresh token in cookie:', e)
  }

  // 同時儲存到 localStorage 作為備用
  if (isLocalStorageAvailable()) {
    try {
      const data = {
        token,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 天
      }
      window.localStorage.setItem(LS_REFRESH_TOKEN_KEY, JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to set refresh token in localStorage:', e)
    }
  }
}

/**
 * 取得 access token
 * 優先從 cookie 取得，若失敗則從 localStorage 取得
 */
export function getAccessToken(): string | undefined {
  // 嘗試從 cookie 取得
  const cookieToken = Cookies.get(AUTH_TOKEN_KEY)
  if (cookieToken) return cookieToken

  // Cookie 取不到，嘗試從 localStorage 取得
  if (isLocalStorageAvailable()) {
    try {
      const stored = window.localStorage.getItem(LS_ACCESS_TOKEN_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        // 檢查是否過期
        if (data && typeof data.token === 'string' && typeof data.expiresAt === 'number' && data.expiresAt > Date.now()) {
          const localToken: string = data.token
          // 嘗試同步回 cookie (可能下次就能用了)
          if (isCookieAvailable()) {
            Cookies.set(AUTH_TOKEN_KEY, localToken, getCookieOptions(1))
          }
          return localToken
        } else {
          // 已過期，清除
          window.localStorage.removeItem(LS_ACCESS_TOKEN_KEY)
        }
      }
    } catch (e) {
      console.warn('Failed to get access token from localStorage:', e)
    }
  }

  return undefined
}

/**
 * 取得 refresh token
 * 優先從 cookie 取得，若失敗則從 localStorage 取得
 */
export function getRefreshToken(): string | undefined {
  // 嘗試從 cookie 取得
  const cookieToken = Cookies.get(AUTH_REFRESH_TOKEN_KEY)
  if (cookieToken) return cookieToken

  // Cookie 取不到，嘗試從 localStorage 取得
  if (isLocalStorageAvailable()) {
    try {
      const stored = window.localStorage.getItem(LS_REFRESH_TOKEN_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        // 檢查是否過期
        if (data.expiresAt > Date.now() && typeof data.token === 'string') {
          const localToken: string = data.token
          // 嘗試同步回 cookie
          if (isCookieAvailable()) {
            Cookies.set(AUTH_REFRESH_TOKEN_KEY, localToken, getCookieOptions(7))
          }
          return localToken
        } else {
          // 已過期或無效，清除
          window.localStorage.removeItem(LS_REFRESH_TOKEN_KEY)
        }
      }
    } catch (e) {
      console.warn('Failed to get refresh token from localStorage:', e)
    }
  }

  return undefined
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
    } catch (e) {
      console.warn('Failed to remove tokens from localStorage:', e)
    }
  }
}

/**
 * 儲存 tokens (一次儲存 access 和 refresh)
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  setAccessToken(accessToken)
  setRefreshToken(refreshToken)
}
