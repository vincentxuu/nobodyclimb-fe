/**
 * Skeleton 組件
 *
 * 骨架屏/載入佔位符
 */
import React, { useEffect } from 'react'
import { StyleSheet, View, ViewStyle, DimensionValue } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated'
import { DURATION, RADIUS } from '@nobodyclimb/constants'

export interface SkeletonProps {
  /** 寬度 */
  width?: number | string
  /** 高度 */
  height?: number | string
  /** 圓角 */
  borderRadius?: number
  /** 是否為圓形 */
  circle?: boolean
  /** 自訂樣式 */
  style?: ViewStyle
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = RADIUS.sm,
  circle = false,
  style,
}: SkeletonProps) {
  const shimmer = useSharedValue(0)

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1, // 無限重複
      true // 反向
    )
  }, [shimmer])

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmer.value, [0, 1], [0.3, 0.7])
    return {
      opacity,
    }
  })

  const circleRadius = circle && typeof height === 'number' ? height / 2 : borderRadius

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as DimensionValue,
          height: height as DimensionValue,
          borderRadius: circleRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  )
}

/**
 * SkeletonText - 文字骨架屏
 */
export interface SkeletonTextProps {
  /** 行數 */
  lines?: number
  /** 行高 */
  lineHeight?: number
  /** 行間距 */
  gap?: number
  /** 最後一行寬度比例 (0-1) */
  lastLineWidth?: number
}

export function SkeletonText({
  lines = 3,
  lineHeight = 14,
  gap = 8,
  lastLineWidth = 0.7,
}: SkeletonTextProps) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? `${lastLineWidth * 100}%` : '100%'}
        />
      ))}
    </View>
  )
}

/**
 * SkeletonAvatar - 頭像骨架屏
 */
export interface SkeletonAvatarProps {
  /** 尺寸 */
  size?: number
}

export function SkeletonAvatar({ size = 40 }: SkeletonAvatarProps) {
  return <Skeleton width={size} height={size} circle />
}

/**
 * SkeletonCard - 卡片骨架屏
 */
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton height={180} borderRadius={RADIUS.md} />
      <View style={styles.cardContent}>
        <Skeleton height={20} width="70%" />
        <View style={{ height: 8 }} />
        <SkeletonText lines={2} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
})

export default Skeleton
