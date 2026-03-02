/**
 * Text 組件
 *
 * 基於設計系統的文字組件
 */
import React from 'react'
import { Text as TamaguiText, styled, GetProps } from '@tamagui/core'
import {
  FONT_SIZE,
  LINE_HEIGHT,
  FONT_WEIGHT,
  SEMANTIC_COLORS,
} from '@nobodyclimb/constants'

/**
 * 文字變體定義
 */
const textVariants = {
  // 標題
  h1: {
    fontSize: FONT_SIZE['4xl'],
    lineHeight: LINE_HEIGHT['4xl'],
    fontWeight: FONT_WEIGHT.bold,
  },
  h2: {
    fontSize: FONT_SIZE['3xl'],
    lineHeight: LINE_HEIGHT['3xl'],
    fontWeight: FONT_WEIGHT.bold,
  },
  h3: {
    fontSize: FONT_SIZE['2xl'],
    lineHeight: LINE_HEIGHT['2xl'],
    fontWeight: FONT_WEIGHT.semibold,
  },
  h4: {
    fontSize: FONT_SIZE.xl,
    lineHeight: LINE_HEIGHT.xl,
    fontWeight: FONT_WEIGHT.semibold,
  },
  // 內文
  body: {
    fontSize: FONT_SIZE.base,
    lineHeight: LINE_HEIGHT.base,
    fontWeight: FONT_WEIGHT.normal,
  },
  bodyBold: {
    fontSize: FONT_SIZE.base,
    lineHeight: LINE_HEIGHT.base,
    fontWeight: FONT_WEIGHT.semibold,
  },
  bodyLarge: {
    fontSize: FONT_SIZE.lg,
    lineHeight: LINE_HEIGHT.lg,
    fontWeight: FONT_WEIGHT.normal,
  },
  // 小型文字
  caption: {
    fontSize: FONT_SIZE.sm,
    lineHeight: LINE_HEIGHT.sm,
    fontWeight: FONT_WEIGHT.normal,
  },
  small: {
    fontSize: FONT_SIZE.xs,
    lineHeight: LINE_HEIGHT.xs,
    fontWeight: FONT_WEIGHT.normal,
  },
} as const

export type TextVariant = keyof typeof textVariants

/**
 * 顏色變體
 */
const colorVariants = {
  main: SEMANTIC_COLORS.textMain,
  subtle: SEMANTIC_COLORS.textSubtle,
  muted: SEMANTIC_COLORS.textMuted,
  disabled: SEMANTIC_COLORS.textDisabled,
  accent: SEMANTIC_COLORS.accent,
  error: SEMANTIC_COLORS.error,
  success: SEMANTIC_COLORS.success,
  inherit: undefined,
  // 別名（向後相容）
  textMain: SEMANTIC_COLORS.textMain,
  textSubtle: SEMANTIC_COLORS.textSubtle,
  textMuted: SEMANTIC_COLORS.textMuted,
} as const

export type TextColor = keyof typeof colorVariants

/**
 * 基礎 Text 組件
 */
const StyledText = styled(TamaguiText, {
  name: 'Text',
  color: '$textMain',
})

export interface TextProps extends Omit<GetProps<typeof StyledText>, 'color'> {
  /** 文字變體 */
  variant?: TextVariant
  /** 顏色變體 */
  color?: TextColor
  /** 對齊方式 */
  align?: 'left' | 'center' | 'right'
  /** 子元素 */
  children?: React.ReactNode
}

/**
 * 文字組件
 *
 * @example
 * ```tsx
 * <Text variant="h1">標題</Text>
 * <Text variant="body" color="subtle">內文</Text>
 * <Text variant="caption" color="muted">小字</Text>
 * ```
 */
export function Text({
  variant = 'body',
  color = 'main',
  align = 'left',
  children,
  style,
  ...props
}: TextProps) {
  const variantStyles = textVariants[variant]
  const textColor = colorVariants[color]

  return (
    <StyledText
      style={[
        {
          fontSize: variantStyles.fontSize,
          lineHeight: variantStyles.lineHeight,
          fontWeight: variantStyles.fontWeight,
          color: textColor,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </StyledText>
  )
}

export default Text
