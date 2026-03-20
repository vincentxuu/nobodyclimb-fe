/**
 * BiographyHero 組件
 *
 * Hero 區塊，對應 apps/web/src/components/biography/display/BiographyHero.tsx
 */
import React, { useState } from 'react'
import { StyleSheet, View, Pressable, Linking } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Clock,
  BarChart3,
  Globe,
  Eye,
  Users,
  MessageCircle,
  Share2,
} from 'lucide-react-native'

import { Text, Avatar, IconButton } from '@/components/ui'
import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'

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
  slug?: string
  title?: string
  avatar_url?: string | null
  cover_url?: string | null
  visibility?: string
  climbing_years?: number | null
  frequent_locations?: string[]
  social_links?: SocialLinks
  total_views?: number
  total_likes?: number
  follower_count?: number
  comment_count?: number
}

// 社群平台圖示組件
interface SocialIconButtonProps {
  platform: keyof SocialLinks
  value: string
}

function SocialIconButton({ platform, value }: SocialIconButtonProps) {
  const handlePress = () => {
    let url = value
    switch (platform) {
      case 'instagram':
        url = value.startsWith('http')
          ? value
          : `https://instagram.com/${value.replace('@', '')}`
        break
      case 'youtube':
        url = value.startsWith('http')
          ? value
          : `https://youtube.com/@${value.replace('@', '')}`
        break
      case 'facebook':
        url = value.startsWith('http') ? value : `https://facebook.com/${value}`
        break
      case 'threads':
        url = value.startsWith('http')
          ? value
          : `https://threads.net/@${value.replace('@', '')}`
        break
      case 'website':
        url = value.startsWith('http') ? value : `https://${value}`
        break
    }
    Linking.openURL(url)
  }

  return (
    <Pressable
      style={styles.socialButton}
      onPress={handlePress}
      accessibilityLabel={platform}
    >
      <Globe size={16} color={SEMANTIC_COLORS.textSubtle} />
    </Pressable>
  )
}

interface BiographyHeroProps {
  /** 人物誌資料 */
  biography: BiographyV2
  /** 是否為擁有者 */
  isOwner?: boolean
  /** 是否為匿名模式 */
  isAnonymous?: boolean
  /** 是否顯示追蹤和分享按鈕 */
  showActions?: boolean
  /** 追蹤者數量變更回調 */
  onFollowerCountChange?: (count: number) => void
  /** 按讚回調 */
  onLike?: () => void
  /** 分享回調 */
  onShare?: () => void
  /** 評論回調 */
  onComment?: () => void
  /** 追蹤回調 */
  onFollow?: () => void
}

