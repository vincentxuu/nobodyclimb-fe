'use client'

import React from 'react'
import { motion } from 'framer-motion'
import ProfilePageHeader from './ProfilePageHeader'
import ProfileDivider from './ProfileDivider'
import BasicInfoSection from './BasicInfoSection'
import ClimbingInfoSection from './ClimbingInfoSection'
import ClimbingExperienceSection from './ClimbingExperienceSection'
import PublicSettingSection from './PublicSettingSection'
import ProfileActionButtons from './ProfileActionButtons'
import { useProfile } from './ProfileContext'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useToast } from '@/components/ui/use-toast'

export default function ProfileContainer() {
  const { profileData, setProfileData, isEditing, setIsEditing } = useProfile()
  const originalData = { ...profileData } // Store the original profile data
  const isMobile = useIsMobile()
  const { toast } = useToast()

  // 處理表單變更
  const handleChange = (field: string, value: string | boolean) => {
    setProfileData({
      ...profileData,
      [field]: value,
    })
  }

  // 處理儲存
  const handleSave = () => {
    // 這裡應該會有API呼叫來保存資料
    console.log('儲存資料:', profileData)
    setIsEditing(false)

    toast({
      title: '儲存成功',
      description: '您的個人資料已成功更新',
    })
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
          onEdit={() => setIsEditing(true)}
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
            climbingBucketList={profileData.climbingBucketList}
            adviceForBeginners={profileData.adviceForBeginners}
            isEditing={isEditing}
            isMobile={isMobile}
            onChange={handleChange}
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
                setProfileData(originalData)
              }}
              onSave={handleSave}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}
