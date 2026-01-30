/**
 * 認證相關 Zod Schemas
 */
import { z } from 'zod'

/**
 * 有效的推薦來源
 */
export const REFERRAL_SOURCES = [
  'instagram',
  'facebook',
  'youtube',
  'google',
  'friend',
  'event',
  'organic',
  'other',
] as const

export type ReferralSource = (typeof REFERRAL_SOURCES)[number]

/**
 * 註冊 Schema
 */
export const registerSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  username: z
    .string()
    .min(3, '使用者名稱至少需要 3 個字元')
    .max(30, '使用者名稱最多 30 個字元')
    .regex(/^[a-zA-Z0-9_]+$/, '只能使用英文、數字和底線'),
  password: z.string().min(8, '密碼至少需要 8 個字元'),
  display_name: z.string().optional(),
  referral_source: z.enum(REFERRAL_SOURCES).optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>

/**
 * 登入 Schema
 */
export const loginSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  password: z.string().min(1, '請輸入密碼'),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Google OAuth Schema
 */
export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
  referral_source: z.enum(REFERRAL_SOURCES).optional(),
})

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>

/**
 * 忘記密碼 Schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件'),
  password: z.string().min(8, '密碼至少需要 8 個字元'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/**
 * 更新個人資料 Schema
 */
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, '使用者名稱至少需要 3 個字元')
    .max(30, '使用者名稱最多 30 個字元')
    .regex(/^[a-zA-Z0-9_]+$/, '只能使用英文、數字和底線')
    .optional(),
  display_name: z.string().max(50, '顯示名稱最多 50 個字元').optional(),
  bio: z.string().max(500, '自我介紹最多 500 個字').optional(),
  avatar_url: z.string().url('請輸入有效的網址').optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

/**
 * Refresh Token Schema
 */
export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
})

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
