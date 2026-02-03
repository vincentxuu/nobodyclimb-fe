/**
 * Switch 組件
 *
 * 開關切換，與 apps/web/src/components/ui/switch.tsx 對應
 */
import React, { useCallback } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated'
import { SEMANTIC_COLORS, DURATION } from '@nobodyclimb/constants'

export interface SwitchProps {
  /** 是否選中 */
  checked?: boolean
  /** 選中狀態變化時的回調 */
  onCheckedChange?: (checked: boolean) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 開關寬度 */
  width?: number
  /** 開關高度 */
  height?: number
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  width = 44,
  height = 24,
}: SwitchProps) {
  const progress = useSharedValue(checked ? 1 : 0)
  const thumbSize = height - 4
  const thumbTravel = width - thumbSize - 4

  React.useEffect(() => {
    progress.value = withTiming(checked ? 1 : 0, {
      duration: DURATION.fast,
    })
  }, [checked, progress])

  const handlePress = useCallback(() => {
    if (!disabled) {
      onCheckedChange?.(!checked)
    }
  }, [checked, disabled, onCheckedChange])

  const trackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['#B6B3B3', SEMANTIC_COLORS.textMain]
    )
    return {
      backgroundColor,
      opacity: disabled ? 0.5 : 1,
    }
  })

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: progress.value * thumbTravel }],
    }
  })

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.track,
        { width, height, borderRadius: height / 2 },
        trackStyle,
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
          },
          thumbStyle,
        ]}
      />
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  thumb: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
})
