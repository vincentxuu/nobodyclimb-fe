import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'
import * as Notifications from 'expo-notifications'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Linking, StyleSheet, View } from 'react-native'
import { apiClient } from '@/lib/api'
import { registerPushToken } from '@/lib/pushNotifications'
import { Button } from '../ui/Button'
import { Switch } from '../ui/Switch'
import { Text } from '../ui/Text'

interface NotificationPreferencesState {
  goal_liked: boolean
  goal_commented: boolean
  goal_referenced: boolean
  post_liked: boolean
  post_commented: boolean
  biography_commented: boolean
  new_follower: boolean
  story_featured: boolean
  goal_completed: boolean
  email_digest: boolean
}

type NotificationPreferenceKey = keyof NotificationPreferencesState

interface NotificationSetting {
  id: NotificationPreferenceKey
  label: string
  description: string
  disabled?: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferencesState = {
  goal_liked: true,
  goal_commented: true,
  goal_referenced: true,
  post_liked: true,
  post_commented: true,
  biography_commented: true,
  new_follower: true,
  story_featured: true,
  goal_completed: true,
  email_digest: false,
}

const DEFAULT_SETTINGS: NotificationSetting[] = [
  {
    id: 'goal_liked',
    label: '目標被按讚',
    description: '有人按讚你的人生清單目標時通知',
  },
  {
    id: 'goal_commented',
    label: '目標被留言',
    description: '有人在你的目標下留言時通知',
  },
  {
    id: 'goal_referenced',
    label: '目標被引用',
    description: '有人受到你的目標啟發時通知',
  },
  {
    id: 'post_liked',
    label: '文章被按讚',
    description: '有人按讚你的文章時通知',
  },
  {
    id: 'post_commented',
    label: '文章被留言',
    description: '有人在你的文章下留言時通知',
  },
  {
    id: 'biography_commented',
    label: '人物誌被留言',
    description: '有人在你的人物誌留言時通知',
  },
  {
    id: 'new_follower',
    label: '新追蹤者',
    description: '有人追蹤你時通知',
  },
  {
    id: 'goal_completed',
    label: '目標完成',
    description: '你的目標完成狀態更新時通知',
  },
  {
    id: 'story_featured',
    label: '故事精選',
    description: '你的故事被精選時通知',
  },
  {
    id: 'email_digest',
    label: 'Email 摘要',
    description: '定期接收通知摘要',
    disabled: true,
  },
]

type PushPermissionStatus = 'granted' | 'denied' | 'undetermined'

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferencesState>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(true)
  const [savingKeys, setSavingKeys] = useState<Set<NotificationPreferenceKey>>(new Set())
  const [pushStatus, setPushStatus] = useState<PushPermissionStatus | null>(null)
  const [isEnablingPush, setIsEnablingPush] = useState(false)

  useEffect(() => {
    Notifications.getPermissionsAsync()
      .then(({ status }) => setPushStatus(status as PushPermissionStatus))
      .catch(() => setPushStatus(null))
  }, [])

  // 請求推播權限並註冊 token
  const handleEnablePush = useCallback(async () => {
    setIsEnablingPush(true)
    try {
      if (pushStatus === 'denied') {
        // 已被拒絕時只能從系統設定開啟
        await Linking.openSettings()
        return
      }
      await registerPushToken()
      const { status } = await Notifications.getPermissionsAsync()
      setPushStatus(status as PushPermissionStatus)
    } finally {
      setIsEnablingPush(false)
    }
  }, [pushStatus])

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await apiClient.get('/notifications/preferences')
        const data = response.data?.data ?? response.data
        if (data) {
          setPreferences({ ...DEFAULT_PREFERENCES, ...data })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '請稍後再試'
        Alert.alert('通知設定載入失敗', message)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [])

  const handleToggle = useCallback(async (key: NotificationPreferenceKey, value: boolean) => {
    setPreferences((current) => ({ ...current, [key]: value }))
    setSavingKeys((current) => new Set(current).add(key))

    try {
      const response = await apiClient.put('/notifications/preferences', { [key]: value })
      const success = response.data?.success ?? true
      if (!success) {
        throw new Error(response.data?.message ?? '通知設定更新失敗')
      }
    } catch (error) {
      setPreferences((current) => ({ ...current, [key]: !value }))
      const message = error instanceof Error ? error.message : '請稍後再試'
      Alert.alert('通知設定更新失敗', message)
    } finally {
      setSavingKeys((current) => {
        const next = new Set(current)
        next.delete(key)
        return next
      })
    }
  }, [])

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMain} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text variant="bodyBold" style={{ color: SEMANTIC_COLORS.textMain, marginBottom: 16 }}>
        通知設定
      </Text>

      {/* 原生推播權限 */}
      <View style={[styles.settingRow, styles.settingRowBorder]}>
        <View style={styles.settingInfo}>
          <Text variant="body" style={{ color: SEMANTIC_COLORS.textMain }}>
            推播通知
          </Text>
          <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted, marginTop: 2 }}>
            {pushStatus === 'granted'
              ? '已開啟，重要通知會推送到你的裝置'
              : pushStatus === 'denied'
                ? '已停用，可從系統設定重新開啟'
                : '開啟後重要通知會推送到你的裝置'}
          </Text>
        </View>
        {pushStatus !== 'granted' && (
          <Button variant="outline" size="sm" loading={isEnablingPush} onPress={handleEnablePush}>
            {pushStatus === 'denied' ? '前往設定' : '開啟'}
          </Button>
        )}
      </View>

      {DEFAULT_SETTINGS.map((setting, index) => (
        <View
          key={setting.id}
          style={[
            styles.settingRow,
            index < DEFAULT_SETTINGS.length - 1 && styles.settingRowBorder,
          ]}
        >
          <View style={styles.settingInfo}>
            <Text variant="body" style={{ color: SEMANTIC_COLORS.textMain }}>
              {setting.label}
            </Text>
            <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted, marginTop: 2 }}>
              {setting.description}
            </Text>
          </View>
          <Switch
            checked={preferences[setting.id]}
            disabled={setting.disabled || savingKeys.has(setting.id)}
            onCheckedChange={(checked) => handleToggle(setting.id, checked)}
          />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
})
