/**
 * UserMenu 組件
 *
 * 用戶選單，對應 apps/web/src/components/layout/navbar/UserMenu.tsx
 */

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import {
  BarChart3,
  Bookmark,
  Brain,
  Dumbbell,
  FileText,
  Image,
  ListChecks,
  LogOut,
  Mountain,
  PenSquare,
  Settings,
  Sparkles,
  Upload,
  User,
  Video,
} from 'lucide-react-native'
import React, { useCallback, useRef } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { XStack, YStack } from 'tamagui'
import { NotificationCenter } from '@/components/shared/NotificationCenter'
import { Avatar, Button, Divider, Text } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'

const EXPLORE_ITEMS = [
  {
    icon: <Sparkles size={20} color={SEMANTIC_COLORS.textMain} />,
    label: '人物誌',
    path: '/biography',
  },
  {
    icon: <Mountain size={20} color={SEMANTIC_COLORS.textMain} />,
    label: '岩場',
    path: '/crag',
  },
  {
    icon: <Dumbbell size={20} color={SEMANTIC_COLORS.textMain} />,
    label: '岩館',
    path: '/gym',
  },
  {
    icon: <Image size={20} color={SEMANTIC_COLORS.textMain} />,
    label: '照片牆',
    path: '/gallery',
  },
  {
    icon: <Video size={20} color={SEMANTIC_COLORS.textMain} />,
    label: '影片',
    path: '/videos',
  },
  {
    icon: <FileText size={20} color={SEMANTIC_COLORS.textMain} />,
    label: '文章',
    path: '/blog',
  },
] as const

/**
 * 用戶選單組件
 */
