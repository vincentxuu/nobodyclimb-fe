/**
 * Badge 組件
 *
 * 標籤/徽章組件
 */
import React from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import {
  SEMANTIC_COLORS,
  BORDER_RADIUS,
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  WB_COLORS,
} from '@nobodyclimb/constants'
import { Text } from './Text'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  /** 內容 */
  children: React.ReactNode
  /** 變體 */
  variant?: BadgeVariant
  /** 尺寸 */
  size?: BadgeSize
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 取得變體樣式
 */
function getVariantStyles(variant: BadgeVariant): {
  backgroundColor: string
  textColor: string
} {
  switch (variant) {
    case 'success':
      return {
        backgroundColor: '#D1FAE5', // emerald-100
        textColor: '#065F46', // emerald-800
      }
    case 'warning':
      return {
        backgroundColor: '#FEF3C7', // amber-100
        textColor: '#92400E', // amber-800
      }
    case 'error':
      return {
        backgroundColor: '#FEE2E2', // red-100
        textColor: SEMANTIC_COLORS.error,
      }
    case 'info':
      return {
        backgroundColor: '#DBEAFE', // blue-100
        textColor: '#1E40AF', // blue-800
      }
    case 'accent':
      return {
        backgroundColor: SEMANTIC_COLORS.accent,
        textColor: WB_COLORS[100],
      }
    case 'default':
    default:
      return {
        backgroundColor: WB_COLORS[20],
        textColor: SEMANTIC_COLORS.textSubtle,
      }
  }
}

/**
 * Badge 組件
 *
 * @example
 * ```tsx
 * <Badge variant="success">已完成</Badge>
 * <Badge variant="warning" size="sm">進行中</Badge>
 * <Badge variant="error">錯誤</Badge>
 * ```
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  style,
}: BadgeProps) {
  const { backgroundColor, textColor } = getVariantStyles(variant)
  const isSmall = size === 'sm'

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          paddingVertical: isSmall ? SPACING[0.5] : SPACING[1],
          paddingHorizontal: isSmall ? SPACING[1.5] : SPACING[2],
        },
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text
          style={{
            fontSize: isSmall ? FONT_SIZE.xs : FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.medium,
            color: textColor,
          }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
})

export default Badge
