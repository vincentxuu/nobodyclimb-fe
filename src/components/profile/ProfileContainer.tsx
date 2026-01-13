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
import MediaIntegrationSection from './MediaIntegrationSection'
import PublicSettingSection from './PublicSettingSection'
import ProfileActionButtons from './ProfileActionButtons'
import { ProfileImageSection } from './image-gallery'
import { useProfile } from './ProfileContext'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useToast } from '@/components/ui/use-toast'
import { biographyService } from '@/lib/api/services'
import { ProfileImage, ImageLayout, AdvancedStories } from './types'
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
  const handleChange = (field: string, value: string | boolean) => {
    setProfileData({
      ...profileData,
      [field]: value,
    })
  }

  // 處理圖片上傳
  const handleImageUpload = async (file: File) => {
    try {
      const response = await biographyService.uploadImage(file)
      if (response.success && response.data?.url) {
        const newImage: ProfileImage = {
          id: crypto.randomUUID(),
          url: response.data.url,
          order: profileData.images.length,
        }
        setProfileData({
          ...profileData,
          images: [...profileData.images, newImage],
        })
        toast({
          title: '圖片上傳成功',
        })
      } else {
        throw new Error(response.error || '上傳失敗')
      }
    } catch (error) {
      console.error('圖片上傳失敗:', error)
      toast({
        title: '圖片上傳失敗',
        description: '請稍後再試',
        variant: 'destructive',
      })
      throw error
    }
  }

  // 處理圖片刪除
  const handleImageDelete = (id: string) => {
    const updatedImages = profileData.images
      .filter((img) => img.id !== id)
      .map((img, index) => ({ ...img, order: index }))
    setProfileData({
      ...profileData,
      images: updatedImages,
    })
  }

  // 處理圖片說明變更
  const handleCaptionChange = (id: string, caption: string) => {
    const updatedImages = profileData.images.map((img) =>
      img.id === id ? { ...img, caption } : img
    )
    setProfileData({
      ...profileData,
      images: updatedImages,
    })
  }

  // 處理排版變更
  const handleLayoutChange = (layout: ImageLayout) => {
    setProfileData({
      ...profileData,
      imageLayout: layout,
    })
  }

  // 處理圖片重新排序
  const handleReorder = (reorderedImages: ProfileImage[]) => {
    setProfileData({
      ...profileData,
      images: reorderedImages,
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
        await biographyService.updateBiography({ [field]: value })
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
        await biographyService.updateBiography(changes)
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
      // 將圖片資料序列化為 JSON
      const galleryImagesJson = JSON.stringify({
        images: profileData.images,
        layout: profileData.imageLayout,
      })

      // 序列化攀岩足跡
      const climbingLocationsJson = JSON.stringify(profileData.climbingLocations)

      // 將前端資料轉換為 API 格式
      const biographyData = {
        name: profileData.name,
        climbing_start_year: profileData.startYear,
        frequent_locations: profileData.frequentGyms,
        favorite_route_type: profileData.favoriteRouteType,
        climbing_origin: profileData.climbingReason,
        climbing_meaning: profileData.climbingMeaning,
        bucket_list_story: profileData.climbingBucketList,
        advice_to_self: profileData.adviceForBeginners,
        // 進階故事
        ...profileData.advancedStories,
        // 攀岩足跡
        climbing_locations: climbingLocationsJson,
        is_public: profileData.isPublic ? 1 : 0,
        // 圖片資料以 JSON 格式存儲
        gallery_images: galleryImagesJson,
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
          <BasicInfoSection
            name={profileData.name}
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
          <ClimbingExperienceSection
            climbingReason={profileData.climbingReason}
            climbingMeaning={profileData.climbingMeaning}
            adviceForBeginners={profileData.adviceForBeginners}
            isEditing={isEditing}
            isMobile={isMobile}
            onChange={handleChange}
          />
          <ProfileDivider />
          <ProfileImageSection
            images={profileData.images}
            imageLayout={profileData.imageLayout}
            isEditing={isEditing}
            isMobile={isMobile}
            onImageUpload={handleImageUpload}
            onImageDelete={handleImageDelete}
            onCaptionChange={handleCaptionChange}
            onLayoutChange={handleLayoutChange}
            onReorder={handleReorder}
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
          <MediaIntegrationSection
            biographyId={profileData.biographyId}
            isEditing={isEditing}
            isMobile={isMobile}
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
