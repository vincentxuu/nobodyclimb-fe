/**
 * Input 組件
 *
 * 基於設計系統的輸入框組件
 */
import React, { useState, useCallback, forwardRef } from 'react'
import {
  TextInput,
  View,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import {
  SEMANTIC_COLORS,
  INPUT_SPECS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
  WB_COLORS,
} from '@nobodyclimb/constants'
import { DURATION, EASING } from '@/theme/animations'

const AnimatedView = Animated.createAnimatedComponent(View)

export type InputState = 'default' | 'focused' | 'error' | 'disabled'

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** 錯誤狀態 */
  error?: boolean
  /** 禁用狀態 */
  disabled?: boolean
  /** 左側元素 */
  leftElement?: React.ReactNode
  /** 右側元素 */
  rightElement?: React.ReactNode
  /** 容器樣式 */
  containerStyle?: ViewStyle
}

/**
 * 取得邊框顏色
 */
function getBorderColor(state: InputState): string {
  switch (state) {
    case 'focused':
      return SEMANTIC_COLORS.borderFocus // 品牌黃色
    case 'error':
      return SEMANTIC_COLORS.borderError // 品牌紅色
    case 'disabled':
      return WB_COLORS[20]
    default:
      return SEMANTIC_COLORS.border
  }
}

/**
 * 輸入框組件
 *
 * @example
 * ```tsx
 * <Input placeholder="請輸入..." />
 * <Input error placeholder="錯誤狀態" />
 * <Input disabled placeholder="禁用狀態" />
 * ```
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    error = false,
    disabled = false,
    leftElement,
    rightElement,
    containerStyle,
    onFocus,
    onBlur,
    ...props
  },
  ref
) {
  const [isFocused, setIsFocused] = useState(false)
  const borderColorAnim = useSharedValue(0)

  const state: InputState = disabled
    ? 'disabled'
    : error
      ? 'error'
      : isFocused
        ? 'focused'
        : 'default'

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = getBorderColor(state)
    return {
      borderColor,
    }
  })

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setIsFocused(true)
      borderColorAnim.value = withTiming(1, {
        duration: DURATION.fast,
        easing: EASING.standard,
      })
      onFocus?.(e)
    },
    [borderColorAnim, onFocus]
  )

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setIsFocused(false)
      borderColorAnim.value = withTiming(0, {
        duration: DURATION.fast,
        easing: EASING.standard,
      })
      onBlur?.(e)
    },
    [borderColorAnim, onBlur]
  )

  return (
    <AnimatedView
      style={[
        styles.container,
        animatedBorderStyle,
        { borderColor: getBorderColor(state) },
        disabled && styles.disabled,
        containerStyle,
      ]}
    >
      {leftElement && <View style={styles.leftElement}>{leftElement}</View>}
      <TextInput
        ref={ref}
        style={[
          styles.input,
          leftElement ? styles.inputWithLeft : undefined,
          rightElement ? styles.inputWithRight : undefined,
        ]}
        placeholderTextColor={SEMANTIC_COLORS.textMuted}
        editable={!disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
    </AnimatedView>
  )
})

const styles = StyleSheet.create({
  container: {
    height: INPUT_SPECS.height,
    borderRadius: INPUT_SPECS.borderRadius,
    borderWidth: INPUT_SPECS.borderWidth,
    borderColor: SEMANTIC_COLORS.border,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabled: {
    backgroundColor: WB_COLORS[10],
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: INPUT_SPECS.paddingHorizontal,
    fontSize: INPUT_SPECS.fontSize,
    fontWeight: FONT_WEIGHT.normal,
    color: SEMANTIC_COLORS.textMain,
  },
  inputWithLeft: {
    paddingLeft: SPACING[2],
  },
  inputWithRight: {
    paddingRight: SPACING[2],
  },
  leftElement: {
    paddingLeft: INPUT_SPECS.paddingHorizontal,
  },
  rightElement: {
    paddingRight: INPUT_SPECS.paddingHorizontal,
  },
})

export default Input
