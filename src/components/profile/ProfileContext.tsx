'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { ProfileData, initialProfileData } from './types'
import { useAuthStore } from '@/store/authStore'
import { User } from '@/lib/types'

interface ProfileContextType {
  profileData: ProfileData
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
  isLoading: boolean
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

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
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const [profileData, setProfileData] = useState<ProfileData>(initialProfileData)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 當 authStore 中的 user 變化時，更新 profileData
  useEffect(() => {
    const mappedData = mapUserToProfileData(user)
    setProfileData(mappedData)
    setIsLoading(false)
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
