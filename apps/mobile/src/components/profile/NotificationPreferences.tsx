import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '../ui/Text'
import { Switch } from '../ui/Switch'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'

interface NotificationSetting {
  id: string
  label: string
  description: string
  enabled: boolean
}

interface NotificationPreferencesProps {
  settings?: NotificationSetting[]
  onToggle?: (id: string, enabled: boolean) => void
}

const DEFAULT_SETTINGS: NotificationSetting[] = [
  {
    id: 'new_followers',
    label: '新追蹤者',
    description: '有人追蹤你時收到通知',
    enabled: true,
  },
  {
    id: 'comments',
    label: '留言',
    description: '有人在你的內容下留言時收到通知',
    enabled: true,
  },
  {
    id: 'likes',
    label: '按讚',
    description: '有人按讚你的內容時收到通知',
    enabled: false,
  },
  {
    id: 'mentions',
    label: '提及',
    description: '有人提及你時收到通知',
    enabled: true,
  },
  {
    id: 'updates',
    label: '系統更新',
    description: '收到新功能和重要更新通知',
    enabled: true,
  },
]

export default function NotificationPreferences({
  settings = DEFAULT_SETTINGS,
  onToggle,
}: NotificationPreferencesProps) {
  return (
    <View style={styles.container}>
      <Text variant="bodyBold" style={{ color: SEMANTIC_COLORS.textMain, marginBottom: 16 }}>
        通知設定
      </Text>

      {settings.map((setting, index) => (
        <View
          key={setting.id}
          style={[
            styles.settingRow,
            index < settings.length - 1 && styles.settingRowBorder,
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
            checked={setting.enabled}
            onCheckedChange={(checked) => onToggle?.(setting.id, checked)}
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
