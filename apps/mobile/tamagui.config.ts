/**
 * Tamagui 配置
 *
 * 從 @nobodyclimb/constants 導入共用設計 tokens
 * 確保與 Web 品牌一致
 */
import { createTamagui, createTokens } from '@tamagui/core'
import { shorthands } from '@tamagui/shorthands'
import { createInterFont } from '@tamagui/font-inter'

// 從共用套件導入設計 tokens
import {
  WB_COLORS,
  BRAND_YELLOW,
  BRAND_RED,
  SEMANTIC_COLORS,
  FONT_FAMILY,
  FONT_SIZE,
  SPACING,
  BORDER_RADIUS,
} from '@nobodyclimb/constants'

// 建立 color tokens
const colorTokens = {
  // W&B 灰階系列
  wb0: WB_COLORS[0],
  wb10: WB_COLORS[10],
  wb20: WB_COLORS[20],
  wb30: WB_COLORS[30],
  wb50: WB_COLORS[50],
  wb60: WB_COLORS[60],
  wb70: WB_COLORS[70],
  wb90: WB_COLORS[90],
  wb100: WB_COLORS[100],

  // 品牌色
  brandYellow: BRAND_YELLOW[100],
  brandYellowHover: BRAND_YELLOW[200],
  brandRed: BRAND_RED[100],

  // 語意化顏色
  pageBg: SEMANTIC_COLORS.pageBg,
  cardBg: SEMANTIC_COLORS.cardBg,
  surfaceBg: SEMANTIC_COLORS.surfaceBg,
  textMain: SEMANTIC_COLORS.textMain,
  textSubtle: SEMANTIC_COLORS.textSubtle,
  textMuted: SEMANTIC_COLORS.textMuted,
  textDisabled: SEMANTIC_COLORS.textDisabled,
  border: SEMANTIC_COLORS.border,
  borderSubtle: SEMANTIC_COLORS.borderSubtle,
  borderFocus: SEMANTIC_COLORS.borderFocus,
  borderError: SEMANTIC_COLORS.borderError,
  buttonPrimary: SEMANTIC_COLORS.buttonPrimary,
  buttonPrimaryText: SEMANTIC_COLORS.buttonPrimaryText,
  buttonPrimaryHover: SEMANTIC_COLORS.buttonPrimaryHover,
  buttonSecondary: SEMANTIC_COLORS.buttonSecondary,
  buttonSecondaryText: SEMANTIC_COLORS.buttonSecondaryText,
  buttonSecondaryBorder: SEMANTIC_COLORS.buttonSecondaryBorder,
  accent: SEMANTIC_COLORS.accent,
  accentHover: SEMANTIC_COLORS.accentHover,
  success: SEMANTIC_COLORS.success,
  warning: SEMANTIC_COLORS.warning,
  error: SEMANTIC_COLORS.error,
  info: SEMANTIC_COLORS.info,
} as const

// 建立 tokens
const tokens = createTokens({
  color: colorTokens,
  space: {
    0: SPACING[0],
    0.5: SPACING[0.5],
    1: SPACING[1],
    1.5: SPACING[1.5],
    2: SPACING[2],
    2.5: SPACING[2.5],
    3: SPACING[3],
    4: SPACING[4],
    5: SPACING[5],
    6: SPACING[6],
    8: SPACING[8],
    10: SPACING[10],
    12: SPACING[12],
    16: SPACING[16],
    20: SPACING[20],
    true: SPACING[4], // 預設間距
  },
  size: {
    0: SPACING[0],
    0.5: SPACING[0.5],
    1: SPACING[1],
    1.5: SPACING[1.5],
    2: SPACING[2],
    2.5: SPACING[2.5],
    3: SPACING[3],
    4: SPACING[4],
    5: SPACING[5],
    6: SPACING[6],
    8: SPACING[8],
    10: SPACING[10],
    12: SPACING[12],
    16: SPACING[16],
    20: SPACING[20],
    true: SPACING[4],
  },
  radius: {
    0: BORDER_RADIUS.none,
    1: BORDER_RADIUS.sm,
    2: BORDER_RADIUS.md,
    3: BORDER_RADIUS.lg,
    4: BORDER_RADIUS.xl,
    5: BORDER_RADIUS['2xl'],
    6: BORDER_RADIUS['3xl'],
    full: BORDER_RADIUS.full,
    true: BORDER_RADIUS.md,
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
  },
})

// 字體設定
const headingFont = createInterFont({
  family: FONT_FAMILY.display,
  size: {
    1: FONT_SIZE.xs,
    2: FONT_SIZE.sm,
    3: FONT_SIZE.base,
    4: FONT_SIZE.lg,
    5: FONT_SIZE.xl,
    6: FONT_SIZE['2xl'],
    7: FONT_SIZE['3xl'],
    8: FONT_SIZE['4xl'],
    9: FONT_SIZE['5xl'],
    true: FONT_SIZE.base,
  },
  weight: {
    4: '400',
    5: '500',
    6: '600',
    7: '700',
  },
})

