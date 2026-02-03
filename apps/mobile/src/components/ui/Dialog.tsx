/**
 * Dialog 組件
 *
 * 居中彈窗組件
 */
import React from 'react'
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import {
  SEMANTIC_COLORS,
  BORDER_RADIUS,
  SPACING,
  WB_COLORS,
} from '@nobodyclimb/constants'
import { Text } from './Text'
import { Button, type ButtonVariant } from './Button'
import { springConfigStandard, DURATION, EASING } from '@/theme/animations'

export interface DialogAction {
  /** 按鈕文字 */
  label: string
  /** 點擊回調 */
  onPress: () => void
  /** 按鈕變體 */
  variant?: ButtonVariant
}

export interface DialogProps {
  /** 是否顯示 */
  visible: boolean
  /** 關閉回調 */
  onClose: () => void
  /** 標題 */
  title: string
  /** 內容 */
  message?: string
  /** 自定義內容 */
  children?: React.ReactNode
  /** 操作按鈕 */
  actions?: DialogAction[]
  /** 點擊背景是否關閉 */
  dismissible?: boolean
  /** 容器樣式 */
  style?: ViewStyle
}

/**
 * 對話框組件
 *
 * @example
 * ```tsx
 * <Dialog
 *   visible={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   title="確認刪除"
 *   message="您確定要刪除這個項目嗎？"
 *   actions={[
 *     { label: '取消', onPress: handleCancel, variant: 'secondary' },
 *     { label: '刪除', onPress: handleDelete, variant: 'destructive' },
 *   ]}
 * />
 * ```
 */
export function Dialog({
  visible,
  onClose,
  title,
  message,
  children,
  actions = [],
  dismissible = true,
  style,
}: DialogProps) {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.9)

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: DURATION.fast, easing: EASING.standard })
      scale.value = withSpring(1, springConfigStandard)
    } else {
      opacity.value = withTiming(0, { duration: DURATION.fast, easing: EASING.standard })
      scale.value = withTiming(0.9, { duration: DURATION.fast, easing: EASING.standard })
    }
  }, [visible, opacity, scale])

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  const handleBackdropPress = () => {
    if (dismissible) {
      onClose()
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />
        </Animated.View>
        <Animated.View style={[styles.dialog, contentStyle, style]}>
          <Text variant="h4" color="main" style={styles.title}>
            {title}
          </Text>
          {message && (
            <Text variant="body" color="subtle" style={styles.message}>
              {message}
            </Text>
          )}
          {children}
          {actions.length > 0 && (
            <View style={styles.actions}>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'primary'}
                  size="md"
                  onPress={action.onPress}
                  style={StyleSheet.flatten([
                    styles.action,
                    index > 0 ? styles.actionMargin : undefined,
                    actions.length === 1 ? styles.actionFull : undefined,
                  ])}
                >
                  {action.label}
                </Button>
              ))}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING[6],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING[6],
    width: '100%',
    maxWidth: 340,
  },
  title: {
    marginBottom: SPACING[2],
    textAlign: 'center',
  },
  message: {
    marginBottom: SPACING[4],
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    marginTop: SPACING[4],
  },
  action: {
    flex: 1,
  },
  actionMargin: {
    marginLeft: SPACING[3],
  },
  actionFull: {
    flex: 1,
  },
})

export default Dialog
