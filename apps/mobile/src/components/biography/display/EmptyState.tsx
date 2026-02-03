/**
 * EmptyState 組件
 *
 * 空狀態顯示，對應 apps/web/src/components/biography/display/EmptyState.tsx
 */
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { FileText, PenSquare } from 'lucide-react-native'

import { Text, Button } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

interface EmptyStateProps {
  /** 標題 */
  title?: string
  /** 描述 */
  description?: string
  /** 是否為擁有者 */
  isOwner?: boolean
  /** 添加按鈕文字 */
  addButtonText?: string
  /** 添加按鈕回調 */
  onAdd?: () => void
  /** 圖標 */
  icon?: React.ReactNode
}

export function EmptyState({
  title = '還沒有內容',
  description,
  isOwner = false,
  addButtonText = '新增內容',
  onAdd,
  icon,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {icon || <FileText size={48} color={SEMANTIC_COLORS.textMuted} />}
      </View>

      <Text variant="body" fontWeight="500" style={styles.title}>
        {title}
      </Text>

      {description && (
        <Text variant="small" color="textSubtle" style={styles.description}>
          {description}
        </Text>
      )}

      {isOwner && onAdd && (
        <Button
          variant="secondary"
          size="sm"
          onPress={onAdd}
          style={styles.button}
        >
          <PenSquare size={16} color={SEMANTIC_COLORS.textMain} />
          <Text fontWeight="500">{addButtonText}</Text>
        </Button>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.md,
  },
  iconContainer: {
    marginBottom: SPACING.md,
    opacity: 0.5,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginTop: SPACING.xs,
    maxWidth: 280,
  },
  button: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
})

export default EmptyState
