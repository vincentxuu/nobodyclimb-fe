import React, { useState } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { Text } from '../../ui/Text'
import { Icon } from '../../ui/Icon'
import { useProfile } from '../ProfileContext'
import ProfileDashboardCard from './ProfileDashboardCard'
import ProfileEditSheet from './ProfileEditSheet'
import { EditPanelType, AdvancedStories } from '../types'
import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'

export default function ProfileDashboard() {
  const { profileData, setProfileData, isLoading } = useProfile()
  const [activePanel, setActivePanel] = useState<EditPanelType>(null)

  // 計算進階故事完成數
  const getAdvancedStoriesProgress = () => {
    const stories = profileData.advancedStories
    const total = Object.keys(stories).length
    const current = Object.values(stories).filter((v) => v && v.length > 0).length
    return { current, total }
  }

  // 檢查核心故事是否完成
  const getCoreStoriesProgress = () => {
    const fields = [
      profileData.climbingReason,
      profileData.climbingMeaning,
      profileData.adviceForBeginners,
    ]
    const total = fields.length
    const current = fields.filter((v) => v && v.length > 0).length
    return { current, total }
  }

  const handlePanelClose = () => {
    setActivePanel(null)
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>載入中...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="h2" style={{ color: SEMANTIC_COLORS.textMain, marginBottom: 8 }}>
          個人資料
        </Text>
        <Text variant="body" style={{ color: SEMANTIC_COLORS.textMuted, marginBottom: 24 }}>
          完善你的個人資料，讓其他人更了解你
        </Text>

        <View style={styles.cardGrid}>
          {/* Avatar & Cover */}
          <ProfileDashboardCard
            icon={<Icon name="Camera" size="md" color={SEMANTIC_COLORS.textSubtle} />}
            title="頭像與封面"
            description="設定你的頭像和封面照片"
            onPress={() => setActivePanel('avatar')}
            isComplete={Boolean(profileData.avatarUrl)}
          />

          {/* Basic Info */}
          <ProfileDashboardCard
            icon={<Icon name="User" size="md" color={SEMANTIC_COLORS.textSubtle} />}
            title="基本資料"
            description="暱稱、一句話介紹"
            onPress={() => setActivePanel('basic')}
            isComplete={Boolean(profileData.name && profileData.title)}
            preview={
              profileData.name ? (
                <Text variant="caption" numberOfLines={1}>
                  {profileData.name}
                  {profileData.title ? ` - ${profileData.title}` : ''}
                </Text>
              ) : undefined
            }
          />

          {/* Climbing Info */}
          <ProfileDashboardCard
            icon={<Icon name="Mountain" size="md" color={SEMANTIC_COLORS.textSubtle} />}
            title="攀岩資訊"
            description="開始年份、常去的地方、喜歡的路線"
            onPress={() => setActivePanel('climbing')}
            isComplete={Boolean(
              profileData.startYear && profileData.frequentGyms
            )}
          />

          {/* Social Links */}
          <ProfileDashboardCard
            icon={<Icon name="Link" size="md" color={SEMANTIC_COLORS.textSubtle} />}
            title="社群連結"
            description="Instagram、YouTube"
            onPress={() => setActivePanel('social')}
            isComplete={Boolean(
              profileData.socialLinks.instagram ||
                profileData.socialLinks.youtube_channel
            )}
          />

          {/* Core Stories */}
          <ProfileDashboardCard
            icon={<Icon name="BookOpen" size="md" color={SEMANTIC_COLORS.textSubtle} />}
            title="核心故事"
            description="你與攀岩的相遇、攀岩的意義"
            onPress={() => setActivePanel('core-stories')}
            progress={getCoreStoriesProgress()}
          />

          {/* Advanced Stories */}
          <ProfileDashboardCard
            icon={<Icon name="Sparkles" size="md" color={SEMANTIC_COLORS.textSubtle} />}
            title="進階故事"
            description="26 個深度問題，展現你的攀岩歷程"
            onPress={() => setActivePanel('advanced-stories')}
            progress={getAdvancedStoriesProgress()}
            size="large"
          />

          {/* Climbing Footprints */}
          <ProfileDashboardCard
            icon={<Icon name="MapPin" size="md" color={SEMANTIC_COLORS.textSubtle} />}
            title="攀岩足跡"
            description="記錄你去過的岩場"
            onPress={() => setActivePanel('footprints')}
          />

          {/* Settings */}
          <ProfileDashboardCard
            icon={<Icon name="Settings" size="md" color={SEMANTIC_COLORS.textSubtle} />}
            title="隱私設定"
            description={profileData.isPublic ? '公開' : '私人'}
            onPress={() => setActivePanel('settings')}
          />
        </View>
      </ScrollView>

      {/* Edit Sheet */}
      <ProfileEditSheet
        activePanel={activePanel}
        onClose={handlePanelClose}
        profileData={profileData}
        setProfileData={setProfileData}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardGrid: {
    gap: 12,
  },
})
