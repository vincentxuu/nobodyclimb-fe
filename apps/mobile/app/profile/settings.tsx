/**
 * 帳號設定頁面
 *
 * 對應 apps/web/src/app/profile/settings/page.tsx
 */
import React, { useState, useCallback } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Lock,
  Eye,
  Trash2,
  HelpCircle,
  FileText,
  Shield,
} from 'lucide-react-native'

import { Text, IconButton, Divider } from '@/components/ui'
import { ProtectedRoute } from '@/components/shared'
import { useAuthStore } from '@/store/authStore'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface SettingItemProps {
  icon: React.ReactNode
  label: string
  onPress?: () => void
  rightElement?: React.ReactNode
  destructive?: boolean
}

function SettingItem({
  icon,
  label,
  onPress,
  rightElement,
  destructive = false,
}: SettingItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingItem,
        pressed && styles.settingItemPressed,
      ]}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View style={styles.settingLeft}>
        {icon}
        <Text
          fontWeight="500"
          style={destructive ? styles.destructiveText : undefined}
        >
          {label}
        </Text>
      </View>
      {rightElement || (onPress && (
        <ChevronRight
          size={20}
          color={destructive ? '#D94A4A' : SEMANTIC_COLORS.textMuted}
        />
      ))}
    </Pressable>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const { logout } = useAuthStore()

  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [privateProfile, setPrivateProfile] = useState(false)

  const handleBack = () => {
    router.back()
  }

  const handleChangePassword = () => {
    Alert.alert('變更密碼', '此功能開發中')
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      '刪除帳號',
      '確定要刪除你的帳號嗎？此操作無法復原。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            // TODO: 實作刪除帳號
            await logout()
            router.replace('/auth/login')
          },
        },
      ]
    )
  }

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 導航列 */}
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
          <Text variant="h3" fontWeight="600">
            帳號設定
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView}>
          {/* 通知設定 */}
          <View style={styles.section}>
            <Text variant="small" color="textMuted" style={styles.sectionTitle}>
              通知
            </Text>
            <SettingItem
              icon={<Bell size={20} color={SEMANTIC_COLORS.textMain} />}
              label="推播通知"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ true: '#FFE70C', false: '#D3D3D3' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>

          {/* 隱私設定 */}
          <View style={styles.section}>
            <Text variant="small" color="textMuted" style={styles.sectionTitle}>
              隱私
            </Text>
            <SettingItem
              icon={<Eye size={20} color={SEMANTIC_COLORS.textMain} />}
              label="私人檔案"
              rightElement={
                <Switch
                  value={privateProfile}
                  onValueChange={setPrivateProfile}
                  trackColor={{ true: '#FFE70C', false: '#D3D3D3' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>

          {/* 安全設定 */}
          <View style={styles.section}>
            <Text variant="small" color="textMuted" style={styles.sectionTitle}>
              安全
            </Text>
            <SettingItem
              icon={<Lock size={20} color={SEMANTIC_COLORS.textMain} />}
              label="變更密碼"
              onPress={handleChangePassword}
            />
          </View>

          {/* 關於 */}
          <View style={styles.section}>
            <Text variant="small" color="textMuted" style={styles.sectionTitle}>
              關於
            </Text>
            <SettingItem
              icon={<HelpCircle size={20} color={SEMANTIC_COLORS.textMain} />}
              label="幫助中心"
              onPress={() => {}}
            />
            <SettingItem
              icon={<FileText size={20} color={SEMANTIC_COLORS.textMain} />}
              label="使用條款"
              onPress={() => {}}
            />
            <SettingItem
              icon={<Shield size={20} color={SEMANTIC_COLORS.textMain} />}
              label="隱私政策"
              onPress={() => {}}
            />
          </View>

          {/* 危險區域 */}
          <View style={styles.section}>
            <Text variant="small" color="textMuted" style={styles.sectionTitle}>
              帳號
            </Text>
            <SettingItem
              icon={<Trash2 size={20} color="#D94A4A" />}
              label="刪除帳號"
              onPress={handleDeleteAccount}
              destructive
            />
          </View>

          {/* 版本資訊 */}
          <View style={styles.versionSection}>
            <Text variant="small" color="textMuted">
              NobodyClimb v1.0.0
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ProtectedRoute>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  settingItemPressed: {
    backgroundColor: '#F5F5F5',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  destructiveText: {
    color: '#D94A4A',
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
})
