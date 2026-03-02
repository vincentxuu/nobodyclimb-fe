/**
 * Label 組件
 *
 * 表單標籤，與 apps/web/src/components/ui/label.tsx 對應
 */
import React from 'react'
import { Text as TamaguiText, TextProps as TamaguiTextProps } from 'tamagui'
import { SEMANTIC_COLORS, FONT_SIZE } from '@nobodyclimb/constants'

export interface LabelProps extends Omit<TamaguiTextProps, 'children'> {
  /** 標籤文字 */
  children: React.ReactNode
  /** 是否必填（顯示 * 號） */
  required?: boolean
  /** 是否禁用狀態 */
  disabled?: boolean
}

export function Label({
  children,
  required = false,
  disabled = false,
  ...props
}: LabelProps) {
  return (
    <TamaguiText
      fontSize={FONT_SIZE.sm}
      fontWeight="500"
      color={disabled ? SEMANTIC_COLORS.textMuted : SEMANTIC_COLORS.textMain}
      opacity={disabled ? 0.7 : 1}
      {...props}
    >
      {children}
      {required && (
        <TamaguiText color="#ff4d4f" marginLeft={2}>
          *
        </TamaguiText>
      )}
    </TamaguiText>
  )
}
