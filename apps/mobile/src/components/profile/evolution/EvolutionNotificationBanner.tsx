/**
 * EvolutionNotificationBanner - 演化通知橫幅
 *
 * 在個人頁面顯示未讀的演化通知，點擊跳轉至演化頁面
 */
import { getPersonalityType, SPACING } from '@nobodyclimb/constants'
import type { PersonalityTypeCode } from '@nobodyclimb/types'
import { useRouter } from 'expo-router'
import { Sparkles, X } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'
import { useEvolutionNotification, useMarkNotificationRead } from '@/lib/hooks/useEvolution'

export default function EvolutionNotificationBanner() {
  const router = useRouter()
  const { data: notification } = useEvolutionNotification()
  const markRead = useMarkNotificationRead()

  if (!notification?.has_notification || !notification.evolution) {
    return null
  }

  const { evolution } = notification
  const toName =
    getPersonalityType(evolution.to_type as PersonalityTypeCode)?.nameZh ?? evolution.to_type
  const fromName = evolution.from_type
    ? (getPersonalityType(evolution.from_type as PersonalityTypeCode)?.nameZh ??
      evolution.from_type)
    : null

  const handlePress = () => {
    router.push('/profile/evolution' as any)
  }

  const handleDismiss = () => {
    markRead.mutate()
  }

  return (
    <Pressable style={styles.banner} onPress={handlePress}>
      <View style={styles.iconWrapper}>
        <Sparkles size={18} color="#047857" />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>你的攀岩人格已演化！</Text>
        <Text style={styles.subtitle}>
          {fromName ? `${fromName} → ${toName}` : toName}
          ，點擊查看詳情
        </Text>
      </View>
      <Pressable
        style={styles.closeBtn}
        onPress={(e) => {
          e.stopPropagation()
          handleDismiss()
        }}
        hitSlop={8}
      >
        <X size={16} color="#047857" />
      </Pressable>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5', // emerald-50
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0', // emerald-200
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5', // emerald-100
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46', // emerald-800
  },
  subtitle: {
    fontSize: 12,
    color: '#047857', // emerald-700
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
