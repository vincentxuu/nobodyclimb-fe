'use client'

import React, { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import ProfilePageHeader from './ProfilePageHeader'
import ProfileDivider from './ProfileDivider'
import BasicInfoSection from './BasicInfoSection'
import ClimbingInfoSection from './ClimbingInfoSection'
import ClimbingExperienceSection from './ClimbingExperienceSection'
import AdvancedStoriesSection from './AdvancedStoriesSection'
import ClimbingFootprintsSection from './ClimbingFootprintsSection'
import SocialLinksSection from './SocialLinksSection'
import PublicSettingSection from './PublicSettingSection'
import ProfileActionButtons from './ProfileActionButtons'
import BiographyAvatarSection from './BiographyAvatarSection'
import { useProfile } from './ProfileContext'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useToast } from '@/components/ui/use-toast'
import { biographyService } from '@/lib/api/services'
import { AdvancedStories, SocialLinks } from './types'
import { ClimbingLocation } from '@/lib/types'

export default function ProfileContainer() {
  const { profileData, setProfileData, isEditing, setIsEditing } = useProfile()
  const originalDataRef = useRef(profileData)
  const isMobile = useIsMobile()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  // 當進入編輯模式時，儲存原始資料
  const handleStartEdit = () => {
    originalDataRef.current = { ...profileData }
    setIsEditing(true)
  }

  // 處理表單變更
  const handleChange = (field: string, value: string | boolean | SocialLinks) => {
    setProfileData({
      ...profileData,
      [field]: value,
    })
  }

  // 處理頭像上傳
  const handleAvatarUpload = async (file: File) => {
    try {
      const response = await biographyService.uploadImage(file)
      if (response.success && response.data?.url) {
        setProfileData({
          ...profileData,
          avatarUrl: response.data.url,
        })
        toast({
          title: '頭像上傳成功',
        })
      } else {
        throw new Error(response.error || '上傳失敗')
      }
    } catch (error) {
      console.error('頭像上傳失敗:', error)
      toast({
        title: '頭像上傳失敗',
        description: '請稍後再試',
        variant: 'destructive',
      })
      throw error
    }
  }

  // 處理封面照片上傳
  const handleCoverImageUpload = async (file: File) => {
    try {
      const response = await biographyService.uploadImage(file)
      if (response.success && response.data?.url) {
        setProfileData({
          ...profileData,
          coverImageUrl: response.data.url,
        })
        toast({
          title: '封面照片上傳成功',
        })
      } else {
        throw new Error(response.error || '上傳失敗')
      }
    } catch (error) {
      console.error('封面照片上傳失敗:', error)
      toast({
        title: '封面照片上傳失敗',
        description: '請稍後再試',
        variant: 'destructive',
      })
      throw error
    }
  }

  // 處理頭像刪除
  const handleAvatarDelete = () => {
    setProfileData({
      ...profileData,
      avatarUrl: null,
    })
  }

  // 處理封面照片刪除
  const handleCoverImageDelete = () => {
    setProfileData({
      ...profileData,
      coverImageUrl: null,
    })
  }


  // 處理進階故事單一欄位儲存
  const handleAdvancedStorySave = useCallback(
    async (field: string, value: string) => {
      // 更新本地狀態
      setProfileData((prev) => ({
        ...prev,
        advancedStories: {
          ...prev.advancedStories,
          [field]: value,
        },
      }))

      // 立即儲存到後端
      try {
        await biographyService.updateMyBiography({ [field]: value })
        toast({ title: '故事已儲存' })
      } catch {
        toast({ title: '儲存失敗', variant: 'destructive' })
        throw new Error('儲存失敗')
      }
    },
    [setProfileData, toast]
  )

  // 處理進階故事批量儲存
  const handleAdvancedStorySaveAll = useCallback(
    async (changes: Record<string, string>) => {
      // 更新本地狀態
      setProfileData((prev) => ({
        ...prev,
        advancedStories: {
          ...prev.advancedStories,
          ...changes,
        } as AdvancedStories,
      }))

      // 儲存到後端
      try {
        await biographyService.updateMyBiography(changes)
        toast({ title: '所有故事已儲存' })
      } catch {
        toast({ title: '儲存失敗', variant: 'destructive' })
        throw new Error('儲存失敗')
      }
    },
    [setProfileData, toast]
  )

  // 處理攀岩足跡變更
  const handleClimbingLocationsChange = useCallback(
    (locations: ClimbingLocation[]) => {
      setProfileData((prev) => ({
        ...prev,
        climbingLocations: locations,
      }))
    },
    [setProfileData]
  )

  // 處理儲存
  const handleSave = async () => {
    setIsSaving(true)

    try {
      // 序列化攀岩足跡
      const climbingLocationsJson = JSON.stringify(profileData.climbingLocations)

      // 序列化社群連結
      const socialLinksJson = JSON.stringify(profileData.socialLinks)

      // 將前端資料轉換為 API 格式
      const biographyData = {
        name: profileData.name,
        title: profileData.title || undefined,
        avatar_url: profileData.avatarUrl || undefined,
        cover_image: profileData.coverImageUrl || undefined,
        climbing_start_year: profileData.startYear,
        frequent_locations: profileData.frequentGyms,
        favorite_route_type: profileData.favoriteRouteType,
        climbing_origin: profileData.climbingReason,
        climbing_meaning: profileData.climbingMeaning,
        climbing_bucket_list: profileData.climbingBucketList,
        advice_to_self: profileData.adviceForBeginners,
        // 進階故事
        ...profileData.advancedStories,
        // 攀岩足跡
        climbing_locations: climbingLocationsJson,
        // 社群連結
        social_links: socialLinksJson,
        is_public: profileData.isPublic ? 1 : 0,
      }

      // 呼叫 API 保存資料（createBiography 會自動判斷是新增還是更新）
      const response = await biographyService.createBiography(biographyData)

      if (response.success) {
        originalDataRef.current = { ...profileData }
        setIsEditing(false)
        toast({
          title: '儲存成功',
          description: '您的個人資料已成功更新',
        })
      } else {
        throw new Error(response.error || '儲存失敗')
      }
    } catch (error) {
      console.error('儲存失敗:', error)
      toast({
        title: '儲存失敗',
        description: '請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.div
      className="w-full flex-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-sm bg-white p-4 md:p-6 lg:p-8">
        <ProfilePageHeader
          title="我的人物誌"
          isEditing={isEditing}
          onEdit={handleStartEdit}
          isMobile={isMobile}
        />
        <div className="space-y-6">
          <BiographyAvatarSection
            avatarUrl={profileData.avatarUrl}
            coverImageUrl={profileData.coverImageUrl}
            isEditing={isEditing}
            isMobile={isMobile}
            onAvatarUpload={handleAvatarUpload}
            onCoverImageUpload={handleCoverImageUpload}
            onAvatarDelete={handleAvatarDelete}
            onCoverImageDelete={handleCoverImageDelete}
          />
          <ProfileDivider />
          <BasicInfoSection
            name={profileData.name}
            title={profileData.title}
            isEditing={isEditing}
            isMobile={isMobile}
            onChange={handleChange}
          />
          <ProfileDivider />
          <ClimbingInfoSection
            startYear={profileData.startYear}
            frequentGyms={profileData.frequentGyms}
            favoriteRouteType={profileData.favoriteRouteType}
            isEditing={isEditing}
            isMobile={isMobile}
            onChange={handleChange}
          />
          <ProfileDivider />
          <SocialLinksSection
            socialLinks={profileData.socialLinks}
            isEditing={isEditing}
            isMobile={isMobile}
            onChange={handleChange}
          />
          <ProfileDivider />
          <ClimbingExperienceSection
            climbingReason={profileData.climbingReason}
            climbingMeaning={profileData.climbingMeaning}
            adviceForBeginners={profileData.adviceForBeginners}
            isEditing={isEditing}
            isMobile={isMobile}
            onChange={handleChange}
          />
          <ProfileDivider />
          <AdvancedStoriesSection
            biography={profileData.advancedStories as unknown as Record<string, unknown>}
            isEditing={isEditing}
            isMobile={isMobile}
            onSave={handleAdvancedStorySave}
            onSaveAll={handleAdvancedStorySaveAll}
          />
          <ProfileDivider />
          <ClimbingFootprintsSection
            locations={profileData.climbingLocations}
            isEditing={isEditing}
            isMobile={isMobile}
            onChange={handleClimbingLocationsChange}
          />
          <ProfileDivider />
          <PublicSettingSection
            isPublic={profileData.isPublic}
            isMobile={isMobile}
            onChange={handleChange}
          />
          {isEditing && (
            <ProfileActionButtons
              onCancel={() => {
                setIsEditing(false)
                setProfileData(originalDataRef.current)
              }}
              onSave={handleSave}
              isMobile={isMobile}
              isLoading={isSaving}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}