export function UserMenu() {
  const router = useRouter()
  const { isAuthenticated, logout, user } = useAuthStore()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const createSheetRef = useRef<BottomSheet>(null)

  // 打開用戶選單
  const handleOpenUserMenu = useCallback(() => {
    bottomSheetRef.current?.expand()
  }, [])

  // 打開創作選單
  const handleOpenCreateMenu = useCallback(() => {
    createSheetRef.current?.expand()
  }, [])

  // 選單項目點擊
  const handleMenuItemPress = useCallback(
    (path: string) => {
      bottomSheetRef.current?.close()
      router.push(path as any)
    },
    [router]
  )

  // 創作項目點擊
  const handleCreateItemPress = useCallback(
    (path: string) => {
      createSheetRef.current?.close()
      router.push(path as any)
    },
    [router]
  )

  // 登出
  const handleLogout = useCallback(async () => {
    bottomSheetRef.current?.close()
    await logout()
    router.replace('/auth/login')
  }, [logout, router])

  // 登入
  const handleLogin = useCallback(() => {
    router.push('/auth/login')
  }, [router])

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  )

  // 未登入時顯示登入按鈕
  if (!isAuthenticated) {
    return (
      <Button variant="secondary" size="sm" onPress={handleLogin} style={styles.loginButton}>
        <Text fontWeight="500">登入</Text>
      </Button>
    )
  }

  // 已登入時顯示用戶選單
  return (
    <>
      <XStack alignItems="center" gap={SPACING.sm}>
        {/* 創作按鈕 */}
        <Button
          variant="secondary"
          size="sm"
          onPress={handleOpenCreateMenu}
          style={styles.createButton}
        >
          <Text fontWeight="500">創作</Text>
        </Button>

        <NotificationCenter />

        {/* 用戶頭像 */}
        <Pressable onPress={handleOpenUserMenu}>
          <Avatar size="sm" source={user?.avatar ? { uri: user.avatar } : undefined} />
        </Pressable>
      </XStack>

      {/* 用戶選單 BottomSheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['80%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetScrollContent}>
          {/* 用戶資訊 */}
          <XStack alignItems="center" gap={SPACING.sm} marginBottom={SPACING.md}>
            <Avatar size="lg" source={user?.avatar ? { uri: user.avatar } : undefined} />
            <YStack flex={1}>
              <Text fontWeight="600">{user?.username || '用戶'}</Text>
              <Text variant="small" color="textSubtle">
                {user?.email}
              </Text>
            </YStack>
          </XStack>

          <Divider spacing={SPACING.sm} />

          {/* 選單項目 */}
          <Text variant="small" color="textSubtle" marginBottom={SPACING.xs}>
            探索
          </Text>
          <YStack gap={2}>
            {EXPLORE_ITEMS.map((item) => (
              <MenuItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                onPress={() => handleMenuItemPress(item.path)}
              />
            ))}
          </YStack>

          <Divider spacing={SPACING.sm} />

          <Text variant="small" color="textSubtle" marginBottom={SPACING.xs}>
            個人
          </Text>
          <YStack gap={2}>
            <MenuItem
              icon={<User size={20} color={SEMANTIC_COLORS.textMain} />}
              label="我的人物誌"
              onPress={() => handleMenuItemPress('/profile')}
            />
            <MenuItem
              icon={<ListChecks size={20} color={SEMANTIC_COLORS.textMain} />}
              label="人生清單"
              onPress={() => handleMenuItemPress('/profile/bucket-list')}
            />
            <MenuItem
              icon={<Dumbbell size={20} color={SEMANTIC_COLORS.textMain} />}
              label="攀爬紀錄"
              onPress={() => handleMenuItemPress('/profile/ascents')}
            />
            <MenuItem
              icon={<Sparkles size={20} color={SEMANTIC_COLORS.textMain} />}
              label="推薦"
              onPress={() => handleMenuItemPress('/profile/recommendations')}
            />
            <MenuItem
              icon={<Brain size={20} color={SEMANTIC_COLORS.textMain} />}
              label="AI 記憶"
              onPress={() => handleMenuItemPress('/profile/ai-memory')}
            />
            <MenuItem
              icon={<BarChart3 size={20} color={SEMANTIC_COLORS.textMain} />}
              label="成就統計"
              onPress={() => handleMenuItemPress('/profile/stats')}
            />
            <MenuItem
              icon={<Image size={20} color={SEMANTIC_COLORS.textMain} />}
              label="我的照片"
              onPress={() => handleMenuItemPress('/profile/photos')}
            />
            <MenuItem
              icon={<FileText size={20} color={SEMANTIC_COLORS.textMain} />}
              label="我的文章"
              onPress={() => handleMenuItemPress('/profile/articles')}
            />
            <MenuItem
              icon={<Bookmark size={20} color={SEMANTIC_COLORS.textMain} />}
              label="我的收藏"
              onPress={() => handleMenuItemPress('/profile/bookmarks')}
            />
          </YStack>

          <Divider spacing={SPACING.sm} />

          <YStack gap={2}>
            <MenuItem
              icon={<Settings size={20} color={SEMANTIC_COLORS.textMain} />}
              label="帳號設定"
              onPress={() => handleMenuItemPress('/profile/settings')}
            />
            <MenuItem
              icon={<LogOut size={20} color="#D94A4A" />}
              label="登出"
              onPress={handleLogout}
              labelColor="#D94A4A"
            />
          </YStack>
        </BottomSheetScrollView>
      </BottomSheet>

      {/* 創作選單 BottomSheet */}
      <BottomSheet
        ref={createSheetRef}
        index={-1}
        snapPoints={['25%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text variant="h4" fontWeight="600" marginBottom={SPACING.md}>
            創作
          </Text>
          <YStack gap={2}>
            <MenuItem
              icon={<PenSquare size={20} color={SEMANTIC_COLORS.textMain} />}
              label="發表文章"
              onPress={() => handleCreateItemPress('/blog/create')}
            />
            <MenuItem
              icon={<Upload size={20} color={SEMANTIC_COLORS.textMain} />}
              label="上傳照片"
              onPress={() => handleCreateItemPress('/upload')}
            />
          </YStack>
        </BottomSheetView>
      </BottomSheet>
    </>
  )
}

// 選單項目組件
interface MenuItemProps {
  icon: React.ReactNode
  label: string
  onPress: () => void
  labelColor?: string
}

function MenuItem({ icon, label, onPress, labelColor }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    >
      {icon}
      <Text style={labelColor ? { color: labelColor } : undefined} fontWeight="500">
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  loginButton: {
    height: 32,
    paddingHorizontal: SPACING.md,
  },
  createButton: {
    height: 32,
    paddingHorizontal: SPACING.md,
  },
  sheetBackground: {
    backgroundColor: WB_COLORS[0],
  },
  sheetIndicator: {
    backgroundColor: '#D3D3D3',
    width: 40,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  sheetScrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  menuItemPressed: {
    backgroundColor: WB_COLORS[10],
  },
})

export default UserMenu
