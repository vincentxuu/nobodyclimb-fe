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
 * JWT Payload 介面
 */
export interface JwtPayload {
  sub: string
  email: string
  role: string
  username?: string
  display_name?: string | null
  iat: number
  exp: number
}

/**
 * 認證 Token 介面
 */
export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
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
 * 登入請求介面 (後端)
 */
export interface LoginRequest {
  email: string
  password: string
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
 * 註冊請求介面 (後端)
 */
export interface RegisterRequest {
  email: string
  username: string
  password: string
  display_name?: string
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

/**
 * Google OAuth 請求
 */
export interface GoogleAuthRequest {
  credential: string
}

/**
 * Google Token Payload
 */
export interface GoogleTokenPayload {
  iss: string
  azp: string
  aud: string
  sub: string
  email: string
  email_verified: boolean
  name?: string
  picture?: string
  given_name?: string
  family_name?: string
  iat: number
  exp: number
}
