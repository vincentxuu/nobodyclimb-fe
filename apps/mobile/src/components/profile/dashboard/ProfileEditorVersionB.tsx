import React from 'react'
import { View, ScrollView, StyleSheet, Alert } from 'react-native'
import { Text } from '../../ui/Text'
import { Button } from '../../ui/Button'
import { useProfile } from '../ProfileContext'
import BasicInfoSection from '../BasicInfoSection'
import BiographyAvatarSection from '../BiographyAvatarSection'
import PublicSettingSection from '../PublicSettingSection'
import { updateProfileField, mapProfileDataToApi } from '../mappers'
import { biographyService } from '@nobodyclimb/api-client'
import { ProfileProvider } from '../ProfileContext'
import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'
import type { SocialLinks } from '../types'

/**
 * ProfileEditorVersionB - 精簡版編輯器
 * 只顯示核心資訊：頭像、基本資料、隱私設定
 */
function ProfileEditorVersionBContent() {
  const { profileData, setProfileData, isLoading } = useProfile()
  const [isSaving, setIsSaving] = React.useState(false)

  const handleChange = (field: string, value: string | boolean | SocialLinks) => {
    setProfileData((prev) => updateProfileField(prev, field, value))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const apiData = mapProfileDataToApi(profileData)
      if (profileData.biographyId) {
        await biographyService.updateMyBiography(apiData as any)
      } else {
        await biographyService.createBiography(apiData as any)
      }
      Alert.alert('成功', '資料已儲存')
    } catch (error) {
      console.error('Failed to save:', error)
      Alert.alert('錯誤', '儲存失敗')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (uri: string) => {
    setProfileData((prev) => ({ ...prev, avatarUrl: uri }))
  }

  const handleCoverUpload = async (uri: string) => {
    setProfileData((prev) => ({ ...prev, coverImageUrl: uri }))
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>載入中...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="h2" style={{ color: SEMANTIC_COLORS.textMain, marginBottom: 8 }}>
        快速編輯
      </Text>
      <Text variant="body" style={{ color: SEMANTIC_COLORS.textMuted, marginBottom: 24 }}>
        編輯你的核心資訊
      </Text>

      <View style={styles.section}>
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
      </View>

      <View style={styles.section}>
        <BasicInfoSection
          name={profileData.name}
          title={profileData.title}
          isEditing={true}
          onChange={handleChange}
        />
      </View>

      <View style={styles.section}>
        <PublicSettingSection
          isPublic={profileData.isPublic}
          onChange={handleChange}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          onPress={handleSave}
          loading={isSaving}
        >
          儲存變更
        </Button>
      </View>
    </ScrollView>
  )
}

export default function ProfileEditorVersionB() {
  return (
    <ProfileProvider>
      <ProfileEditorVersionBContent />
    </ProfileProvider>
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
    marginBottom: 24,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
})
