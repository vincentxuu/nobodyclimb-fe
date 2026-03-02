/**
 * HeroSection 組件
 *
 * 傳記頁面 Hero 區，對應 apps/web/src/components/biography/profile/HeroSection.tsx
 */
import React, { useState, useMemo } from 'react'
import { StyleSheet, View, Pressable, Image, useWindowDimensions } from 'react-native'
import { Eye, Users, MessageCircle } from 'lucide-react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'

import { Text } from '@/components/ui'
import { ProfileAvatar } from '../shared/ProfileAvatar'
import { FollowButton } from '../follow-button'
import { BiographyLikeButton } from '../biography-like-button'
import { CompactSocialLinks } from '../social-links'
import { ShareButton } from '@/components/shared/ShareButton'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 類型定義
interface Biography {
  id: string
  name: string
  title?: string
  avatar_url?: string
  cover_image?: string
  social_links?: string
  total_views?: number
  total_likes?: number
  comment_count?: number
}

interface HeroSectionProps {
  person: Biography
  followerCount: number
  isOwner: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

/**
 * Hero Section - 標題區
 * 封面圖橫幅 + 頭像疊在左下角
 */
export function HeroSection({
  person,
  followerCount,
  isOwner,
  onFollowChange,
}: HeroSectionProps) {
  const { width: screenWidth } = useWindowDimensions()
  const coverHeight = screenWidth / 3 // 3:1 比例

  const [likesCount, setLikesCount] = useState(person.total_likes || 0)
  const [showComments, setShowComments] = useState(false)
  const [commentsCount, setCommentsCount] = useState(person.comment_count || 0)

  // 解析社群連結
  const socialLinks = useMemo(() => {
    if (!person.social_links) return null
    try {
      return JSON.parse(person.social_links)
    } catch {
      return null
    }
  }, [person.social_links])

  // 預設封面圖
  const coverImage = person.cover_image || `https://picsum.photos/seed/${person.id}/800/300`

  return (
    <View style={styles.container}>
      {/* 封面圖片區域 */}
      <View style={[styles.coverContainer, { height: coverHeight }]}>
        <Image
          source={{ uri: coverImage }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      </View>

      {/* 內容區域 */}
      <View style={styles.contentContainer}>
        {/* 頭像 - 疊在封面底部 */}
        <View style={styles.avatarContainer}>
          <ProfileAvatar
            src={person.avatar_url}
            name={person.name || 'anonymous'}
            size={100}
          />
        </View>

        {/* 資訊區域 */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.infoContainer}
        >
          {/* 名字與描述 */}
          <View style={styles.nameContainer}>
            <Text variant="h2" fontWeight="700">
              {person.name}
            </Text>
            {person.title && (
              <Text variant="body" color="textSubtle" style={styles.title}>
                {person.title}
              </Text>
            )}
            {/* 社群連結 */}
            {socialLinks && (
              <CompactSocialLinks socialLinks={socialLinks} style={styles.socialLinks} />
            )}
          </View>

          {/* 操作按鈕與統計 */}
          <View style={styles.actionsContainer}>
            {!isOwner && person.id && (
              <FollowButton
                biographyId={person.id}
                onFollowChange={onFollowChange}
              />
            )}

            {/* 社群統計 */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Eye size={16} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" color="textMuted">
                  {person.total_views || 0}
                </Text>
              </View>

              <BiographyLikeButton
                biographyId={person.id}
                initialCount={likesCount}
                onLikeChange={(_isLiked, count) => setLikesCount(count)}
                showCount
              />

              <View style={styles.statItem}>
                <Users size={16} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" color="textMuted">
                  {followerCount}
                </Text>
              </View>

              <Pressable
                style={styles.statItem}
                onPress={() => setShowComments(!showComments)}
              >
                <MessageCircle size={16} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" color="textMuted">
                  {commentsCount}
                </Text>
              </Pressable>

              <ShareButton
                title={`${person.name} 的攀岩人物誌 - NobodyClimb`}
                description={person.title || `來看看 ${person.name} 的攀岩故事`}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  coverContainer: {
    width: '100%',
    backgroundColor: '#E5E5E5',
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
  },
  avatarContainer: {
    marginTop: -50,
    marginBottom: SPACING.md,
  },
  infoContainer: {
    paddingBottom: SPACING.md,
  },
  nameContainer: {
    marginBottom: SPACING.md,
  },
  title: {
    marginTop: 4,
  },
  socialLinks: {
    marginTop: SPACING.sm,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
})

export default HeroSection
