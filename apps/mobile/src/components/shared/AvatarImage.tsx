/**
 * AvatarImage 組件
 *
 * 頭像圖片顯示，對應 apps/web/src/components/shared/avatar-image.tsx
 */
import React from 'react'
import { StyleSheet, View, Image, Pressable } from 'react-native'
import { User } from 'lucide-react-native'

import { SEMANTIC_COLORS, RADIUS } from '@nobodyclimb/constants'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const SIZES: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
  '2xl': 120,
}

interface AvatarImageProps {
  /** 圖片 URL */
  src?: string | null
  /** 替代文字 */
  alt?: string
  /** 尺寸 */
  size?: AvatarSize
  /** 自訂尺寸（像素） */
  customSize?: number
  /** 是否可點擊 */
  onPress?: () => void
  /** 是否顯示邊框 */
  showBorder?: boolean
  /** 邊框顏色 */
  borderColor?: string
}

export function AvatarImage({
  src,
  alt = 'Avatar',
  size = 'md',
  customSize,
  onPress,
  showBorder = false,
  borderColor = '#FFFFFF',
}: AvatarImageProps) {
  const dimension = customSize || SIZES[size]
  const borderRadius = dimension / 2
  const iconSize = Math.floor(dimension * 0.5)

  const containerStyle = [
    styles.container,
    {
      width: dimension,
      height: dimension,
      borderRadius,
    },
    showBorder && {
      borderWidth: 2,
      borderColor,
    },
  ]

  const content = src ? (
    <Image
      source={{ uri: src }}
      style={[styles.image, { borderRadius }]}
      accessibilityLabel={alt}
    />
  ) : (
    <View style={[styles.fallback, { borderRadius }]}>
      <User size={iconSize} color={SEMANTIC_COLORS.textMuted} />
    </View>
  )

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          containerStyle,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    )
  }

  return <View style={containerStyle}>{content}</View>
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EBEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
})

export default AvatarImage
