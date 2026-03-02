/**
 * ScaleIn 動畫組件
 *
 * 縮放進入動畫
 */
import React, { useEffect } from 'react'
import { type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { scaleInConfig, SCALE_INITIAL, springConfigStandard } from '@/theme/animations'

export interface ScaleInProps {
  /** 子元素 */
  children: React.ReactNode
  /** 延遲時間（毫秒） */
  delay?: number
  /** 初始縮放比例 */
  initialScale?: number
  /** 使用彈簧動畫 */
  spring?: boolean
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 縮放進入動畫
 *
 * @example
 * ```tsx
 * <ScaleIn>
 *   <View>內容</View>
 * </ScaleIn>
 *
 * <ScaleIn spring delay={200}>
 *   <Icon />
 * </ScaleIn>
 * ```
 */
export function ScaleIn({
  children,
  delay = 0,
  initialScale = SCALE_INITIAL,
  spring = false,
  style,
}: ScaleInProps) {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(initialScale)

  useEffect(() => {
    const fadeIn = withTiming(1, {
      duration: scaleInConfig.duration,
      easing: scaleInConfig.easing,
    })

    const scaleUp = spring
      ? withSpring(1, springConfigStandard)
      : withTiming(1, {
          duration: scaleInConfig.duration,
          easing: scaleInConfig.easing,
        })

    opacity.value = withDelay(delay, fadeIn)
    scale.value = withDelay(delay, scaleUp)
  }, [delay, spring, opacity, scale])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  )
}

export default ScaleIn
