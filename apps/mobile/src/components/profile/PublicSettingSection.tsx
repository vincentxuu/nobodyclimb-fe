import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '../ui/Text'
import { Switch } from '../ui/Switch'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'

interface PublicSettingSectionProps {
  isPublic: boolean
  isMobile?: boolean
  onChange: (field: string, value: boolean) => void
}

export default function PublicSettingSection({
  isPublic,
  onChange,
}: PublicSettingSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text variant="bodyBold" style={{ color: SEMANTIC_COLORS.textMain }}>
            公開個人頁面
          </Text>
          <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted, marginTop: 4 }}>
            {isPublic
              ? '其他人可以看到你的個人頁面'
              : '只有你自己可以看到個人頁面'}
          </Text>
        </View>
        <Switch
          checked={isPublic}
          onCheckedChange={(checked) => onChange('isPublic', checked)}
        />
      </View>
      {!isPublic && (
        <View style={styles.warningBox}>
          <Text variant="caption" style={{ color: COLORS.orange[700] }}>
            你的個人頁面目前設為私人，其他人無法搜尋或瀏覽你的頁面。
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  warningBox: {
    backgroundColor: COLORS.orange[50],
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.orange[200],
  },
})
