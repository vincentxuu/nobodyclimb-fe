/**
 * TextArea 組件
 *
 * 多行輸入框
 */
import React, { useState, useCallback, forwardRef } from 'react'
import {
  TextInput,
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
  FONT_WEIGHT,
  SPACING,
  WB_COLORS,
} from '@nobodyclimb/constants'
import { DURATION, EASING } from '@/theme/animations'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

export type TextAreaState = 'default' | 'focused' | 'error' | 'disabled'

export interface TextAreaProps extends Omit<TextInputProps, 'style'> {
  /** 錯誤狀態 */
  error?: boolean
  /** 禁用狀態 */
  disabled?: boolean
  /** 最小行數 */
  minRows?: number
  /** 最大行數 */
  maxRows?: number
  /** 容器樣式 */
  style?: ViewStyle
}

/**
 * 取得邊框顏色
 */
function getBorderColor(state: TextAreaState): string {
  switch (state) {
    case 'focused':
      return SEMANTIC_COLORS.borderFocus
    case 'error':
      return SEMANTIC_COLORS.borderError
    case 'disabled':
      return WB_COLORS[20]
    default:
      return SEMANTIC_COLORS.border
  }
}

/**
 * 多行輸入框組件
 *
 * @example
 * ```tsx
 * <TextArea placeholder="請輸入內容..." minRows={3} />
 * <TextArea error placeholder="錯誤狀態" />
 * ```
 */
export const TextArea = forwardRef<TextInput, TextAreaProps>(function TextArea(
  {
    error = false,
    disabled = false,
    minRows = 3,
    maxRows = 10,
    style,
    onFocus,
    onBlur,
    ...props
  },
  ref
) {
  const [isFocused, setIsFocused] = useState(false)
  const borderColorAnim = useSharedValue(0)

  const state: TextAreaState = disabled
    ? 'disabled'
    : error
      ? 'error'
      : isFocused
        ? 'focused'
        : 'default'

  const lineHeight = 24
  const minHeight = lineHeight * minRows + SPACING[3] * 2
  const maxHeight = lineHeight * maxRows + SPACING[3] * 2

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
    <AnimatedTextInput
      ref={ref}
      style={[
        styles.textarea,
        {
          minHeight,
          maxHeight,
          borderColor: getBorderColor(state),
        },
        disabled && styles.disabled,
        style,
      ]}
      placeholderTextColor={SEMANTIC_COLORS.textMuted}
      multiline
      textAlignVertical="top"
      editable={!disabled}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  )
})

const styles = StyleSheet.create({
  textarea: {
    borderRadius: INPUT_SPECS.borderRadius,
    borderWidth: INPUT_SPECS.borderWidth,
    borderColor: SEMANTIC_COLORS.border,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    paddingHorizontal: INPUT_SPECS.paddingHorizontal,
    paddingVertical: SPACING[3],
    fontSize: INPUT_SPECS.fontSize,
    fontWeight: FONT_WEIGHT.normal,
    color: SEMANTIC_COLORS.textMain,
    lineHeight: 24,
  },
  disabled: {
    backgroundColor: WB_COLORS[10],
  },
})

export default TextArea
