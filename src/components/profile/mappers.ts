/**
 * Profile 資料映射工具函式
 *
 * 集中管理前端 ProfileData 與後端 API 模型之間的映射邏輯
 */

import { ProfileData, SocialLinks, AdvancedStories } from './types'

// ============================================================================
// 類型定義
// ============================================================================

/** 後端 Biography API 輸入格式 */
export interface BiographyApiInput {
  name?: string
  title?: string
  avatar_url?: string
  cover_image?: string
  climbing_start_year?: string
  frequent_locations?: string
  favorite_route_type?: string
  climbing_origin?: string
  climbing_meaning?: string
  climbing_bucket_list?: string
  advice_to_self?: string
  social_links?: string
  is_public?: number
  // 進階故事欄位
  memorable_moment?: string
  biggest_challenge?: string
  breakthrough_story?: string
  first_outdoor?: string
  first_grade?: string
  frustrating_climb?: string
  fear_management?: string
  climbing_lesson?: string
  failure_perspective?: string
  flow_moment?: string
  life_balance?: string
  unexpected_gain?: string
  climbing_mentor?: string
  climbing_partner?: string
  funny_moment?: string
  favorite_spot?: string
  advice_to_group?: string
  climbing_space?: string
  injury_recovery?: string
  memorable_route?: string
  training_method?: string
  effective_practice?: string
  technique_tip?: string
  gear_choice?: string
  dream_climb?: string
  climbing_trip?: string
  bucket_list_story?: string
  climbing_goal?: string
  climbing_style?: string
  climbing_inspiration?: string
  life_outside_climbing?: string
}

// ============================================================================
// 欄位映射常數
// ============================================================================

/** 核心故事欄位映射：API 欄位名 -> 前端欄位名 */
export const CORE_STORY_FIELD_MAP: Record<string, keyof ProfileData> = {
  climbing_origin: 'climbingReason',
  climbing_meaning: 'climbingMeaning',
  climbing_bucket_list: 'climbingBucketList',
  advice_to_self: 'adviceForBeginners',
} as const

/** 基本欄位映射：前端欄位名 -> API 欄位名 */
export const PROFILE_TO_API_FIELD_MAP: Record<string, string> = {
  name: 'name',
  title: 'title',
  avatarUrl: 'avatar_url',
  coverImageUrl: 'cover_image',
  startYear: 'climbing_start_year',
  frequentGyms: 'frequent_locations',
  favoriteRouteType: 'favorite_route_type',
  climbingReason: 'climbing_origin',
  climbingMeaning: 'climbing_meaning',
  climbingBucketList: 'climbing_bucket_list',
  adviceForBeginners: 'advice_to_self',
} as const

/** API 欄位映射：API 欄位名 -> 前端欄位名 */
export const API_TO_PROFILE_FIELD_MAP: Record<string, keyof ProfileData> = {
  name: 'name',
  title: 'title',
  avatar_url: 'avatarUrl',
  cover_image: 'coverImageUrl',
  climbing_start_year: 'startYear',
  frequent_locations: 'frequentGyms',
  favorite_route_type: 'favoriteRouteType',
  climbing_origin: 'climbingReason',
  climbing_meaning: 'climbingMeaning',
  climbing_bucket_list: 'climbingBucketList',
  advice_to_self: 'adviceForBeginners',
} as const

// ============================================================================
// 映射函式
// ============================================================================

/**
 * 將前端 ProfileData 轉換為後端 API 格式
 *
 * @param data - 前端 ProfileData
 * @param options - 選項
 * @returns 後端 API 輸入格式
 */
export function mapProfileDataToApi(
  data: ProfileData,
  options: { includeAdvancedStories?: boolean } = {}
): BiographyApiInput {
  const { includeAdvancedStories = true } = options

  const apiData: BiographyApiInput = {
    name: data.name,
    title: data.title || undefined,
    avatar_url: data.avatarUrl || undefined,
    cover_image: data.coverImageUrl || undefined,
    climbing_start_year: data.startYear,
    frequent_locations: data.frequentGyms,
    favorite_route_type: data.favoriteRouteType,
    climbing_origin: data.climbingReason,
    climbing_meaning: data.climbingMeaning,
    climbing_bucket_list: data.climbingBucketList,
    advice_to_self: data.adviceForBeginners,
    social_links: JSON.stringify(data.socialLinks),
    is_public: data.isPublic ? 1 : 0,
  }

  // 展開進階故事欄位
  if (includeAdvancedStories && data.advancedStories) {
    Object.assign(apiData, data.advancedStories)
  }

  return apiData
}

