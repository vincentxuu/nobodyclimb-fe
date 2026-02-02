/**
 * IconButton 組件
 *
 * 圓形圖標按鈕
 */
import React, { useCallback } from 'react'
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import {
  SEMANTIC_COLORS,
  BORDER_RADIUS,
  WB_COLORS,
} from '@nobodyclimb/constants'
import { Icon, type IconSize, ICON_SIZES } from './Icon'
import { Text } from './Text'
import { springConfigLight } from '@/theme/animations'
import type { LucideIcon } from 'lucide-react-native'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export type IconButtonVariant = 'default' | 'primary' | 'ghost'

export interface IconButtonProps extends Omit<PressableProps, 'style'> {
  /** 圖標 */
  icon: LucideIcon
  /** 尺寸 */
  size?: IconSize
  /** 變體 */
  variant?: IconButtonVariant
  /** 禁用狀態 */
  disabled?: boolean
  /** Badge 數字 */
  badge?: number
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 取得按鈕尺寸
 */
function getButtonSize(size: IconSize): number {
  const iconSize = ICON_SIZES[size]
  return iconSize + 16 // 圖標尺寸 + padding
}

/**
 * 取得按鈕樣式
 */
function getButtonStyles(variant: IconButtonVariant, disabled: boolean): ViewStyle {
  const baseStyle: ViewStyle = {
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  }

  if (disabled) {
    return {
      ...baseStyle,
      backgroundColor: WB_COLORS[10],
    }
  }

  switch (variant) {
    case 'primary':
      return {
        ...baseStyle,
        backgroundColor: SEMANTIC_COLORS.buttonPrimary,
      }
    case 'ghost':
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
      }
    case 'default':
    default:
      return {
        ...baseStyle,
        backgroundColor: WB_COLORS[10],
      }
  }
}

/**
 * 取得圖標顏色
 */
function getIconColor(variant: IconButtonVariant, disabled: boolean): string {
  if (disabled) {
    return SEMANTIC_COLORS.textDisabled
  }

  switch (variant) {
    case 'primary':
      return SEMANTIC_COLORS.buttonPrimaryText
    default:
      return SEMANTIC_COLORS.textMain
  }
}

/**
 * 圓形圖標按鈕
 *
 * @example
 * ```tsx
 * import { Plus, Bell } from 'lucide-react-native'
 *
 * <IconButton icon={Plus} size="md" />
 * <IconButton icon={Bell} badge={3} variant="ghost" />
 * ```
 */
export function IconButton({
  icon,
  size = 'md',
  variant = 'default',
  disabled = false,
  badge,
  style,
  onPressIn,
  onPressOut,
  ...props
}: IconButtonProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      if (!disabled) {
        scale.value = withSpring(0.9, springConfigLight)
      }
      onPressIn?.(e)
    },
    [disabled, onPressIn, scale]
  )

  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      scale.value = withSpring(1, springConfigLight)
      onPressOut?.(e)
    },
    [onPressOut, scale]
  )

  const buttonSize = getButtonSize(size)
  const buttonStyles = getButtonStyles(variant, disabled)
  const iconColor = getIconColor(variant, disabled)

  return (
    <AnimatedPressable
      style={[
        animatedStyle,
        buttonStyles,
        {
          width: buttonSize,
          height: buttonSize,
        },
        style,
      ]}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      <Icon icon={icon} size={size} color={iconColor} />
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: SEMANTIC_COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: WB_COLORS[0],
  },
})

export default IconButton
