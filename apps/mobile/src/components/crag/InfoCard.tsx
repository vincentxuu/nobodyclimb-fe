/**
 * 岩場資訊卡片組件
 *
 * 對應 apps/web/src/components/crag/info-card.tsx
 */
import React, { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { Text } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface InfoCardProps {
  title: string
  children: ReactNode
  icon?: ReactNode
}

export function InfoCard({ title, children, icon }: InfoCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text variant="body" fontWeight="600" color="textMain">
          {title}
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.content}>{children}</View>
    </View>
  )
}

interface InfoRowProps {
  label: string
  value: string | ReactNode
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text variant="small" color="textMuted" style={styles.label}>
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text variant="small" color="textSubtle" style={styles.value}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  icon: {
    marginRight: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: SPACING.sm,
  },
  content: {
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    width: 80,
    flexShrink: 0,
  },
  value: {
    flex: 1,
    lineHeight: 20,
  },
})
