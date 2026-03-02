/**
 * 使用者相關類型定義
 * 統一前後端使用者型別
 */

/**
 * 前端使用者介面 (camelCase)
 */
export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  avatarStyle?: string
  bio?: string
  createdAt: Date
  updatedAt?: Date
  displayName?: string
  authProvider?: 'local' | 'google'
  socialLinks?: {
    instagram?: string
    facebook?: string
    twitter?: string
    website?: string
  }
}

/**
 * 後端 User 資料格式 (snake_case)
 * 對應資料庫 users 表
 */
export interface BackendUser {
  id: string
  email: string
  username: string
  password_hash?: string | null
  display_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  role: 'user' | 'admin' | 'moderator'
  is_active?: number
  email_verified?: number
  google_id?: string | null
  auth_provider?: 'local' | 'google'
  created_at: string
  updated_at?: string
  last_active_at?: string | null
}

/**
 * 將後端 User 格式轉換為前端格式
 */
export function mapBackendUserToUser(backendUser: BackendUser): User {
  return {
    id: backendUser.id,
    email: backendUser.email,
    username: backendUser.username,
    displayName: backendUser.display_name ?? undefined,
    avatar: backendUser.avatar_url ?? undefined,
    bio: backendUser.bio ?? undefined,
    authProvider: backendUser.auth_provider,
    createdAt: new Date(backendUser.created_at),
  }
}
