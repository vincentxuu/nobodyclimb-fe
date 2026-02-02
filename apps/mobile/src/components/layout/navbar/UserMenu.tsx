/**
 * UserMenu 組件
 *
 * 用戶選單，對應 apps/web/src/components/layout/navbar/UserMenu.tsx
 */
import React, { useCallback, useRef } from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import {
  User,
  ListChecks,
  Image,
  FileText,
  Bookmark,
  Settings,
  LogOut,
  PenSquare,
  Upload,
  Bell,
} from 'lucide-react-native'
import { XStack, YStack } from 'tamagui'

import { useAuthStore } from '@/store/authStore'
import { Text, Button, Avatar, IconButton, Divider } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

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
  const handleMenuItemPress = useCallback((path: string) => {
    bottomSheetRef.current?.close()
    router.push(path as any)
  }, [router])

  // 創作項目點擊
  const handleCreateItemPress = useCallback((path: string) => {
    createSheetRef.current?.close()
    router.push(path as any)
  }, [router])

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
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  )

  // 未登入時顯示登入按鈕
  if (!isAuthenticated) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onPress={handleLogin}
        style={styles.loginButton}
      >
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

        {/* 通知按鈕 */}
        <IconButton
          icon={<Bell size={20} color={SEMANTIC_COLORS.textMain} />}
          onPress={() => router.push('/notifications' as any)}
          variant="ghost"
        />

        {/* 用戶頭像 */}
        <Pressable onPress={handleOpenUserMenu}>
          <Avatar
            size="sm"
            source={user?.avatar ? { uri: user.avatar } : undefined}
          />
        </Pressable>
      </XStack>

      {/* 用戶選單 BottomSheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['60%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <BottomSheetView style={styles.sheetContent}>
          {/* 用戶資訊 */}
          <XStack alignItems="center" gap={SPACING.sm} marginBottom={SPACING.md}>
            <Avatar
              size="lg"
              source={user?.avatar ? { uri: user.avatar } : undefined}
            />
            <YStack flex={1}>
              <Text fontWeight="600">{user?.username || '用戶'}</Text>
              <Text variant="small" color="textSubtle">
                {user?.email}
              </Text>
            </YStack>
          </XStack>

          <Divider marginVertical={SPACING.sm} />

          {/* 選單項目 */}
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

          <Divider marginVertical={SPACING.sm} />

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
        </BottomSheetView>
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
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
    >
      {icon}
      <Text
        style={labelColor ? { color: labelColor } : undefined}
        fontWeight="500"
      >
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
    backgroundColor: '#FFFFFF',
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  menuItemPressed: {
    backgroundColor: '#F5F5F5',
  },
})

export default UserMenu
