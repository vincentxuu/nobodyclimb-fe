/**
 * SlideUp 動畫組件
 *
 * 從下方滑入動畫
 */
import React, { useEffect } from 'react'
import { type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { slideUpConfig, SLIDE_OFFSET } from '@/theme/animations'

export interface SlideUpProps {
  /** 子元素 */
  children: React.ReactNode
  /** 延遲時間（毫秒） */
  delay?: number
  /** 動畫時長（毫秒） */
  duration?: number
  /** 滑動距離（像素） */
  offset?: number
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 從下方滑入動畫
 *
 * @example
 * ```tsx
 * <SlideUp delay={100}>
 *   <View>內容</View>
 * </SlideUp>
 *
 * // Stagger 效果
 * {items.map((item, index) => (
 *   <SlideUp key={item.id} delay={index * 50}>
 *     <ItemCard {...item} />
 *   </SlideUp>
 * ))}
 * ```
 */
export function SlideUp({
  children,
  delay = 0,
  duration = slideUpConfig.duration,
  offset = SLIDE_OFFSET,
  style,
}: SlideUpProps) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(offset)

  useEffect(() => {
    const timing = { duration, easing: slideUpConfig.easing }
    opacity.value = withDelay(delay, withTiming(1, timing))
    translateY.value = withDelay(delay, withTiming(0, timing))
  }, [delay, duration, offset, opacity, translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  )
}

export default SlideUp
