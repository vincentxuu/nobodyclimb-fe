/**
 * 個人頁面
 *
 * 對應 apps/web/src/app/profile/page.tsx
 */
import React, { useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  User,
  ListChecks,
  Image as ImageIcon,
  FileText,
  Bookmark,
  Settings,
  ChevronRight,
  LogOut,
} from 'lucide-react-native'

import { Text, Avatar, Button, Divider } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface MenuItemProps {
  icon: React.ReactNode
  label: string
  onPress: () => void
  showArrow?: boolean
  destructive?: boolean
}

function MenuItem({
  icon,
  label,
  onPress,
  showArrow = true,
  destructive = false,
}: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        {icon}
        <Text
          style={destructive ? styles.destructiveText : undefined}
          fontWeight="500"
        >
          {label}
        </Text>
      </View>
      {showArrow && (
        <ChevronRight
          size={20}
          color={destructive ? '#D94A4A' : SEMANTIC_COLORS.textMuted}
        />
      )}
    </Pressable>
  )
}

export default function ProfileScreen() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()

  const handleLogin = useCallback(() => {
    router.push('/auth/login')
  }, [router])

  const handleLogout = useCallback(async () => {
    await logout()
    router.replace('/auth/login')
  }, [logout, router])

  const handleNavigate = useCallback(
    (path: string) => {
      router.push(path as any)
    },
    [router]
  )

  // 未登入狀態
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loginPrompt}>
          <User size={64} color={SEMANTIC_COLORS.textMuted} />
          <Text variant="h3" fontWeight="600" style={styles.loginTitle}>
            個人頁面
          </Text>
          <Text variant="body" color="textSubtle" style={styles.loginSubtitle}>
            登入以查看您的個人資料
          </Text>
          <Button variant="primary" size="lg" onPress={handleLogin}>
            <Text fontWeight="600" style={styles.buttonText}>
              登入
            </Text>
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  // 已登入狀態
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* 用戶資訊區 */}
        <View style={styles.userSection}>
          <Avatar
            size="xl"
            source={user?.avatar ? { uri: user.avatar } : undefined}
          />
          <View style={styles.userInfo}>
            <Text variant="h3" fontWeight="600">
              {user?.username || '用戶'}
            </Text>
            <Text variant="body" color="textSubtle">
              {user?.email}
            </Text>
          </View>
          <Pressable
            style={styles.editButton}
            onPress={() => handleNavigate('/profile/edit')}
          >
            <Text variant="small" fontWeight="500" color="textSubtle">
              編輯
            </Text>
          </Pressable>
        </View>

        {/* 主要選單 */}
        <View style={styles.menuSection}>
          <MenuItem
            icon={<User size={20} color={SEMANTIC_COLORS.textMain} />}
            label="我的人物誌"
            onPress={() => handleNavigate('/profile/biography')}
          />
          <MenuItem
            icon={<ListChecks size={20} color={SEMANTIC_COLORS.textMain} />}
            label="人生清單"
            onPress={() => handleNavigate('/profile/bucket-list')}
          />
          <MenuItem
            icon={<ImageIcon size={20} color={SEMANTIC_COLORS.textMain} />}
            label="我的照片"
            onPress={() => handleNavigate('/profile/photos')}
          />
          <MenuItem
            icon={<FileText size={20} color={SEMANTIC_COLORS.textMain} />}
            label="我的文章"
            onPress={() => handleNavigate('/profile/articles')}
          />
          <MenuItem
            icon={<Bookmark size={20} color={SEMANTIC_COLORS.textMain} />}
            label="我的收藏"
            onPress={() => handleNavigate('/profile/bookmarks')}
          />
        </View>

        <Divider style={styles.divider} />

        {/* 設定選單 */}
        <View style={styles.menuSection}>
          <MenuItem
            icon={<Settings size={20} color={SEMANTIC_COLORS.textMain} />}
            label="帳號設定"
            onPress={() => handleNavigate('/profile/settings')}
          />
          <MenuItem
            icon={<LogOut size={20} color="#D94A4A" />}
            label="登出"
            onPress={handleLogout}
            showArrow={false}
            destructive
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  scrollView: {
    flex: 1,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  loginTitle: {
    marginTop: SPACING.md,
  },
  loginSubtitle: {
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  buttonText: {
    color: '#FFFFFF',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    gap: SPACING.md,
  },
  userInfo: {
    flex: 1,
  },
  editButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F5F5F5',
  },
  menuSection: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    marginTop: SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  menuItemPressed: {
    backgroundColor: '#F5F5F5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  destructiveText: {
    color: '#D94A4A',
  },
  divider: {
    marginVertical: SPACING.sm,
  },
  bottomPadding: {
    height: SPACING.xxl,
  },
})
