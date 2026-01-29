/**
 * 使用者相關類型定義
 */

/**
 * 使用者介面
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
 */
export interface BackendUser {
  id: string
  email: string
  username: string
  display_name?: string
  avatar_url?: string
  bio?: string
  role: 'user' | 'admin' | 'moderator'
  is_active?: number
  email_verified?: number
  google_id?: string
  auth_provider?: 'local' | 'google'
  created_at: string
  updated_at?: string
}

/**
 * 將後端 User 格式轉換為前端格式
 */
export function mapBackendUserToUser(backendUser: BackendUser): User {
  return {
    id: backendUser.id,
    email: backendUser.email,
    username: backendUser.username,
    displayName: backendUser.display_name,
    avatar: backendUser.avatar_url,
    bio: backendUser.bio,
    authProvider: backendUser.auth_provider,
    createdAt: new Date(backendUser.created_at),
  }
}
