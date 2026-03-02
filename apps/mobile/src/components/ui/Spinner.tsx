/**
 * Spinner 組件
 *
 * 載入指示器組件
 */
import React from 'react'
import { ActivityIndicator, View, StyleSheet, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { BRAND_YELLOW, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Text } from './Text'

export type SpinnerSize = 'sm' | 'md' | 'lg'

export interface SpinnerProps {
  /** 尺寸 */
  size?: SpinnerSize
  /** 顏色 */
  color?: string
  /** 載入文字 */
  label?: string
  /** 自定義樣式 */
  style?: ViewStyle
}

const SIZE_MAP: Record<SpinnerSize, 'small' | 'large'> = {
  sm: 'small',
  md: 'small',
  lg: 'large',
}

/**
 * 載入指示器
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" label="載入中..." />
 * <Spinner color="#FF0000" />
 * ```
 */
export function Spinner({
  size = 'md',
  color = BRAND_YELLOW[100],
  label,
  style,
}: SpinnerProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={SIZE_MAP[size]} color={color} />
      {label && (
        <Text variant="caption" color="muted" style={styles.label}>
          {label}
        </Text>
      )}
    </View>
  )
}

// ============================================
// FullScreenSpinner 組件
// ============================================

export interface FullScreenSpinnerProps extends SpinnerProps {
  /** 是否顯示 */
  visible?: boolean
}

/**
 * 全螢幕載入指示器
 */
export function FullScreenSpinner({
  visible = true,
  ...props
}: FullScreenSpinnerProps) {
  if (!visible) return null

  return (
    <View style={styles.fullScreen}>
      <Spinner size="lg" {...props} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: SPACING[2],
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
})

export default Spinner
