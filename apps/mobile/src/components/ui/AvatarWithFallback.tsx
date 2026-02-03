/**
 * AvatarWithFallback 組件
 *
 * Avatar 的便捷封裝，支援 src 和 fallback props
 */
import React from 'react'
import { Avatar, type AvatarProps } from './Avatar'
import { Text } from './Text'
import { View, StyleSheet } from 'react-native'
import { AVATAR_SIZES, WB_COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'
import type { AvatarSize } from '@nobodyclimb/constants'

export interface AvatarWithFallbackProps {
  /** 圖片 URL */
  src?: string | null
  /** 尺寸 */
  size?: AvatarSize
  /** Fallback 文字（通常是名字首字母） */
  fallback?: string
}

/**
 * AvatarWithFallback 組件
 *
 * @example
 * ```tsx
 * <AvatarWithFallback src="https://..." size="md" fallback="AB" />
 * ```
 */
export function AvatarWithFallback({
  src,
  size = 'md',
  fallback,
}: AvatarWithFallbackProps) {
  const avatarSize = AVATAR_SIZES[size]

  // 如果有 fallback 文字，顯示文字縮寫
  const fallbackElement = fallback ? (
    <View style={styles.fallbackContainer}>
      <Text
        variant="label"
        style={[
          styles.fallbackText,
          { fontSize: avatarSize * 0.4 },
        ]}
      >
        {fallback.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  ) : undefined

  return (
    <Avatar
      source={src ? { uri: src } : undefined}
      size={size}
      fallback={fallbackElement}
    />
  )
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: SEMANTIC_COLORS.textSubtle,
    fontWeight: '600',
  },
})

export default AvatarWithFallback
