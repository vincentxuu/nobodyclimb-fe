/**
 * ListItem 組件
 *
 * 列表項目組件
 */
import React, { useCallback } from 'react'
import {
  Pressable,
  View,
  StyleSheet,
  type ViewStyle,
  type PressableProps,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import { ChevronRight } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { Text } from './Text'
import { Icon } from './Icon'
import { Divider } from './Divider'
import { DURATION, EASING } from '@/theme/animations'
import type { LucideIcon } from 'lucide-react-native'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface ListItemProps extends Omit<PressableProps, 'style'> {
  /** 標題 */
  title: string
  /** 描述文字 */
  description?: string
  /** 左側圖標（可以是 LucideIcon 組件或 React 元素） */
  leftIcon?: LucideIcon | React.ReactElement
  /** 右側內容 */
  rightContent?: React.ReactNode
  /** 是否顯示箭頭 */
  showChevron?: boolean
  /** 是否顯示分隔線 */
  showDivider?: boolean
  /** 禁用狀態 */
  disabled?: boolean
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 列表項目組件
 *
 * @example
 * ```tsx
 * <ListItem
 *   title="個人資料"
 *   leftIcon={User}
 *   showChevron
 *   onPress={() => {}}
 * />
 *
 * <ListItem
 *   title="通知設定"
 *   description="管理您的通知偏好"
 *   leftIcon={Bell}
 *   rightContent={<Switch />}
 * />
 * ```
 */
export function ListItem({
  title,
  description,
  leftIcon,
  rightContent,
  showChevron = false,
  showDivider = false,
  disabled = false,
  style,
  onPressIn,
  onPressOut,
  ...props
}: ListItemProps) {
  const backgroundColor = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor:
      backgroundColor.value === 1
        ? WB_COLORS[10]
        : 'transparent',
  }))

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      if (!disabled) {
        backgroundColor.value = withTiming(1, {
          duration: DURATION.fast,
          easing: EASING.standard,
        })
      }
      onPressIn?.(e)
    },
    [backgroundColor, disabled, onPressIn]
  )

  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      backgroundColor.value = withTiming(0, {
        duration: DURATION.fast,
        easing: EASING.standard,
      })
      onPressOut?.(e)
    },
    [backgroundColor, onPressOut]
  )

  return (
    <>
      <AnimatedPressable
        style={[styles.container, animatedStyle, style]}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        {leftIcon && (
          <View style={styles.leftIcon}>
            {React.isValidElement(leftIcon) ? (
              leftIcon
            ) : (
              <Icon
                icon={leftIcon as LucideIcon}
                size="md"
                color={disabled ? SEMANTIC_COLORS.textDisabled : SEMANTIC_COLORS.textSubtle}
              />
            )}
          </View>
        )}
        <View style={styles.content}>
          <Text
            variant="body"
            color={disabled ? 'disabled' : 'main'}
          >
            {title}
          </Text>
          {description && (
            <Text
              variant="caption"
              color={disabled ? 'disabled' : 'subtle'}
              style={styles.description}
            >
              {description}
            </Text>
          )}
        </View>
        {rightContent && (
          <View style={styles.rightContent}>{rightContent}</View>
        )}
        {showChevron && (
          <Icon
            icon={ChevronRight}
            size="sm"
            color={disabled ? SEMANTIC_COLORS.textDisabled : SEMANTIC_COLORS.textMuted}
          />
        )}
      </AnimatedPressable>
      {showDivider && <Divider style={styles.divider} />}
    </>
  )
}

// ============================================
// ListSection 組件
// ============================================

export interface ListSectionProps {
  /** 區塊標題 */
  title?: string
  /** 子元素 */
  children: React.ReactNode
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 列表區塊
 */
export function ListSection({ title, children, style }: ListSectionProps) {
  return (
    <View style={[styles.section, style]}>
      {title && (
        <Text variant="caption" color="muted" style={styles.sectionTitle}>
          {title}
        </Text>
      )}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    minHeight: 56,
  },
  leftIcon: {
    marginRight: SPACING[3],
  },
  content: {
    flex: 1,
  },
  description: {
    marginTop: SPACING[0.5],
  },
  rightContent: {
    marginLeft: SPACING[2],
  },
  divider: {
    marginLeft: SPACING[4] + 24 + SPACING[3], // padding + icon + gap
  },
  // ListSection styles
  section: {
    marginBottom: SPACING[4],
  },
  sectionTitle: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
  },
})

export default ListItem
