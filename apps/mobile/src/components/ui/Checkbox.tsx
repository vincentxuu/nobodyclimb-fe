/**
 * Checkbox 組件
 *
 * 複選框
 */
import React from 'react'
import { Pressable, StyleSheet } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated'
import { Check } from 'lucide-react-native'
import { SEMANTIC_COLORS, DURATION, RADIUS } from '@nobodyclimb/constants'

export interface CheckboxProps {
  /** 是否選中 */
  checked?: boolean
  /** 選中狀態變化時的回調 */
  onCheckedChange?: (checked: boolean) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 16,
  md: 20,
  lg: 24,
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  disabled = false,
  size = 'md',
}: CheckboxProps) {
  const boxSize = SIZES[size]
  const iconSize = boxSize - 6

  const scale = useSharedValue(1)
  const opacity = useSharedValue(checked ? 1 : 0)

  React.useEffect(() => {
    opacity.value = withTiming(checked ? 1 : 0, {
      duration: DURATION.fast,
    })
  }, [checked, opacity])

  const handlePress = () => {
    if (!disabled) {
      scale.value = withSpring(0.9, {}, () => {
        scale.value = withSpring(1)
      })
      onCheckedChange?.(!checked)
    }
  }

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const checkStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={containerStyle}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.container,
          {
            width: boxSize,
            height: boxSize,
            borderRadius: RADIUS.xs,
          },
          checked && styles.containerChecked,
          disabled && styles.containerDisabled,
        ]}
      >
        <Animated.View style={checkStyle}>
          <Check size={iconSize} color="#FFFFFF" strokeWidth={3} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderColor: SEMANTIC_COLORS.textMain,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerChecked: {
    backgroundColor: SEMANTIC_COLORS.textMain,
    borderColor: SEMANTIC_COLORS.textMain,
  },
  containerDisabled: {
    opacity: 0.5,
  },
})
