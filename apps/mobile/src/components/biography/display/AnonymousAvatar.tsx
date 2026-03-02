/**
 * AnonymousAvatar 組件
 *
 * 匿名頭像，對應 apps/web/src/components/biography/display/AnonymousAvatar.tsx
 */
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { User } from 'lucide-react-native'

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

interface AnonymousAvatarProps {
  /** 頭像尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** 自訂樣式 */
  style?: any
}

// 尺寸映射
const SIZES = {
  xs: { container: 24, icon: 12 },
  sm: { container: 32, icon: 16 },
  md: { container: 40, icon: 20 },
  lg: { container: 56, icon: 28 },
  xl: { container: 80, icon: 40 },
}

/**
 * 匿名頭像組件
 *
 * 用於顯示匿名用戶的頭像佔位符
 */
export function AnonymousAvatar({ size = 'md', style }: AnonymousAvatarProps) {
  const sizeConfig = SIZES[size]

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeConfig.container,
          height: sizeConfig.container,
          borderRadius: sizeConfig.container / 2,
        },
        style,
      ]}
    >
      <User size={sizeConfig.icon} color={SEMANTIC_COLORS.textMuted} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default AnonymousAvatar
