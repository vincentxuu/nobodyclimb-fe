/**
 * Popover 組件
 *
 * 彈出提示框組件，在 React Native 中使用 Modal 實現
 * 與 Web 版本 API 保持一致
 */
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react'
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  type ViewStyle,
  type LayoutRectangle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import {
  SEMANTIC_COLORS,
  BORDER_RADIUS,
  SPACING,
  SHADOWS,
  WB_COLORS,
  DURATION,
} from '@nobodyclimb/constants'
import { EASING, springConfigStandard } from '@/theme/animations'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// ============================================
// Context
// ============================================

interface PopoverContextType {
  open: boolean
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void
  triggerLayout: LayoutRectangle | null
  setTriggerLayout: (layout: LayoutRectangle | null) => void
  closeOnSelect: boolean
}

const PopoverContext = createContext<PopoverContextType>({
  open: false,
  setOpen: () => {},
  triggerLayout: null,
  setTriggerLayout: () => {},
  closeOnSelect: true,
})

// ============================================
// Popover Root
// ============================================

export interface PopoverProps {
  /** 子元素 */
  children: React.ReactNode
  /** 受控開啟狀態 */
  open?: boolean
  /** 開啟狀態變更回調 */
  onOpenChange?: (open: boolean) => void
  /** 選擇後是否自動關閉 */
  closeOnSelect?: boolean
}

/**
 * Popover 根組件
 */
export function Popover({
  children,
  open: controlledOpen,
  onOpenChange,
  closeOnSelect = true,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [triggerLayout, setTriggerLayout] = useState<LayoutRectangle | null>(null)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const newValue = typeof value === 'function' ? value(open) : value

      if (!isControlled) {
        setUncontrolledOpen(newValue)
      }
      onOpenChange?.(newValue)
    },
    [isControlled, open, onOpenChange]
  )

  return (
    <PopoverContext.Provider
      value={{
        open,
        setOpen,
        triggerLayout,
        setTriggerLayout,
        closeOnSelect,
      }}
    >
      {children}
    </PopoverContext.Provider>
  )
}

// ============================================
// Popover Trigger
// ============================================

export interface PopoverTriggerProps {
  /** 子元素 */
  children: React.ReactNode
  /** 是否作為子元素渲染 */
  asChild?: boolean
}

/**
 * Popover 觸發器
 */
export function PopoverTrigger({ children, asChild = false }: PopoverTriggerProps) {
  const { open, setOpen, setTriggerLayout } = useContext(PopoverContext)
  const triggerRef = useRef<View>(null)

  const handlePress = useCallback(() => {
    // 測量觸發器位置
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height })
      setOpen(!open)
    })
  }, [open, setOpen, setTriggerLayout])

  // 如果使用 asChild，將 props 傳遞給子元素
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: triggerRef,
      onPress: handlePress,
    })
  }

  return (
    <Pressable ref={triggerRef} onPress={handlePress}>
      {children}
    </Pressable>
  )
}

// ============================================
// Popover Content
// ============================================

export type PopoverAlign = 'start' | 'center' | 'end'

export interface PopoverContentProps {
  /** 子元素 */
  children: React.ReactNode
  /** 對齊方式 */
  align?: PopoverAlign
  /** 偏移量 */
  sideOffset?: number
  /** 自定義樣式 */
  style?: ViewStyle
  /** 最大寬度 */
  maxWidth?: number
}

/**
 * 計算 Popover 位置
 */
function calculatePosition(
  triggerLayout: LayoutRectangle | null,
  contentWidth: number,
  contentHeight: number,
  align: PopoverAlign,
  sideOffset: number
): { top: number; left: number } {
  if (!triggerLayout) {
    return { top: 0, left: 0 }
  }

  const { x, y, width, height } = triggerLayout

  // 垂直位置：預設在觸發器下方
  let top = y + height + sideOffset

  // 如果下方空間不足，顯示在上方
  if (top + contentHeight > SCREEN_HEIGHT - 20) {
    top = y - contentHeight - sideOffset
  }

  // 水平位置
  let left: number
  switch (align) {
    case 'start':
      left = x
      break
    case 'end':
      left = x + width - contentWidth
      break
    case 'center':
    default:
      left = x + width / 2 - contentWidth / 2
      break
  }

  // 確保不超出螢幕邊界
  const PADDING = 10
  if (left < PADDING) {
    left = PADDING
  }
  if (left + contentWidth > SCREEN_WIDTH - PADDING) {
    left = SCREEN_WIDTH - contentWidth - PADDING
  }

  return { top, left }
}

