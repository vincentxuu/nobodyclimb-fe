import { COLORS } from '@nobodyclimb/constants'
import { useCallback, useRef, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { biographyService } from '@/lib/biographyService'
import AdvancedStoriesSection from './AdvancedStoriesSection'
import BasicInfoSection from './BasicInfoSection'
import BiographyAvatarSection from './BiographyAvatarSection'
import ClimbingExperienceSection from './ClimbingExperienceSection'
import ClimbingFootprintsSection from './ClimbingFootprintsSection'
import ClimbingInfoSection from './ClimbingInfoSection'
import { mapProfileDataToApi, updateProfileField } from './mappers'
import ProfileActionButtons from './ProfileActionButtons'
import { useProfile } from './ProfileContext'
import ProfileDivider from './ProfileDivider'
import ProfilePageHeader from './ProfilePageHeader'
import PublicSettingSection from './PublicSettingSection'
import SocialLinksSection from './SocialLinksSection'
import { ProfileData, SocialLinks } from './types'

interface ProfileContainerProps {
  onAdvancedStoryPress?: (field: string, label: string) => void
}

export default function ProfileContainer({ onAdvancedStoryPress }: ProfileContainerProps) {
  const { profileData, setProfileData, isEditing, setIsEditing, isLoading, refreshProfile } =
    useProfile()
  const [isSaving, setIsSaving] = useState(false)
  const originalDataRef = useRef<ProfileData | null>(null)

  // 開始編輯
  const handleEdit = useCallback(() => {
    originalDataRef.current = { ...profileData }
    setIsEditing(true)
  }, [profileData, setIsEditing])

  // 取消編輯
  const handleCancel = useCallback(() => {
    if (originalDataRef.current) {
      setProfileData(originalDataRef.current)
    }
    setIsEditing(false)
  }, [setProfileData, setIsEditing])

  // 儲存變更
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const apiData = mapProfileDataToApi(profileData)

      if (profileData.biographyId) {
        // 更新現有的 biography
        await biographyService.updateMyBiography(apiData as any)
      } else {
        // 建立新的 biography
        await biographyService.createBiography(apiData as any)
      }

      await refreshProfile()
      setIsEditing(false)
      Alert.alert('成功', '個人資料已更新')
    } catch (error) {
      console.error('Failed to save profile:', error)
      Alert.alert('錯誤', '儲存失敗，請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }, [profileData, refreshProfile, setIsEditing])

  // 處理欄位變更
  const handleChange = useCallback(
    (field: string, value: string | boolean | SocialLinks) => {
      setProfileData((prev) => updateProfileField(prev, field, value))
    },
    [setProfileData]
  )

  // 處理頭像上傳
  const handleAvatarUpload = useCallback(
    async (uri: string) => {
      try {
        const response = await biographyService.uploadBiographyImage(uri, profileData.avatarUrl)
        if (!response.success || !response.data?.url) {
          throw new Error(response.error || '頭像上傳失敗')
        }
        setProfileData((prev) => ({ ...prev, avatarUrl: response.data!.url }))
      } catch (error) {
        console.error('Failed to upload avatar:', error)
        const message = error instanceof Error ? error.message : '頭像上傳失敗'
        Alert.alert('錯誤', message)
      }
    },
    [profileData.avatarUrl, setProfileData]
  )

  // 處理封面上傳
  const handleCoverUpload = useCallback(
    async (uri: string) => {
      try {
        const response = await biographyService.uploadBiographyImage(uri, profileData.coverImageUrl)
        if (!response.success || !response.data?.url) {
          throw new Error(response.error || '封面上傳失敗')
        }
        setProfileData((prev) => ({ ...prev, coverImageUrl: response.data!.url }))
      } catch (error) {
        console.error('Failed to upload cover:', error)
        const message = error instanceof Error ? error.message : '封面上傳失敗'
        Alert.alert('錯誤', message)
      }
    },
    [profileData.coverImageUrl, setProfileData]
  )

  // 刪除頭像
  const handleAvatarDelete = useCallback(() => {
    setProfileData((prev) => ({ ...prev, avatarUrl: null }))
  }, [setProfileData])

  // 刪除封面
  const handleCoverDelete = useCallback(() => {
    setProfileData((prev) => ({ ...prev, coverImageUrl: null }))
  }, [setProfileData])

  // 處理進階故事點擊
  const handleAdvancedStoryPress = useCallback(
    (field: string, label: string) => {
      if (onAdvancedStoryPress) {
        onAdvancedStoryPress(field, label)
      }
    },
    [onAdvancedStoryPress]
  )

  if (isLoading) {
    return <View style={styles.loadingContainer}>{/* Loading spinner placeholder */}</View>
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <ProfilePageHeader title="個人資料" isEditing={isEditing} onEdit={handleEdit} />

      <BiographyAvatarSection
        avatarUrl={profileData.avatarUrl}
        coverImageUrl={profileData.coverImageUrl}
        isEditing={isEditing}
        onAvatarUpload={handleAvatarUpload}
        onCoverImageUpload={handleCoverUpload}
        onAvatarDelete={handleAvatarDelete}
        onCoverImageDelete={handleCoverDelete}
      />

      <View style={styles.section}>
        <BasicInfoSection
          name={profileData.name}
          title={profileData.title}
          isEditing={isEditing}
          onChange={handleChange}
        />
      </View>

      <ProfileDivider />

      <View style={styles.section}>
        <ClimbingInfoSection
          startYear={profileData.startYear}
          frequentGyms={profileData.frequentGyms}
          favoriteRouteType={profileData.favoriteRouteType}
          isEditing={isEditing}
          onChange={handleChange}
        />
      </View>

      <ProfileDivider />

      <View style={styles.section}>
        <SocialLinksSection
          socialLinks={profileData.socialLinks}
          isEditing={isEditing}
          onChange={handleChange}
        />
      </View>

      <ProfileDivider />

      <View style={styles.section}>
        <ClimbingExperienceSection
          climbingReason={profileData.climbingReason}
          climbingMeaning={profileData.climbingMeaning}
          adviceForBeginners={profileData.adviceForBeginners}
          isEditing={isEditing}
          onChange={handleChange}
        />
      </View>

      <ProfileDivider />

      <View style={styles.section}>
        <AdvancedStoriesSection
          advancedStories={profileData.advancedStories}
          isEditing={isEditing}
          onFieldPress={handleAdvancedStoryPress}
        />
      </View>

      <ProfileDivider />

      <View style={styles.section}>
        <ClimbingFootprintsSection isEditing={isEditing} />
      </View>

      <ProfileDivider />

      <View style={styles.section}>
        <PublicSettingSection isPublic={profileData.isPublic} onChange={handleChange} />
      </View>

      {isEditing && (
        <View style={styles.section}>
          <ProfileActionButtons onCancel={handleCancel} onSave={handleSave} isLoading={isSaving} />
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingVertical: 8,
  },
  bottomPadding: {
    height: 32,
  },
})
