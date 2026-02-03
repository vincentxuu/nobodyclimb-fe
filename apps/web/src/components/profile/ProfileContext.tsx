'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import {
  ProfileData,
  AdvancedStories,
  SocialLinks,
  initialProfileData,
  initialAdvancedStories,
  initialSocialLinks,
} from './types'
import { useAuthStore } from '@/store/authStore'
import { User, Biography } from '@/lib/types'
import { biographyService } from '@/lib/api/services'

interface ProfileContextType {
  profileData: ProfileData
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
  isLoading: boolean
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

  const socialLinks = parseSocialLinks(biography.social_links)

  // 映射進階故事
  const advancedStories: AdvancedStories = {
    // A. 成長與突破
    memorable_moment: biography.memorable_moment || '',
    biggest_challenge: biography.biggest_challenge || '',
    breakthrough_story: biography.breakthrough_story || '',
    first_outdoor: biography.first_outdoor || '',
    first_grade: biography.first_grade || '',
    frustrating_climb: biography.frustrating_climb || '',
    // B. 心理與哲學
    fear_management: biography.fear_management || '',
    climbing_lesson: biography.climbing_lesson || '',
    failure_perspective: biography.failure_perspective || '',
    flow_moment: biography.flow_moment || '',
    life_balance: biography.life_balance || '',
    unexpected_gain: biography.unexpected_gain || '',
    // C. 社群與連結
    climbing_mentor: biography.climbing_mentor || '',
    climbing_partner: biography.climbing_partner || '',
    funny_moment: biography.funny_moment || '',
    favorite_spot: biography.favorite_spot || '',
    advice_to_group: biography.advice_to_group || '',
    climbing_space: biography.climbing_space || '',
    // D. 實用分享
    injury_recovery: biography.injury_recovery || '',
    memorable_route: biography.memorable_route || '',
    training_method: biography.training_method || '',
    effective_practice: biography.effective_practice || '',
    technique_tip: biography.technique_tip || '',
    gear_choice: biography.gear_choice || '',
    // E. 夢想與探索
    dream_climb: biography.dream_climb || '',
    climbing_trip: biography.climbing_trip || '',
    bucket_list_story: biography.bucket_list_story || '',
    climbing_goal: biography.climbing_goal || '',
    climbing_style: biography.climbing_style || '',
    climbing_inspiration: biography.climbing_inspiration || '',
    // F. 生活整合
    life_outside_climbing: biography.life_outside_climbing || '',
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
    climbingBucketList: biography.bucket_list_story || '',
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
 * bio 欄位可能包含 JSON 格式的額外資料
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
    // 使用 Google 頭像作為人物誌頭像的備用
    avatarUrl: user.avatar || null,
    coverImageUrl: null,
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const [profileData, setProfileData] = useState<ProfileData>(initialProfileData)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 當 authStore 中的 user 變化時，更新 profileData 並從 biography API 獲取完整資料
  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true)

      // 首先從 user 映射基本資料
      const userMappedData = mapUserToProfileData(user)
      setProfileData(userMappedData)

      // 如果用戶已登入，嘗試從 biography API 獲取完整資料（包括圖片）
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

    loadProfileData()
  }, [user])

  return (
    <ProfileContext.Provider value={{ profileData, setProfileData, isEditing, setIsEditing, isLoading }}>
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
