/**
 * Header 組件
 *
 * 頁面頭部導航欄
 */
import React from 'react'
import { View, StyleSheet, type ViewStyle, Platform } from 'react-native'
import { useRouter, useNavigation } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, FONT_SIZE, FONT_WEIGHT } from '@nobodyclimb/constants'
import { Text } from '@/components/ui/Text'
import { IconButton } from '@/components/ui/IconButton'
import type { LucideIcon } from 'lucide-react-native'

export interface HeaderAction {
  /** 圖標 */
  icon: LucideIcon
  /** 點擊回調 */
  onPress: () => void
  /** 禁用狀態 */
  disabled?: boolean
}

export interface HeaderProps {
  /** 標題 */
  title?: string
  /** 是否顯示返回按鈕 */
  showBack?: boolean
  /** 返回按鈕回調 */
  onBack?: () => void
  /** 左側操作按鈕 */
  leftAction?: HeaderAction
  /** 右側操作按鈕列表 */
  rightActions?: HeaderAction[]
  /** 自定義左側內容 */
  leftContent?: React.ReactNode
  /** 自定義右側內容 */
  rightContent?: React.ReactNode
  /** 是否透明背景 */
  transparent?: boolean
  /** 自定義樣式 */
  style?: ViewStyle
}

const HEADER_HEIGHT = 56

/**
 * 頁面頭部導航欄
 *
 * @example
 * ```tsx
 * <Header title="個人資料" showBack />
 *
 * <Header
 *   title="設定"
 *   showBack
 *   rightActions={[
 *     { icon: Save, onPress: handleSave },
 *   ]}
 * />
 * ```
 */
export function Header({
  title,
  showBack = false,
  onBack,
  leftAction,
  rightActions = [],
  leftContent,
  rightContent,
  transparent = false,
  style,
}: HeaderProps) {
  const router = useRouter()
  const navigation = useNavigation()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      router.back()
    }
  }

  const renderLeftContent = () => {
    if (leftContent) return leftContent

    if (showBack) {
      return (
        <IconButton
          icon={ArrowLeft}
          size="md"
          variant="ghost"
          onPress={handleBack}
        />
      )
    }

    if (leftAction) {
      return (
        <IconButton
          icon={leftAction.icon}
          size="md"
          variant="ghost"
          onPress={leftAction.onPress}
          disabled={leftAction.disabled}
        />
      )
    }

    return <View style={styles.placeholder} />
  }

  const renderRightContent = () => {
    if (rightContent) return rightContent

    if (rightActions.length > 0) {
      return (
        <View style={styles.rightActions}>
          {rightActions.map((action, index) => (
            <IconButton
              key={index}
              icon={action.icon}
              size="md"
              variant="ghost"
              onPress={action.onPress}
              disabled={action.disabled}
              style={index > 0 ? styles.actionMargin : undefined}
            />
          ))}
        </View>
      )
    }

    return <View style={styles.placeholder} />
  }

  return (
    <View
      style={[
        styles.container,
        !transparent && styles.withBackground,
        style,
      ]}
    >
      <View style={styles.left}>{renderLeftContent()}</View>
      <View style={styles.center}>
        {title && (
          <Text
            variant="bodyBold"
            color="main"
            style={styles.title}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
      </View>
      <View style={styles.right}>{renderRightContent()}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[2],
  },
  withBackground: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: SEMANTIC_COLORS.border,
  },
  left: {
    width: 48,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    width: 48,
    alignItems: 'flex-end',
  },
  title: {
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionMargin: {
    marginLeft: SPACING[1],
  },
})

export default Header
