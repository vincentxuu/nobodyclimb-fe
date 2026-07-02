/**
 * ProgressRing
 *
 * 訓練進度圓環，對應 apps/web/src/components/quiz/training/ProgressRing.tsx
 */

import { DURATION, SEMANTIC_COLORS } from '@nobodyclimb/constants'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { Text } from '@/components/ui'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface ProgressRingProps {
  /** 已完成天數 */
  completed: number
  /** 總天數 */
  total: number
  /** 尺寸（px） */
  size?: number
  /** 線條寬度 */
  strokeWidth?: number
  /** 進度顏色 */
  color?: string
}

export function ProgressRing({
  completed,
  total,
  size = 120,
  strokeWidth = 8,
  color = SEMANTIC_COLORS.success,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percent = total > 0 ? completed / total : 0

  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(percent, { duration: DURATION.slow })
  }, [percent, progress])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }))

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={SEMANTIC_COLORS.border}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text variant="h3" fontWeight="700">
          {completed}/{total}
        </Text>
        <Text variant="small" color="textMuted">
          天
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
