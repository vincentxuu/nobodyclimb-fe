/**
 * EmptyState 組件
 *
 * 空狀態顯示組件
 */
import React from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { Inbox } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Text } from './Text'
import { Button, type ButtonProps } from './Button'
import { Icon } from './Icon'
import type { LucideIcon } from 'lucide-react-native'

export interface EmptyStateProps {
  /** 圖標（可以是 LucideIcon 組件或 React 元素） */
  icon?: LucideIcon | React.ReactElement
  /** 標題 */
  title: string
  /** 描述文字 */
  description?: string
  /** 操作按鈕文字 */
  actionLabel?: string
  /** 操作按鈕回調 */
  onAction?: () => void
  /** 操作按鈕屬性 */
  actionProps?: Partial<ButtonProps>
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 空狀態組件
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Search}
 *   title="找不到結果"
 *   description="請嘗試其他搜尋條件"
 *   actionLabel="重新搜尋"
 *   onAction={() => {}}
 * />
 * ```
 */
export function EmptyState({
  icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionProps,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        {React.isValidElement(icon) ? (
          icon
        ) : (
          <Icon icon={icon as LucideIcon} size="xl" color={SEMANTIC_COLORS.textMuted} />
        )}
      </View>
      <Text variant="h4" color="main" align="center" style={styles.title}>
        {title}
      </Text>
      {description && (
        <Text variant="body" color="subtle" align="center" style={styles.description}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="md"
          onPress={onAction}
          style={styles.action}
          {...actionProps}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING[6],
  },
  iconContainer: {
    marginBottom: SPACING[4],
  },
  title: {
    marginBottom: SPACING[2],
  },
  description: {
    marginBottom: SPACING[4],
    maxWidth: 280,
  },
  action: {
    marginTop: SPACING[2],
  },
})

export default EmptyState
