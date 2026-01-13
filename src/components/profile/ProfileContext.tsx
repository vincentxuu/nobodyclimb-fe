'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { ProfileData, ProfileImage, ImageLayout, initialProfileData } from './types'
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
 * 解析 gallery_images JSON 字串
 */
function parseGalleryImages(galleryImagesJson: string | null | undefined): {
  images: ProfileImage[]
  layout: ImageLayout
} {
  if (!galleryImagesJson) {
    return { images: [], layout: 'double' }
  }
  try {
    const parsed = JSON.parse(galleryImagesJson)
    if (typeof parsed !== 'object' || parsed === null) {
      return { images: [], layout: 'double' }
    }
    return {
      images: Array.isArray(parsed.images) ? parsed.images : [],
      layout: parsed.layout || 'double',
    }
  } catch {
    return { images: [], layout: 'double' }
  }
}

/**
 * 將 Biography 資料映射到 ProfileData 格式
 */
function mapBiographyToProfileData(biography: Biography | null): Partial<ProfileData> {
  if (!biography) {
    return {}
  }

  const { images, layout } = parseGalleryImages(biography.gallery_images)

  return {
    name: biography.name || '',
    startYear: biography.climbing_start_year || '',
    frequentGyms: biography.frequent_locations || '',
    favoriteRouteType: biography.favorite_route_type || '',
    climbingReason: biography.climbing_origin || '',
    climbingMeaning: biography.climbing_meaning || '',
    climbingBucketList: biography.bucket_list_story || '',
    adviceForBeginners: biography.advice_to_self || '',
    isPublic: Number(biography.is_public) === 1,
    images,
    imageLayout: layout,
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
    name: user.displayName || user.username || '',
    startYear: user.climbingStartYear || '',
    frequentGyms: user.frequentGym || '',
    favoriteRouteType: user.favoriteRouteType || '',
    climbingReason: bioData.climbingReason || '',
    climbingMeaning: bioData.climbingMeaning || '',
    climbingBucketList: bioData.climbingBucketList || '',
    adviceForBeginners: bioData.messageToBeginners || '',
    isPublic: bioData.isPublic ?? true,
    images: [],
    imageLayout: 'double',
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
