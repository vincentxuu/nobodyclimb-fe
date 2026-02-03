import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import {
  ProfileData,
  AdvancedStories,
  SocialLinks,
  initialProfileData,
  initialAdvancedStories,
  initialSocialLinks,
} from './types'
import { useAuthStore } from '../../store/authStore'
import { biographyService } from '@/lib/biographyService'
import type { User, Biography } from '@nobodyclimb/types'

interface ProfileContextType {
  profileData: ProfileData
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
  isLoading: boolean
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

/**
 * 解析 social_links JSON 字串
 */
function parseSocialLinks(socialLinksJson: string | null | undefined): SocialLinks {
  if (!socialLinksJson) {
    return initialSocialLinks
  }
  try {
    const parsed = JSON.parse(socialLinksJson)
    return {
      instagram: parsed.instagram || '',
      youtube_channel: parsed.youtube_channel || '',
    }
  } catch {
    return initialSocialLinks
  }
}

/**
 * 將 Biography 資料映射到 ProfileData 格式
 */
function mapBiographyToProfileData(biography: Biography | null): Partial<ProfileData> {
  if (!biography) {
    return {}
  }

  const socialLinks = parseSocialLinks(biography.social_links as string)

  // 映射進階故事
  const advancedStories: AdvancedStories = {
    // A. 成長與突破
    memorable_moment: (biography as Record<string, unknown>).memorable_moment as string || '',
    biggest_challenge: (biography as Record<string, unknown>).biggest_challenge as string || '',
    breakthrough_story: (biography as Record<string, unknown>).breakthrough_story as string || '',
    first_outdoor: (biography as Record<string, unknown>).first_outdoor as string || '',
    first_grade: (biography as Record<string, unknown>).first_grade as string || '',
    frustrating_climb: (biography as Record<string, unknown>).frustrating_climb as string || '',
    // B. 心理與哲學
    fear_management: (biography as Record<string, unknown>).fear_management as string || '',
    climbing_lesson: (biography as Record<string, unknown>).climbing_lesson as string || '',
    failure_perspective: (biography as Record<string, unknown>).failure_perspective as string || '',
    flow_moment: (biography as Record<string, unknown>).flow_moment as string || '',
    life_balance: (biography as Record<string, unknown>).life_balance as string || '',
    unexpected_gain: (biography as Record<string, unknown>).unexpected_gain as string || '',
    // C. 社群與連結
    climbing_mentor: (biography as Record<string, unknown>).climbing_mentor as string || '',
    climbing_partner: (biography as Record<string, unknown>).climbing_partner as string || '',
    funny_moment: (biography as Record<string, unknown>).funny_moment as string || '',
    favorite_spot: (biography as Record<string, unknown>).favorite_spot as string || '',
    advice_to_group: (biography as Record<string, unknown>).advice_to_group as string || '',
    climbing_space: (biography as Record<string, unknown>).climbing_space as string || '',
    // D. 實用分享
    injury_recovery: (biography as Record<string, unknown>).injury_recovery as string || '',
    memorable_route: (biography as Record<string, unknown>).memorable_route as string || '',
    training_method: (biography as Record<string, unknown>).training_method as string || '',
    effective_practice: (biography as Record<string, unknown>).effective_practice as string || '',
    technique_tip: (biography as Record<string, unknown>).technique_tip as string || '',
    gear_choice: (biography as Record<string, unknown>).gear_choice as string || '',
    // E. 夢想與探索
    dream_climb: (biography as Record<string, unknown>).dream_climb as string || '',
    climbing_trip: (biography as Record<string, unknown>).climbing_trip as string || '',
    bucket_list_story: (biography as Record<string, unknown>).bucket_list_story as string || '',
    climbing_goal: (biography as Record<string, unknown>).climbing_goal as string || '',
    climbing_style: (biography as Record<string, unknown>).climbing_style as string || '',
    climbing_inspiration: (biography as Record<string, unknown>).climbing_inspiration as string || '',
    // F. 生活整合
    life_outside_climbing: (biography as Record<string, unknown>).life_outside_climbing as string || '',
  }

  return {
    biographyId: biography.id || null,
    name: biography.name || '',
    title: biography.title || '',
    startYear: biography.climbing_start_year || '',
    frequentGyms: biography.frequent_locations || '',
    favoriteRouteType: biography.favorite_route_type || '',
    climbingReason: biography.climbing_origin || '',
    climbingMeaning: biography.climbing_meaning || '',
    climbingBucketList: (biography as Record<string, unknown>).bucket_list_story as string || '',
    adviceForBeginners: biography.advice_to_self || '',
    advancedStories,
    socialLinks,
    isPublic: Number(biography.is_public) === 1,
    avatarUrl: biography.avatar_url || null,
    coverImageUrl: biography.cover_image || null,
  }
}

/**
 * 將 authStore 中的 User 資料映射到 ProfileData 格式
 */
function mapUserToProfileData(user: User | null): ProfileData {
  if (!user) {
    return initialProfileData
  }

  // 嘗試解析 bio 中的 JSON 資料
  let bioData: {
    climbingReason?: string
    climbingMeaning?: string
    climbingBucketList?: string
    messageToBeginners?: string
    isPublic?: boolean
  } = {}

  if (user.bio) {
    try {
      bioData = JSON.parse(user.bio)
    } catch {
      // 如果 bio 不是 JSON，當作純文字處理
      bioData = { climbingReason: user.bio }
    }
  }

  return {
    biographyId: null,
    name: user.displayName || user.username || '',
    title: '',
    startYear: '',
    frequentGyms: '',
    favoriteRouteType: '',
    climbingReason: bioData.climbingReason || '',
    climbingMeaning: bioData.climbingMeaning || '',
    climbingBucketList: bioData.climbingBucketList || '',
    adviceForBeginners: bioData.messageToBeginners || '',
    advancedStories: initialAdvancedStories,
    socialLinks: initialSocialLinks,
    isPublic: bioData.isPublic ?? true,
    avatarUrl: user.avatar || null,
    coverImageUrl: null,
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const [profileData, setProfileData] = useState<ProfileData>(initialProfileData)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfileData = async () => {
    setIsLoading(true)

    // 首先從 user 映射基本資料
    const userMappedData = mapUserToProfileData(user)
    setProfileData(userMappedData)

    // 如果用戶已登入，嘗試從 biography API 獲取完整資料
    if (user) {
      try {
        const response = await biographyService.getMyBiography()
        if (response.success && response.data) {
          const biographyData = mapBiographyToProfileData(response.data)
          setProfileData((prev) => ({
            ...prev,
            ...biographyData,
          }))
        }
      } catch (error) {
        console.error('Failed to load biography:', error)
        // 失敗時保持使用 user 映射的資料
      }
    }

    setIsLoading(false)
  }

  // 當 authStore 中的 user 變化時，更新 profileData
  useEffect(() => {
    loadProfileData()
  }, [user])

  const refreshProfile = async () => {
    await loadProfileData()
  }

  return (
    <ProfileContext.Provider
      value={{
        profileData,
        setProfileData,
        isEditing,
        setIsEditing,
        isLoading,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