const bodyFont = createInterFont({
  family: FONT_FAMILY.sans,
  size: {
    1: FONT_SIZE.xs,
    2: FONT_SIZE.sm,
    3: FONT_SIZE.base,
    4: FONT_SIZE.lg,
    5: FONT_SIZE.xl,
    6: FONT_SIZE['2xl'],
    7: FONT_SIZE['3xl'],
    8: FONT_SIZE['4xl'],
    9: FONT_SIZE['5xl'],
    true: FONT_SIZE.base,
  },
  weight: {
    4: '400',
    5: '500',
    6: '600',
    7: '700',
  },
})

// 建立主題
const lightTheme = {
  background: colorTokens.pageBg,
  backgroundHover: colorTokens.wb20,
  backgroundPress: colorTokens.wb30,
  backgroundFocus: colorTokens.wb10,
  backgroundStrong: colorTokens.wb0,
  backgroundTransparent: 'transparent',
  color: colorTokens.textMain,
  colorHover: colorTokens.wb90,
  colorPress: colorTokens.wb100,
  colorFocus: colorTokens.textMain,
  colorTransparent: 'transparent',
  borderColor: colorTokens.border,
  borderColorHover: colorTokens.borderSubtle,
  borderColorFocus: colorTokens.borderFocus,
  borderColorPress: colorTokens.wb30,
  placeholderColor: colorTokens.textMuted,
  // 品牌色
  accentBackground: colorTokens.accent,
  accentColor: colorTokens.wb100,
}

const darkTheme = {
  background: colorTokens.wb100,
  backgroundHover: colorTokens.wb90,
  backgroundPress: colorTokens.wb70,
  backgroundFocus: colorTokens.wb90,
  backgroundStrong: colorTokens.wb90,
  backgroundTransparent: 'transparent',
  color: colorTokens.wb0,
  colorHover: colorTokens.wb10,
  colorPress: colorTokens.wb0,
  colorFocus: colorTokens.wb0,
  colorTransparent: 'transparent',
  borderColor: colorTokens.wb70,
  borderColorHover: colorTokens.wb60,
  borderColorFocus: colorTokens.brandYellow,
  borderColorPress: colorTokens.wb50,
  placeholderColor: colorTokens.wb50,
  // 品牌色
  accentBackground: colorTokens.accent,
  accentColor: colorTokens.wb100,
}

// Button sub-theme (黑底白字)
const lightButtonTheme = {
  background: colorTokens.buttonPrimary,
  backgroundHover: colorTokens.buttonPrimaryHover,
  backgroundPress: colorTokens.wb70,
  backgroundFocus: colorTokens.buttonPrimary,
  color: colorTokens.buttonPrimaryText,
  colorHover: colorTokens.buttonPrimaryText,
  colorPress: colorTokens.buttonPrimaryText,
  colorFocus: colorTokens.buttonPrimaryText,
  borderColor: colorTokens.buttonPrimary,
  borderColorHover: colorTokens.buttonPrimaryHover,
  borderColorFocus: colorTokens.borderFocus,
  borderColorPress: colorTokens.wb70,
}

// Accent Button (黃色強調)
const lightAccentButtonTheme = {
  background: colorTokens.accent,
  backgroundHover: colorTokens.accentHover,
  backgroundPress: colorTokens.accentHover,
  backgroundFocus: colorTokens.accent,
  color: colorTokens.wb100,
  colorHover: colorTokens.wb100,
  colorPress: colorTokens.wb100,
  colorFocus: colorTokens.wb100,
  borderColor: colorTokens.accent,
  borderColorHover: colorTokens.accentHover,
  borderColorFocus: colorTokens.accentHover,
  borderColorPress: colorTokens.accentHover,
}

// Secondary Button (白底黑邊)
const lightSecondaryButtonTheme = {
  background: colorTokens.buttonSecondary,
  backgroundHover: colorTokens.wb10,
  backgroundPress: colorTokens.wb20,
  backgroundFocus: colorTokens.buttonSecondary,
  color: colorTokens.buttonSecondaryText,
  colorHover: colorTokens.buttonSecondaryText,
  colorPress: colorTokens.buttonSecondaryText,
  colorFocus: colorTokens.buttonSecondaryText,
  borderColor: colorTokens.buttonSecondaryBorder,
  borderColorHover: colorTokens.wb90,
  borderColorFocus: colorTokens.borderFocus,
  borderColorPress: colorTokens.wb70,
}

// 建立 Tamagui 配置
export const config = createTamagui({
  tokens,
  themes: {
    light: lightTheme,
    dark: darkTheme,
    // Button sub-themes
    light_Button: lightButtonTheme,
    dark_Button: lightButtonTheme, // 暗模式也用亮色按鈕保持一致
    light_AccentButton: lightAccentButtonTheme,
    dark_AccentButton: lightAccentButtonTheme,
    light_SecondaryButton: lightSecondaryButtonTheme,
    dark_SecondaryButton: {
      ...lightSecondaryButtonTheme,
      background: 'transparent',
      color: colorTokens.wb0,
      borderColor: colorTokens.wb50,
    },
  },
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  },
})

export default config

// TypeScript 型別支援
export type AppConfig = typeof config

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}
