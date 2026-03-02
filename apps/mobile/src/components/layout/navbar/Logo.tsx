/**
 * Logo 組件
 *
 * 顯示網站 Logo，對應 apps/web/src/components/layout/navbar/Logo.tsx
 */
import React from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'

import { Text } from '@/components/ui'
import { SPACING } from '@nobodyclimb/constants'

interface LogoProps {
  /** Logo 點擊回調（默認導航到首頁） */
  onPress?: () => void
  /** 是否顯示品牌黃色背景 */
  showBackground?: boolean
  /** 尺寸變體 */
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({
  onPress,
  showBackground = true,
  size = 'md',
}: LogoProps) {
  const router = useRouter()

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      router.push('/')
    }
  }

  const fontSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        showBackground && styles.containerWithBg,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="前往首頁"
    >
      <Text
        style={[
          styles.logoText,
          { fontSize },
        ]}
      >
        NobodyClimb
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    height: '100%',
  },
  containerWithBg: {
    backgroundColor: '#FFE70C',
  },
  pressed: {
    opacity: 0.8,
  },
  logoText: {
    fontWeight: '700',
    color: '#1B1A1A',
    letterSpacing: 0.5,
  },
})

export default Logo
