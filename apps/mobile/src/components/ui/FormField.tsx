/**
 * FormField 組件
 *
 * 整合 Label + Input + Error Message
 */
import React from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { SPACING, SEMANTIC_COLORS } from '@nobodyclimb/constants'
import { Text } from './Text'
import { Input, type InputProps } from './Input'

export interface FormFieldProps extends InputProps {
  /** 標籤文字 */
  label?: string
  /** 錯誤訊息 */
  errorMessage?: string
  /** 說明文字 */
  helperText?: string
  /** 是否必填 */
  required?: boolean
  /** 外層樣式 */
  wrapperStyle?: ViewStyle
}

/**
 * 表單欄位組件
 *
 * @example
 * ```tsx
 * <FormField
 *   label="電子郵件"
 *   placeholder="請輸入電子郵件"
 *   required
 * />
 *
 * <FormField
 *   label="密碼"
 *   placeholder="請輸入密碼"
 *   error
 *   errorMessage="密碼長度需至少 8 個字元"
 *   secureTextEntry
 * />
 * ```
 */
export function FormField({
  label,
  errorMessage,
  helperText,
  required = false,
  wrapperStyle,
  error,
  ...inputProps
}: FormFieldProps) {
  const hasError = error || !!errorMessage

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text variant="caption" color="subtle" style={styles.label}>
            {label}
          </Text>
          {required && (
            <Text variant="caption" color="error" style={styles.required}>
              *
            </Text>
          )}
        </View>
      )}
      <Input {...inputProps} error={hasError} />
      {hasError && errorMessage && (
        <Text variant="small" color="error" style={styles.errorMessage}>
          {errorMessage}
        </Text>
      )}
      {!hasError && helperText && (
        <Text variant="small" color="muted" style={styles.helperText}>
          {helperText}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: SPACING[1.5],
  },
  label: {
    // 樣式由 Text 組件處理
  },
  required: {
    marginLeft: 2,
  },
  errorMessage: {
    marginTop: SPACING[1],
  },
  helperText: {
    marginTop: SPACING[1],
  },
})

export default FormField
