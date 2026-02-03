/**
 * Chip 組件
 *
 * 標籤/籌碼樣式組件，與 Web 版本 API 一致
 */
import React, { useCallback } from 'react'
import {
  Pressable,
  StyleSheet,
  type ViewStyle,
  type PressableProps,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import {
  SEMANTIC_COLORS,
  BORDER_RADIUS,
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  WB_COLORS,
} from '@nobodyclimb/constants'
import { Text } from './Text'
import { springConfigLight } from '@/theme/animations'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export type ChipVariant = 'default' | 'outline' | 'secondary'
export type ChipSize = 'sm' | 'default' | 'lg'

export interface ChipProps extends Omit<PressableProps, 'style'> {
  /** 內容 */
  children: React.ReactNode
  /** 變體 */
  variant?: ChipVariant
  /** 尺寸 */
  size?: ChipSize
  /** 是否可選中 */
  selected?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 取得變體樣式
 */
function getVariantStyles(
  variant: ChipVariant,
  selected: boolean,
  disabled: boolean
): {
  backgroundColor: string
  borderColor: string
  textColor: string
} {
  if (disabled) {
    return {
      backgroundColor: WB_COLORS[20],
      borderColor: WB_COLORS[20],
      textColor: SEMANTIC_COLORS.textDisabled,
    }
  }

  if (selected) {
    return {
      backgroundColor: SEMANTIC_COLORS.textMain,
      borderColor: SEMANTIC_COLORS.textMain,
      textColor: '#FFFFFF',
    }
  }

  switch (variant) {
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderColor: SEMANTIC_COLORS.border,
        textColor: SEMANTIC_COLORS.textMain,
      }
    case 'secondary':
      return {
        backgroundColor: WB_COLORS[20],
        borderColor: WB_COLORS[20],
        textColor: SEMANTIC_COLORS.textSubtle,
      }
    case 'default':
    default:
      return {
        backgroundColor: '#3F3D3D',
        borderColor: '#3F3D3D',
        textColor: '#FFFFFF',
      }
  }
}

/**
 * 取得尺寸樣式
 */
function getSizeStyles(size: ChipSize): {
  paddingVertical: number
  paddingHorizontal: number
  fontSize: number
} {
  switch (size) {
    case 'sm':
      return {
        paddingVertical: SPACING[0.5],
        paddingHorizontal: SPACING[2],
        fontSize: FONT_SIZE.xs,
      }
    case 'lg':
      return {
        paddingVertical: SPACING[2],
        paddingHorizontal: SPACING[4],
        fontSize: FONT_SIZE.base,
      }
    case 'default':
    default:
      return {
        paddingVertical: SPACING[1],
        paddingHorizontal: SPACING[3],
        fontSize: FONT_SIZE.sm,
      }
  }
}

/**
 * Chip 組件
 *
 * @example
 * ```tsx
 * <Chip>標籤</Chip>
 * <Chip variant="outline" size="sm">選項</Chip>
 * <Chip selected onPress={() => {}}>已選中</Chip>
 * ```
 */
export function Chip({
  children,
  variant = 'default',
  size = 'default',
  selected = false,
  disabled = false,
  style,
  onPressIn,
  onPressOut,
  onPress,
  ...props
}: ChipProps) {
  const scale = useSharedValue(1)
  const isInteractive = !!onPress && !disabled

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      if (isInteractive) {
        scale.value = withSpring(0.95, springConfigLight)
      }
      onPressIn?.(e)
    },
    [isInteractive, onPressIn, scale]
  )

  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      scale.value = withSpring(1, springConfigLight)
      onPressOut?.(e)
    },
    [onPressOut, scale]
  )

  const { backgroundColor, borderColor, textColor } = getVariantStyles(
    variant,
    selected,
    disabled
  )
  const { paddingVertical, paddingHorizontal, fontSize } = getSizeStyles(size)

  const chipContent = (
    <>
      {typeof children === 'string' ? (
        <Text
          style={{
            fontSize,
            fontWeight: FONT_WEIGHT.medium,
            color: textColor,
          }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </>
  )

  // 如果是可交互的，使用 AnimatedPressable
  if (isInteractive) {
    return (
      <AnimatedPressable
        style={[
          animatedStyle,
          styles.chip,
          {
            backgroundColor,
            borderColor,
            paddingVertical,
            paddingHorizontal,
          },
          style,
        ]}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        {...props}
      >
        {chipContent}
      </AnimatedPressable>
    )
  }

  // 非交互模式，使用普通 Animated.View
  return (
    <Animated.View
      style={[
        styles.chip,
        {
          backgroundColor,
          borderColor,
          paddingVertical,
          paddingHorizontal,
        },
        style,
      ]}
    >
      {chipContent}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
})

export default Chip
