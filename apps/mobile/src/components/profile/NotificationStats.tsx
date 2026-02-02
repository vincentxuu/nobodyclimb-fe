import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '../ui/Text'
import { Icon } from '../ui/Icon'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'

interface NotificationStatsProps {
  unreadCount?: number
  totalCount?: number
}

export default function NotificationStats({
  unreadCount = 0,
  totalCount = 0,
}: NotificationStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <View style={[styles.iconWrapper, styles.unreadIcon]}>
          <Icon name="Bell" size="sm" color={COLORS.white} />
        </View>
        <View style={styles.statInfo}>
          <Text variant="h3" style={{ color: SEMANTIC_COLORS.textMain }}>
            {unreadCount}
          </Text>
          <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted }}>
            未讀通知
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statItem}>
        <View style={[styles.iconWrapper, styles.totalIcon]}>
          <Icon name="Inbox" size="sm" color={COLORS.white} />
        </View>
        <View style={styles.statInfo}>
          <Text variant="h3" style={{ color: SEMANTIC_COLORS.textMain }}>
            {totalCount}
          </Text>
          <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted }}>
            總通知數
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadIcon: {
    backgroundColor: COLORS.red[500],
  },
  totalIcon: {
    backgroundColor: COLORS.blue[500],
  },
  statInfo: {
    gap: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.gray[200],
    marginHorizontal: 16,
  },
})
