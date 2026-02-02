/**
 * Divider 組件
 *
 * 分隔線組件
 */
import React from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

export type DividerOrientation = 'horizontal' | 'vertical'

export interface DividerProps {
  /** 方向 */
  orientation?: DividerOrientation
  /** 顏色 */
  color?: string
  /** 間距 (上下或左右) */
  spacing?: number
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 分隔線組件
 *
 * @example
 * ```tsx
 * <Divider />
 * <Divider spacing={16} />
 * <Divider orientation="vertical" />
 * ```
 */
export function Divider({
  orientation = 'horizontal',
  color = SEMANTIC_COLORS.border,
  spacing = 0,
  style,
}: DividerProps) {
  const isHorizontal = orientation === 'horizontal'

  return (
    <View
      style={[
        isHorizontal ? styles.horizontal : styles.vertical,
        {
          backgroundColor: color,
          ...(isHorizontal
            ? { marginVertical: spacing }
            : { marginHorizontal: spacing }),
        },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
})

export default Divider
