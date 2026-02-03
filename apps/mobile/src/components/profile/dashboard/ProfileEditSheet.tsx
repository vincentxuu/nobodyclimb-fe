import React, { useCallback, useState } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { Sheet } from '../../ui/Sheet'
import { Button } from '../../ui/Button'
import { Text } from '../../ui/Text'
import { ProfileData, EditPanelType, SocialLinks } from '../types'
import { updateProfileField, mapProfileDataToApi } from '../mappers'
import { biographyService } from '@/lib/biographyService'

import BiographyAvatarSection from '../BiographyAvatarSection'
import BasicInfoSection from '../BasicInfoSection'
import ClimbingInfoSection from '../ClimbingInfoSection'
import ClimbingExperienceSection from '../ClimbingExperienceSection'
import SocialLinksSection from '../SocialLinksSection'
import AdvancedStoriesSection from '../AdvancedStoriesSection'
import ClimbingFootprintsSection from '../ClimbingFootprintsSection'
import PublicSettingSection from '../PublicSettingSection'
import { COLORS } from '@nobodyclimb/constants'

const PANEL_CONFIG: Record<
  Exclude<EditPanelType, null>,
  { title: string; description: string }
> = {
  avatar: {
    title: '頭像與封面',
    description: '設定你的頭像和封面照片',
  },
  basic: {
    title: '基本資料',
    description: '編輯你的暱稱和一句話介紹',
  },
  climbing: {
    title: '攀岩資訊',
    description: '編輯你的攀岩相關資訊',
  },
  social: {
    title: '社群連結',
    description: '連結你的社群帳號',
  },
  'core-stories': {
    title: '核心故事',
    description: '分享你與攀岩的故事',
  },
  'advanced-stories': {
    title: '進階故事',
    description: '深入分享你的攀岩歷程',
  },
  footprints: {
    title: '攀岩足跡',
    description: '記錄你去過的岩場',
  },
  settings: {
    title: '隱私設定',
    description: '管理你的隱私設定',
  },
}

interface ProfileEditSheetProps {
  activePanel: EditPanelType
  onClose: () => void
  profileData: ProfileData
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>
}

export default function ProfileEditSheet({
  activePanel,
  onClose,
  profileData,
  setProfileData,
}: ProfileEditSheetProps) {
  const [isSaving, setIsSaving] = useState(false)

  const config = activePanel ? PANEL_CONFIG[activePanel] : null

  const handleChange = useCallback(
    (field: string, value: string | boolean | SocialLinks) => {
      setProfileData((prev) => updateProfileField(prev, field, value))
    },
    [setProfileData]
  )

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const apiData = mapProfileDataToApi(profileData)
      if (profileData.biographyId) {
        await biographyService.updateMyBiography(apiData as any)
      } else {
        await biographyService.createBiography(apiData as any)
      }
      onClose()
      Alert.alert('成功', '資料已儲存')
    } catch (error) {
      console.error('Failed to save:', error)
      Alert.alert('錯誤', '儲存失敗，請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }, [profileData, onClose])

  const handleAvatarUpload = async (uri: string) => {
    setProfileData((prev) => ({ ...prev, avatarUrl: uri }))
  }

  const handleCoverUpload = async (uri: string) => {
    setProfileData((prev) => ({ ...prev, coverImageUrl: uri }))
  }

  const renderContent = () => {
    switch (activePanel) {
      case 'avatar':
        return (
          <BiographyAvatarSection
            avatarUrl={profileData.avatarUrl}
            coverImageUrl={profileData.coverImageUrl}
            isEditing={true}
            onAvatarUpload={handleAvatarUpload}
            onCoverImageUpload={handleCoverUpload}
            onAvatarDelete={() =>
              setProfileData((prev) => ({ ...prev, avatarUrl: null }))
            }
            onCoverImageDelete={() =>
              setProfileData((prev) => ({ ...prev, coverImageUrl: null }))
            }
          />
        )
      case 'basic':
        return (
          <BasicInfoSection
            name={profileData.name}
            title={profileData.title}
            isEditing={true}
            onChange={handleChange}
          />
        )
      case 'climbing':
        return (
          <ClimbingInfoSection
            startYear={profileData.startYear}
            frequentGyms={profileData.frequentGyms}
            favoriteRouteType={profileData.favoriteRouteType}
            isEditing={true}
            onChange={handleChange}
          />
        )
      case 'social':
        return (
          <SocialLinksSection
            socialLinks={profileData.socialLinks}
            isEditing={true}
            onChange={handleChange}
          />
        )
      case 'core-stories':
        return (
          <ClimbingExperienceSection
            climbingReason={profileData.climbingReason}
            climbingMeaning={profileData.climbingMeaning}
            adviceForBeginners={profileData.adviceForBeginners}
            isEditing={true}
            onChange={handleChange}
          />
        )
      case 'advanced-stories':
        return (
          <AdvancedStoriesSection
            advancedStories={profileData.advancedStories}
            isEditing={true}
            onFieldPress={(field, label) => {
              // TODO: Open field editor
              console.log('Edit field:', field, label)
            }}
          />
        )
      case 'footprints':
        return <ClimbingFootprintsSection isEditing={true} />
      case 'settings':
        return (
          <PublicSettingSection
            isPublic={profileData.isPublic}
            onChange={handleChange}
          />
        )
      default:
        return null
    }
  }

  const showSaveButton = activePanel !== 'advanced-stories'

  return (
    <Sheet
      open={activePanel !== null}
      onOpenChange={(open: boolean) => !open && onClose()}
      snapPoints={['85%']}
    >
      <View style={styles.container}>
        {config && (
          <View style={styles.header}>
            <Text variant="h3">{config.title}</Text>
            <Text variant="caption" style={styles.description}>
              {config.description}
            </Text>
          </View>
        )}

        <View style={styles.content}>{renderContent()}</View>

        {showSaveButton && (
          <View style={styles.footer}>
            <Button
              variant="secondary"
              onPress={onClose}
              style={styles.footerButton}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onPress={handleSave}
              loading={isSaving}
              style={styles.footerButton}
            >
              儲存
            </Button>
          </View>
        )}
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  description: {
    color: COLORS.gray[500],
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  footerButton: {
    flex: 1,
  },
})
