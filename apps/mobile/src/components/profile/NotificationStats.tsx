import { SEMANTIC_COLORS, WB_COLORS } from '@nobodyclimb/constants'
import { Bell, Inbox } from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'
import { Icon } from '../ui/Icon'
import { Text } from '../ui/Text'

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
    backgroundColor: SEMANTIC_COLORS.error, // red-500
  },
  totalIcon: {
    backgroundColor: SEMANTIC_COLORS.info, // blue-500
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
