/**
 * Avatar 組件
 *
 * 頭像組件
 */
import React, { useState } from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { Image } from 'expo-image'
import { User } from 'lucide-react-native'
import {
  AVATAR_SIZES,
  BORDER_RADIUS,
  WB_COLORS,
  SEMANTIC_COLORS,
} from '@nobodyclimb/constants'
import type { AvatarSize } from '@nobodyclimb/constants'

export interface AvatarProps {
  /** 圖片來源 */
  source?: { uri: string } | number
  /** 尺寸 */
  size?: AvatarSize
  /** Alt 文字（用於 fallback） */
  alt?: string
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 頭像組件
 *
 * @example
 * ```tsx
 * <Avatar source={{ uri: 'https://...' }} size="md" />
 * <Avatar size="lg" alt="User Name" />
 * ```
 */
export function Avatar({
  source,
  size = 'md',
  alt,
  style,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false)
  const avatarSize = AVATAR_SIZES[size]

  const showFallback = !source || hasError

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        },
        style,
      ]}
    >
      {showFallback ? (
        <View style={[styles.fallback, { borderRadius: avatarSize / 2 }]}>
          <User
            size={avatarSize * 0.5}
            color={SEMANTIC_COLORS.textMuted}
          />
        </View>
      ) : (
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
          contentFit="cover"
          transition={200}
          onError={() => setHasError(true)}
        />
      )}
    </View>
  )
}

// ============================================
// AvatarGroup 組件
// ============================================

export interface AvatarGroupProps {
  /** 頭像列表 */
  avatars: Array<{ uri?: string; alt?: string }>
  /** 尺寸 */
  size?: AvatarSize
  /** 最大顯示數量 */
  max?: number
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 頭像群組
 *
 * @example
 * ```tsx
 * <AvatarGroup
 *   avatars={[
 *     { uri: 'https://...' },
 *     { uri: 'https://...' },
 *     { alt: 'User' },
 *   ]}
 *   max={3}
 * />
 * ```
 */
export function AvatarGroup({
  avatars,
  size = 'sm',
  max = 4,
  style,
}: AvatarGroupProps) {
  const avatarSize = AVATAR_SIZES[size]
  const overlap = avatarSize * 0.25
  const displayAvatars = avatars.slice(0, max)
  const remaining = avatars.length - max

  return (
    <View style={[styles.group, style]}>
      {displayAvatars.map((avatar, index) => (
        <View
          key={index}
          style={[
            styles.groupItem,
            { marginLeft: index === 0 ? 0 : -overlap },
            { zIndex: displayAvatars.length - index },
          ]}
        >
          <Avatar
            source={avatar.uri ? { uri: avatar.uri } : undefined}
            alt={avatar.alt}
            size={size}
            style={styles.groupAvatar}
          />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={[
            styles.groupItem,
            styles.remainingBadge,
            {
              marginLeft: -overlap,
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        >
          <View
            style={[
              styles.remainingInner,
              { borderRadius: avatarSize / 2 },
            ]}
          >
            <View style={styles.remainingText}>
              +{remaining}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    backgroundColor: WB_COLORS[20],
  },
  fallback: {
    flex: 1,
    backgroundColor: WB_COLORS[20],
    alignItems: 'center',
    justifyContent: 'center',
  },
  // AvatarGroup styles
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupItem: {
    borderWidth: 2,
    borderColor: WB_COLORS[0],
    borderRadius: 9999,
  },
  groupAvatar: {
    // Additional styles if needed
  },
  remainingBadge: {
    backgroundColor: WB_COLORS[20],
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '600',
    color: SEMANTIC_COLORS.textSubtle,
  },
})

export default Avatar
