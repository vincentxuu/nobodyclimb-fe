/**
 * BiographyDetailPage 組件
 *
 * 人物誌詳細頁整合，對應 apps/web/src/components/biography/display/BiographyDetailPage.tsx
 */
import React from 'react'
import { StyleSheet, View, ScrollView } from 'react-native'

import { BiographyHero } from './BiographyHero'
import { BiographyTags } from './BiographyTags'
import { BiographyOneLiners } from './BiographyOneLiners'
import { BiographyStories } from './BiographyStories'
import { BiographyFootprints } from './BiographyFootprints'
import { BiographyGallery } from './BiographyGallery'
import { BiographyCoreStories } from './BiographyCoreStories'
import { EmptyState } from './EmptyState'
import { PrivateEmptyState } from './PrivateEmptyState'
import { SPACING } from '@nobodyclimb/constants'

// 類型定義
interface SocialLinks {
  instagram?: string
  youtube?: string
  facebook?: string
  threads?: string
  website?: string
}

interface BiographyV2 {
  id: string
  name: string
  visibility?: 'public' | 'private' | 'anonymous'
  tags?: string[]
  one_liners?: any[]
  stories?: any[]
  gallery_images?: any[]
  social_links?: SocialLinks
  updated_at?: string
  [key: string]: any
}

interface BiographyDetailPageProps {
  /** 人物誌資料 */
  biography: BiographyV2
  /** 是否為擁有者 */
  isOwner?: boolean
  /** 追蹤者數量變更回調 */
  onFollowerCountChange?: (count: number) => void
  /** 自訂樣式 */
  style?: any
}

/**
 * 檢查人物誌是否有任何內容
 */
function hasAnyContent(biography: BiographyV2): boolean {
  const hasTags = (biography.tags?.length ?? 0) > 0
  const hasOneLiners = (biography.one_liners?.length ?? 0) > 0
  const hasStories = (biography.stories?.length ?? 0) > 0
  const hasGallery = (biography.gallery_images?.length ?? 0) > 0
  const hasSocials = biography.social_links
    ? Object.values(biography.social_links).some((v) => v && v.trim() !== '')
    : false

  return hasTags || hasOneLiners || hasStories || hasGallery || hasSocials
}

/**
 * 人物誌詳細頁組件
 *
 * 整合所有 V2 展示組件
 *
 * 頁面結構：
 * 1. Hero Section - 封面圖 + 頭像 + 基本資訊 + 社群連結
 * 2. Identity Tags - 關鍵字標籤
 * 3. Core Stories - 核心故事
 * 4. Quick Intro - 一句話系列
 * 5. Stories - 深度故事
 * 6. Climbing Footprints - 攀岩足跡
 * 7. Gallery - 攀岩相簿
 */
export function BiographyDetailPage({
  biography,
  isOwner = false,
  onFollowerCountChange,
  style,
}: BiographyDetailPageProps) {
  // 處理隱私狀態
  const isPrivate = biography.visibility === 'private'
  const isAnonymous = biography.visibility === 'anonymous'

  // 如果是私密且不是擁有者，顯示空狀態
  if (isPrivate && !isOwner) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.privateContainer}>
          <PrivateEmptyState
            title="這是私人頁面"
            description="這位攀岩者選擇不公開他的人物誌"
          />
        </View>
      </View>
    )
  }

  // 檢查是否有內容
  const hasContent = hasAnyContent(biography)

  // 如果沒有內容，顯示引導
  if (!hasContent) {
    return (
      <ScrollView style={[styles.container, style]}>
        {/* Hero Section 仍然顯示 */}
        <BiographyHero
          biography={biography}
          isOwner={isOwner}
          isAnonymous={isAnonymous}
          onFollowerCountChange={onFollowerCountChange}
        />

        <View style={styles.emptyContainer}>
          <EmptyState type="no_content" isOwner={isOwner} />
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* 1. Hero Section */}
      <BiographyHero
        biography={biography}
        isOwner={isOwner}
        isAnonymous={isAnonymous}
        onFollowerCountChange={onFollowerCountChange}
      />

      {/* 內容區塊 */}
      <View style={styles.contentContainer}>
        {/* 2. Identity Tags - 關鍵字標籤 */}
        <BiographyTags biography={biography} />

        {/* 3. Core Stories - 核心故事 */}
        <BiographyCoreStories biographyId={biography.id} />

        {/* 4. Quick Intro - 一句話系列 */}
        <BiographyOneLiners biographyId={biography.id} />

        {/* 5. Stories - 深度故事 */}
        <BiographyStories biographyId={biography.id} />

        {/* 6. Climbing Footprints - 攀岩足跡 */}
        <BiographyFootprints biography={biography} />

        {/* 7. Gallery - 攀岩相簿 */}
        <BiographyGallery biography={biography} />

        {/* 底部間距 */}
        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
  },
  privateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyContainer: {
    padding: SPACING.xl,
  },
  bottomSpacer: {
    height: SPACING.xl * 2,
  },
})

export default BiographyDetailPage