/**
 * 將單一前端欄位轉換為 API 格式
 *
 * @param field - 前端欄位名
 * @param value - 欄位值
 * @param profileData - 完整的 ProfileData（用於 socialLinks）
 * @returns API 格式的資料物件
 */
export function mapFieldToApi(
  field: string,
  value: string | boolean,
  profileData?: ProfileData
): Record<string, unknown> {
  // 處理 socialLinks 巢狀欄位
  if (field.startsWith('socialLinks.')) {
    const socialField = field.replace('socialLinks.', '')
    const newSocialLinks = {
      ...(profileData?.socialLinks || { instagram: '', youtube_channel: '' }),
      [socialField]: value as string,
    }
    return { social_links: JSON.stringify(newSocialLinks) }
  }

  // 處理布林值（isPublic）
  if (field === 'isPublic') {
    return { is_public: value ? 1 : 0 }
  }

  // 處理一般欄位
  const apiField = PROFILE_TO_API_FIELD_MAP[field] || field
  return { [apiField]: value }
}

/**
 * 取得故事欄位的值
 *
 * @param profileData - ProfileData
 * @param field - API 格式的故事欄位名
 * @returns 故事內容
 */
export function getStoryFieldValue(profileData: ProfileData, field: string): string {
  // 檢查是否為核心故事欄位
  const coreField = CORE_STORY_FIELD_MAP[field]
  if (coreField) {
    return (profileData[coreField] as string) || ''
  }

  // 檢查進階故事欄位
  const advancedValue = profileData.advancedStories?.[field as keyof AdvancedStories]
  if (advancedValue) {
    return advancedValue
  }

  return ''
}

/**
 * 更新本地 ProfileData 的故事欄位
 *
 * @param profileData - 原始 ProfileData
 * @param field - API 格式的故事欄位名
 * @param value - 新值
 * @returns 更新後的 ProfileData
 */
export function updateStoryField(
  profileData: ProfileData,
  field: string,
  value: string
): ProfileData {
  // 檢查是否為核心故事欄位
  const coreField = CORE_STORY_FIELD_MAP[field]
  if (coreField) {
    return {
      ...profileData,
      [coreField]: value,
    }
  }

  // 更新進階故事欄位
  return {
    ...profileData,
    advancedStories: {
      ...profileData.advancedStories,
      [field]: value,
    },
  }
}

/**
 * 更新本地 ProfileData 的一般欄位
 *
 * @param profileData - 原始 ProfileData
 * @param field - 前端欄位名（可能包含 socialLinks. 前綴）
 * @param value - 新值
 * @returns 更新後的 ProfileData
 */
export function updateProfileField(
  profileData: ProfileData,
  field: string,
  value: string | boolean | SocialLinks
): ProfileData {
  // 處理 socialLinks 巢狀欄位
  if (field.startsWith('socialLinks.')) {
    const socialField = field.replace('socialLinks.', '')
    return {
      ...profileData,
      socialLinks: {
        ...profileData.socialLinks,
        [socialField]: value as string,
      },
    }
  }

  // 處理一般欄位
  return {
    ...profileData,
    [field]: value,
  }
}

/**
 * 解析 social_links JSON 字串
 *
 * @param socialLinksJson - JSON 字串或物件
 * @returns SocialLinks 物件
 */
export function parseSocialLinks(socialLinksJson: string | object | null): SocialLinks {
  if (!socialLinksJson) {
    return { instagram: '', youtube_channel: '' }
  }

  if (typeof socialLinksJson === 'string') {
    try {
      return JSON.parse(socialLinksJson)
    } catch {
      return { instagram: '', youtube_channel: '' }
    }
  }

  return socialLinksJson as SocialLinks
}
