/**
 * Logo 組件
 *
 * 顯示網站 Logo，對應 apps/web/src/components/layout/navbar/Logo.tsx
 */

import { BRAND_YELLOW, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'

interface LogoProps {
  /** Logo 點擊回調（默認導航到首頁） */
  onPress?: () => void
  /** 是否顯示品牌黃色背景 */
  showBackground?: boolean
  /** 尺寸變體 */
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ onPress, showBackground = true, size = 'md' }: LogoProps) {
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
      <Text style={[styles.logoText, { fontSize }]}>NobodyClimb</Text>
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
    backgroundColor: BRAND_YELLOW[100],
  },
  pressed: {
    opacity: 0.8,
  },
  logoText: {
    fontWeight: '700',
    color: WB_COLORS[100],
    letterSpacing: 0.5,
  },
})

export default Logo
