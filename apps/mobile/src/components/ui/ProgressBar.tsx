/**
 * ProgressBar 組件
 *
 * 進度條
 */
import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SEMANTIC_COLORS, DURATION, RADIUS } from '@nobodyclimb/constants'

export interface ProgressBarProps {
  /** 進度值 (0-100) */
  value: number
  /** 進度條高度 */
  height?: number
  /** 進度條顏色 */
  color?: string
  /** 背景顏色 */
  backgroundColor?: string
  /** 是否顯示動畫 */
  animated?: boolean
}

export function ProgressBar({
  value,
  height = 8,
  color = SEMANTIC_COLORS.brand,
  backgroundColor = '#EBEAEA',
  animated = true,
}: ProgressBarProps) {
  const progress = useSharedValue(0)

  // 限制值在 0-100 之間
  const clampedValue = Math.min(100, Math.max(0, value))

  useEffect(() => {
    if (animated) {
      progress.value = withTiming(clampedValue, {
        duration: DURATION.normal,
      })
    } else {
      progress.value = clampedValue
    }
  }, [clampedValue, animated, progress])

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }))

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor,
          borderRadius: height / 2,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.progress,
          {
            backgroundColor: color,
            borderRadius: height / 2,
          },
          progressStyle,
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
  },
})
