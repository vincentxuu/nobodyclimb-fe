/**
 * PrivateEmptyState 組件
 *
 * 私人空狀態顯示，對應 apps/web/src/components/biography/display/PrivateEmptyState.tsx
 */
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Lock, EyeOff } from 'lucide-react-native'

import { Text } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface PrivateEmptyStateProps {
  /** 標題 */
  title?: string
  /** 描述文字 */
  description?: string
  /** 顯示的圖標類型 */
  icon?: 'lock' | 'eye-off'
}

/**
 * 私人內容空狀態組件
 *
 * 當用戶設定內容為私人時顯示
 */
export function PrivateEmptyState({
  title = '此內容為私人',
  description = '這位攀岩者選擇不公開此內容',
  icon = 'lock',
}: PrivateEmptyStateProps) {
  const IconComponent = icon === 'lock' ? Lock : EyeOff

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <IconComponent size={32} color={SEMANTIC_COLORS.textMuted} />
      </View>
      <Text variant="body" fontWeight="600" style={styles.title}>
        {title}
      </Text>
      <Text variant="small" color="textMuted" style={styles.description}>
        {description}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: '#F9F9F9',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#EBEAEA',
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
})

export default PrivateEmptyState
