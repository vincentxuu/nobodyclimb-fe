/**
 * Toast 組件
 *
 * 輕量提示組件
 */
import React, { useEffect, useCallback, createContext, useContext, useState } from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react-native'
import {
  SEMANTIC_COLORS,
  BORDER_RADIUS,
  SPACING,
  SHADOWS,
  WB_COLORS,
} from '@nobodyclimb/constants'
import { Text } from './Text'
import { Icon } from './Icon'
import { DURATION, EASING, springConfigStandard } from '@/theme/animations'
import type { LucideIcon } from 'lucide-react-native'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastConfig {
  /** 訊息內容 */
  message: string
  /** 變體 */
  variant?: ToastVariant
  /** 顯示時長（毫秒） */
  duration?: number
  /** 點擊回調 */
  onPress?: () => void
}

export interface ToastProps extends ToastConfig {
  /** 是否顯示 */
  visible: boolean
  /** 關閉回調 */
  onHide: () => void
}

/**
 * 取得變體圖標和顏色
 */
function getVariantConfig(variant: ToastVariant): {
  icon: LucideIcon
  backgroundColor: string
  iconColor: string
} {
  switch (variant) {
    case 'success':
      return {
        icon: CheckCircle,
        backgroundColor: '#D1FAE5',
        iconColor: '#059669',
      }
    case 'error':
      return {
        icon: AlertCircle,
        backgroundColor: '#FEE2E2',
        iconColor: SEMANTIC_COLORS.error,
      }
    case 'warning':
      return {
        icon: AlertTriangle,
        backgroundColor: '#FEF3C7',
        iconColor: '#D97706',
      }
    case 'info':
    default:
      return {
        icon: Info,
        backgroundColor: '#DBEAFE',
        iconColor: '#2563EB',
      }
  }
}

/**
 * Toast 組件
 */
export function Toast({
  visible,
  message,
  variant = 'info',
  duration = 3000,
  onHide,
  onPress,
}: ToastProps) {
  const insets = useSafeAreaInsets()
  const translateY = useSharedValue(-100)
  const opacity = useSharedValue(0)

  const { icon, backgroundColor, iconColor } = getVariantConfig(variant)

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, springConfigStandard)
      opacity.value = withTiming(1, { duration: DURATION.fast, easing: EASING.standard })

      const timer = setTimeout(() => {
        onHide()
      }, duration)

      return () => clearTimeout(timer)
    } else {
      translateY.value = withTiming(-100, { duration: DURATION.fast, easing: EASING.standard })
      opacity.value = withTiming(0, { duration: DURATION.fast, easing: EASING.standard })
    }
  }, [visible, duration, onHide, translateY, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  if (!visible) return null

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + SPACING[2] },
        animatedStyle,
      ]}
    >
      <View style={[styles.toast, { backgroundColor }, SHADOWS.md]}>
        <Icon icon={icon} size="md" color={iconColor} />
        <Text variant="body" color="main" style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  )
}

// ============================================
// Toast Context & Provider
// ============================================

interface ToastOptions {
  title?: string
  description?: string
  message?: string
  variant?: ToastVariant | 'destructive'
  duration?: number
}

interface ToastContextValue {
  show: (config: ToastConfig) => void
  hide: () => void
  toast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null)
  const [visible, setVisible] = useState(false)

  const show = useCallback((config: ToastConfig) => {
    setToastConfig(config)
    setVisible(true)
  }, [])

  const hide = useCallback(() => {
    setVisible(false)
  }, [])

  // Compatibility function for title/description API
  const toast = useCallback((options: ToastOptions) => {
    const message = options.message || options.title || ''
    const description = options.description
    const fullMessage = description ? `${message}\n${description}` : message
    const variant: ToastVariant = options.variant === 'destructive' ? 'error' : (options.variant || 'info')

    show({
      message: fullMessage,
      variant,
      duration: options.duration,
    })
  }, [show])

  return (
    <ToastContext.Provider value={{ show, hide, toast }}>
      {children}
      {toastConfig && (
        <Toast
          visible={visible}
          onHide={hide}
          {...toastConfig}
        />
      )}
    </ToastContext.Provider>
  )
}

/**
 * 使用 Toast
 *
 * @example
 * ```tsx
 * const toast = useToast()
 * toast.show({ message: '操作成功', variant: 'success' })
 * ```
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING[4],
    right: SPACING[4],
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[4],
    borderRadius: BORDER_RADIUS.lg,
  },
  message: {
    flex: 1,
    marginLeft: SPACING[3],
  },
})

export default Toast
