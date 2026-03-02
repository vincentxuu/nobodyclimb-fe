import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Bell, Inbox } from 'lucide-react-native'
import { Text } from '../ui/Text'
import { Icon } from '../ui/Icon'
import { SEMANTIC_COLORS, WB_COLORS } from '@nobodyclimb/constants'

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
          <Icon icon={Bell} size="sm" color={WB_COLORS[0]} />
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
          <Icon icon={Inbox} size="sm" color={WB_COLORS[0]} />
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
    backgroundColor: WB_COLORS[0],
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
    backgroundColor: '#EF4444', // red-500
  },
  totalIcon: {
    backgroundColor: '#3B82F6', // blue-500
  },
  statInfo: {
    gap: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: WB_COLORS[20],
    marginHorizontal: 16,
  },
})
