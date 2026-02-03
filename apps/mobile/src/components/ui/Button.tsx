/**
 * Button 組件
 *
 * 基於設計系統的按鈕組件，支援多種變體和狀態
 * 注意：暫時移除 reanimated 動畫以兼容 Expo Go
 */
import React from 'react'
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
} from 'react-native'
import {
  SEMANTIC_COLORS,
  BUTTON_SIZES,
  BORDER_RADIUS,
  FONT_WEIGHT,
  WB_COLORS,
  BRAND_RED,
} from '@nobodyclimb/constants'
import { Text } from './Text'
import { Icon } from './Icon'
import type { LucideIcon } from 'lucide-react-native'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  /** 按鈕變體 */
  variant?: ButtonVariant
  /** 按鈕尺寸 */
  size?: ButtonSize
  /** 載入中狀態 */
  loading?: boolean
  /** 禁用狀態 */
  disabled?: boolean
  /** 按鈕文字 */
  children?: React.ReactNode
  /** 左側圖標 */
  leftIcon?: LucideIcon
  /** 右側圖標 */
  rightIcon?: LucideIcon
  /** 自定義樣式 */
  style?: ViewStyle
  /** 滿寬度 */
  fullWidth?: boolean
}

/**
 * 取得按鈕樣式
 */
function getButtonStyles(variant: ButtonVariant, disabled: boolean): ViewStyle {
  const baseStyle: ViewStyle = {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }

  if (disabled) {
    return {
      ...baseStyle,
      backgroundColor: WB_COLORS[20],
      borderColor: WB_COLORS[20],
    }
  }

  switch (variant) {
    case 'primary':
      return {
        ...baseStyle,
        backgroundColor: SEMANTIC_COLORS.buttonPrimary,
        borderColor: SEMANTIC_COLORS.buttonPrimary,
      }
    case 'secondary':
      return {
        ...baseStyle,
        backgroundColor: SEMANTIC_COLORS.buttonSecondary,
        borderColor: SEMANTIC_COLORS.buttonSecondaryBorder,
      }
    case 'outline':
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderColor: SEMANTIC_COLORS.border,
      }
    case 'ghost':
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      }
    case 'destructive':
      return {
        ...baseStyle,
        backgroundColor: BRAND_RED[100],
        borderColor: BRAND_RED[100],
      }
    default:
      return baseStyle
  }
}

/**
 * 取得文字顏色
 */
function getTextColor(variant: ButtonVariant, disabled: boolean): string {
  if (disabled) {
    return SEMANTIC_COLORS.textDisabled
  }

  switch (variant) {
    case 'primary':
    case 'destructive':
      return SEMANTIC_COLORS.buttonPrimaryText
    case 'secondary':
    case 'outline':
    case 'ghost':
      return SEMANTIC_COLORS.buttonSecondaryText
    default:
      return SEMANTIC_COLORS.textMain
  }
}

/**
 * 按鈕組件
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  leftIcon,
  rightIcon,
  style,
  fullWidth = false,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  const sizeConfig = BUTTON_SIZES[size]
  const buttonStyles = getButtonStyles(variant, isDisabled)
  const textColor = getTextColor(variant, isDisabled)
  const iconSize = size === 'sm' ? 'sm' : 'md'

  return (
    <Pressable
      style={({ pressed }) => [
        buttonStyles,
        {
          height: sizeConfig.height,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        fullWidth && { width: '100%' },
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {leftIcon && (
            <Icon
              icon={leftIcon}
              size={iconSize}
              color={textColor}
              style={styles.leftIcon}
            />
          )}
          {typeof children === 'string' ? (
            <Text
              style={{
                fontSize: sizeConfig.fontSize,
                fontWeight: FONT_WEIGHT.medium,
                color: textColor,
              }}
            >
              {children}
            </Text>
          ) : (
            children
          )}
          {rightIcon && (
            <Icon
              icon={rightIcon}
              size={iconSize}
              color={textColor}
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
})

export default Button