export function BiographyHero({
  biography,
  isOwner = false,
  isAnonymous: isAnonymousProp,
  showActions = true,
  onFollowerCountChange,
  onLike,
  onShare,
  onComment,
  onFollow,
}: BiographyHeroProps) {
  const isAnonymous = isAnonymousProp ?? biography.visibility === 'anonymous'
  const climbingYears = biography.climbing_years

  const [likesCount, setLikesCount] = useState(biography.total_likes || 0)
  const [commentsCount] = useState(biography.comment_count || 0)
  const [followerCount, setFollowerCount] = useState(biography.follower_count || 0)
  const [isFollowing, setIsFollowing] = useState(false)

  const handleFollow = () => {
    const newFollowing = !isFollowing
    setIsFollowing(newFollowing)
    const newCount = newFollowing ? followerCount + 1 : Math.max(0, followerCount - 1)
    setFollowerCount(newCount)
    onFollowerCountChange?.(newCount)
    onFollow?.()
  }

  const handleLike = () => {
    setLikesCount((prev) => prev + 1)
    onLike?.()
  }

  return (
    <View style={styles.container}>
      {/* 封面圖 */}
      <View style={styles.coverContainer}>
        <Image
          source={{
            uri: biography.cover_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${biography.id || 'default'}`,
          }}
          style={styles.coverImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)']}
          style={styles.gradient}
        />
      </View>

      {/* 個人資訊區 */}
      <View style={styles.infoContainer}>
        {/* 頭像 */}
        <View style={styles.avatarContainer}>
          {isAnonymous ? (
            <View style={styles.anonymousAvatar}>
              <Text style={styles.anonymousEmoji}>🎭</Text>
            </View>
          ) : (
            <Avatar
              size="xl"
              source={biography.avatar_url ? { uri: biography.avatar_url } : undefined}
              style={styles.avatar}
            />
          )}
        </View>

        {/* 資訊區 */}
        <View style={styles.infoSection}>
          {/* 左側：名稱與資訊 */}
          <View style={styles.nameSection}>
            <Text variant="h3" fontWeight="700">
              {isAnonymous ? '匿名岩友' : biography.name}
            </Text>

            {biography.title && (
              <Text variant="body" color="textSubtle" style={styles.title}>
                「{biography.title}」
              </Text>
            )}

            {/* Meta 資訊 */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Clock size={14} color={SEMANTIC_COLORS.textSubtle} />
                <Text variant="small" color="textSubtle">
                  {climbingYears != null && climbingYears > 0
                    ? `攀岩第 ${climbingYears} 年`
                    : '從入坑那天起算'}
                </Text>
              </View>

              {biography.frequent_locations &&
                biography.frequent_locations.length > 0 && (
                  <>
                    <Text variant="small" color="textMuted">·</Text>
                    <View style={styles.metaItem}>
                      <BarChart3 size={14} color={SEMANTIC_COLORS.textSubtle} />
                      <Text variant="small" color="textSubtle">
                        常出沒：{biography.frequent_locations.join('、')}
                      </Text>
                    </View>
                  </>
                )}
            </View>

            {/* 社群連結 */}
            {biography.social_links && !isAnonymous && (
              <View style={styles.socialLinks}>
                {Object.entries(biography.social_links)
                  .filter(([, value]) => value && value.trim() !== '')
                  .map(([platform, value]) => (
                    <SocialIconButton
                      key={platform}
                      platform={platform as keyof SocialLinks}
                      value={value!}
                    />
                  ))}
              </View>
            )}
          </View>

          {/* 右側：操作與統計 */}
          {showActions && !isAnonymous && (
            <View style={styles.actionsSection}>
              {/* 追蹤按鈕 */}
              {!isOwner && biography.id && (
                <Pressable
                  style={[
                    styles.followButton,
                    isFollowing && styles.followingButton,
                  ]}
                  onPress={handleFollow}
                >
                  <Text
                    variant="small"
                    fontWeight="500"
                    style={isFollowing ? styles.followingText : styles.followText}
                  >
                    {isFollowing ? '追蹤中' : '追蹤'}
                  </Text>
                </Pressable>
              )}

              {/* 統計列 */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Eye size={14} color={SEMANTIC_COLORS.textSubtle} />
                  <Text variant="small" color="textSubtle">
                    {biography.total_views || 0}
                  </Text>
                </View>

                <Pressable style={styles.statItem} onPress={handleLike}>
                  <View style={styles.likeIcon} />
                  <Text variant="small" color="textSubtle">
                    {likesCount}
                  </Text>
                </Pressable>

                <View style={styles.statItem}>
                  <Users size={14} color={SEMANTIC_COLORS.textSubtle} />
                  <Text variant="small" color="textSubtle">
                    {followerCount}
                  </Text>
                </View>

                <Pressable style={styles.statItem} onPress={onComment}>
                  <MessageCircle size={14} color={SEMANTIC_COLORS.textSubtle} />
                  <Text variant="small" color="textSubtle">
                    {commentsCount}
                  </Text>
                </Pressable>

                <Pressable style={styles.statItem} onPress={onShare}>
                  <Share2 size={14} color={SEMANTIC_COLORS.textSubtle} />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  coverContainer: {
    width: '100%',
    aspectRatio: 3,
    backgroundColor: WB_COLORS[20],
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  infoContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  avatarContainer: {
    position: 'absolute',
    top: -48,
    left: SPACING.md,
    zIndex: 10,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: WB_COLORS[0],
  },
  anonymousAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: WB_COLORS[0],
    backgroundColor: WB_COLORS[30],
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonymousEmoji: {
    fontSize: 40,
  },
  infoSection: {
    paddingTop: 56,
  },
  nameSection: {
    marginBottom: SPACING.sm,
  },
  title: {
    marginTop: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  socialLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  socialButton: {
    padding: SPACING.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: WB_COLORS[30],
  },
  actionsSection: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  followButton: {
    alignSelf: 'flex-start',
    backgroundColor: WB_COLORS[100],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  followingButton: {
    backgroundColor: WB_COLORS[10],
    borderWidth: 1,
    borderColor: WB_COLORS[30],
  },
  followText: {
    color: WB_COLORS[0],
  },
  followingText: {
    color: WB_COLORS[100],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeIcon: {
    width: 14,
    height: 14,
    backgroundColor: SEMANTIC_COLORS.success,
    borderRadius: 7,
  },
})

export default BiographyHero
