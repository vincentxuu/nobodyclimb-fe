/**
 * FadeIn 動畫組件
 *
 * 淡入動畫包裝
 */
import React, { useEffect } from 'react'
import { type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { fadeInConfig } from '@/theme/animations'

export interface FadeInProps {
  /** 子元素 */
  children: React.ReactNode
  /** 延遲時間（毫秒） */
  delay?: number
  /** 動畫時長（毫秒） */
  duration?: number
  /** 初始透明度 */
  initialOpacity?: number
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 淡入動畫包裝
 *
 * @example
 * ```tsx
 * <FadeIn delay={200}>
 *   <View>內容</View>
 * </FadeIn>
 * ```
 */
export function FadeIn({
  children,
  delay = 0,
  duration = fadeInConfig.duration,
  initialOpacity = 0,
  style,
}: FadeInProps) {
  const opacity = useSharedValue(initialOpacity)

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: fadeInConfig.easing })
    )
  }, [delay, duration, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  )
}

export default FadeIn