/**
 * Popover 內容
 */
export function PopoverContent({
  children,
  align = 'center',
  sideOffset = 8,
  style,
  maxWidth = 280,
}: PopoverContentProps) {
  const { open, setOpen, triggerLayout, closeOnSelect } = useContext(PopoverContext)
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 })
  const [isReady, setIsReady] = useState(false)

  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.95)
  const translateY = useSharedValue(-10)

  useEffect(() => {
    if (open && isReady) {
      opacity.value = withTiming(1, { duration: DURATION.fast, easing: EASING.standard })
      scale.value = withSpring(1, springConfigStandard)
      translateY.value = withSpring(0, springConfigStandard)
    } else {
      opacity.value = withTiming(0, { duration: DURATION.fast, easing: EASING.standard })
      scale.value = withTiming(0.95, { duration: DURATION.fast })
      translateY.value = withTiming(-10, { duration: DURATION.fast })
    }
  }, [open, isReady, opacity, scale, translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }))

  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = event.nativeEvent.layout
      setContentSize({ width, height })
      setIsReady(true)
    },
    []
  )

  const handleBackdropPress = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const position = calculatePosition(
    triggerLayout,
    contentSize.width,
    contentSize.height,
    align,
    sideOffset
  )

  // 處理子元素點擊關閉
  const wrapChildrenWithClose = (node: React.ReactNode): React.ReactNode => {
    return React.Children.map(node, (child) => {
      if (!React.isValidElement(child)) return child

      const childProps = child.props as { onPress?: (e: any) => void; children?: React.ReactNode }

      // 如果是 Pressable 或有 onPress 的元素
      if (childProps.onPress && closeOnSelect) {
        return React.cloneElement(child as React.ReactElement<any>, {
          onPress: (e: any) => {
            childProps.onPress?.(e)
            setOpen(false)
          },
        })
      }

      // 遞迴處理子元素
      if (childProps.children) {
        return React.cloneElement(child as React.ReactElement<any>, {
          children: wrapChildrenWithClose(childProps.children),
        })
      }

      return child
    })
  }

  if (!open) return null

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={handleBackdropPress}
    >
      {/* 背景遮罩 */}
      <Pressable style={styles.backdrop} onPress={handleBackdropPress} />

      {/* 內容 */}
      <Animated.View
        style={[
          styles.content,
          animatedStyle,
          {
            top: position.top,
            left: position.left,
            maxWidth,
            opacity: isReady ? undefined : 0,
          },
          SHADOWS.lg,
          style,
        ]}
        onLayout={handleLayout}
      >
        {closeOnSelect ? wrapChildrenWithClose(children) : children}
      </Animated.View>
    </Modal>
  )
}

// ============================================
// Popover Item (方便使用的選項組件)
// ============================================

export interface PopoverItemProps {
  /** 子元素 */
  children: React.ReactNode
  /** 點擊回調 */
  onPress?: () => void
  /** 是否禁用 */
  disabled?: boolean
  /** 是否具有破壞性 */
  destructive?: boolean
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * Popover 選項
 */
export function PopoverItem({
  children,
  onPress,
  disabled = false,
  destructive = false,
  style,
}: PopoverItemProps) {
  const textColor = destructive
    ? SEMANTIC_COLORS.error
    : disabled
    ? SEMANTIC_COLORS.textDisabled
    : SEMANTIC_COLORS.textMain

  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        pressed && !disabled && styles.itemPressed,
        disabled && styles.itemDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {typeof children === 'string' ? (
        <Animated.Text style={[styles.itemText, { color: textColor }]}>
          {children}
        </Animated.Text>
      ) : (
        children
      )}
    </Pressable>
  )
}

// ============================================
// Popover Separator
// ============================================

/**
 * Popover 分隔線
 */
export function PopoverSeparator() {
  return <View style={styles.separator} />
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  content: {
    position: 'absolute',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 128,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
  },
  item: {
    paddingVertical: SPACING[2.5],
    paddingHorizontal: SPACING[3],
  },
  itemPressed: {
    backgroundColor: WB_COLORS[10],
  },
  itemDisabled: {
    opacity: 0.5,
  },
  itemText: {
    fontSize: 14,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: SEMANTIC_COLORS.border,
    marginVertical: SPACING[1],
  },
})

export default Popover
