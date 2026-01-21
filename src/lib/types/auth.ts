/**
 * 認證相關類型定義
 */

import type { User } from './user'

/**
 * 認證狀態介面
 */
export interface AuthState {
  user: User | null
  isLoggedIn: boolean
  token: string | null
  loading: boolean
  error: string | null
}

/**
 * 後端認證 Token 回應介面
 */
export interface AuthTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  is_new_user?: boolean // Only returned by Google auth
}

/**
 * 後端 Refresh Token 回應介面
 */
export interface RefreshTokenResponse {
  access_token: string
  expires_in: number
}

/**
 * 登入表單介面
 */
export interface LoginFormData {
  email: string
  password: string
  remember?: boolean
}

/**
 * 註冊表單介面
 */
export interface RegisterFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

/**
 * 用戶資料更新表單介面
 */
export interface UpdateProfileFormData {
  username?: string
  email?: string
  bio?: string
  currentPassword?: string
  newPassword?: string
  confirmNewPassword?: string
}

/**
 * 認證 Session 介面
 */
export interface AuthSession {
  user: User
  expires: string
}
