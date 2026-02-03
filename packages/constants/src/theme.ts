/**
 * NobodyClimb 設計系統 (Design Tokens)
 *
 * 統一的品牌色、字體、間距定義
 * 供 Web (Tailwind)、App (React Native) 共用
 */

// ============================================
// 顏色系統 (Color System)
// ============================================

/**
 * W&B 灰階系列 (White & Black Scale)
 */
export const WB_COLORS = {
  0: '#FFFFFF', // 純白
  10: '#F5F5F5', // 淺灰背景
  20: '#EBEAEA', // 邊框灰
  30: '#DBD8D8', // 淺灰
  50: '#B6B3B3', // 中灰
  60: '#8E8C8C', // 灰
  70: '#6D6C6C', // 深灰（次要文字）
  90: '#3F3D3D', // 更深灰（hover）
  100: '#1B1A1A', // 近黑（主要文字）
} as const

/**
 * 品牌黃色系列
 */
export const BRAND_YELLOW = {
  100: '#FFE70C', // 主要黃色（強調色）
  200: '#FA9F17', // 橘黃色（hover）
} as const

/**
 * 品牌紅色系列
 */
export const BRAND_RED = {
  100: '#DA3737', // 紅色（錯誤/警示）
} as const

/**
 * 語意化顏色別名 (Semantic Colors)
 */
export const SEMANTIC_COLORS = {
  // 背景
  pageBg: WB_COLORS[10],
  cardBg: WB_COLORS[0],
  surfaceBg: WB_COLORS[0],

  // 文字
  textMain: WB_COLORS[100],
  textSubtle: WB_COLORS[70],
  textMuted: WB_COLORS[60],
  textDisabled: WB_COLORS[50],

  // 邊框
  border: WB_COLORS[20],
  borderSubtle: WB_COLORS[30],
  borderFocus: BRAND_YELLOW[100],
  borderError: BRAND_RED[100],

  // 按鈕
  buttonPrimary: WB_COLORS[100],
  buttonPrimaryText: WB_COLORS[0],
  buttonPrimaryHover: WB_COLORS[90],
  buttonSecondary: WB_COLORS[0],
  buttonSecondaryText: WB_COLORS[100],
  buttonSecondaryBorder: WB_COLORS[100],

  // 強調色
  accent: BRAND_YELLOW[100],
  accentHover: BRAND_YELLOW[200],

  // 狀態
  success: '#10B981', // emerald-500
  warning: '#F59E0B', // amber-500
  error: BRAND_RED[100],
  info: '#3B82F6', // blue-500

  // 品牌色（用於 App）
  brand: BRAND_YELLOW[100],
  brandPrimary: BRAND_YELLOW[100],
  brandDark: WB_COLORS[100],
} as const

/**
 * 完整顏色系統（用於 Tailwind extend）
 */
export const COLORS = {
  wb: WB_COLORS,
  'brand-yellow': BRAND_YELLOW,
  'brand-red': BRAND_RED,
  // 語意化別名（向後相容）
  'page-bg': SEMANTIC_COLORS.pageBg,
  'page-content-bg': SEMANTIC_COLORS.pageBg,
  'text-main': SEMANTIC_COLORS.textMain,
  'text-subtle': SEMANTIC_COLORS.textSubtle,
  strong: WB_COLORS[90],
  subtle: WB_COLORS[50],
  // 品牌別名
  brand: {
    dark: WB_COLORS[100],
    'dark-hover': WB_COLORS[90],
    darkHover: WB_COLORS[90],
    light: WB_COLORS[30],
    accent: BRAND_YELLOW[100],
    'accent-hover': BRAND_YELLOW[200],
    red: BRAND_RED[100],
    gray: {
      DEFAULT: WB_COLORS[20],
      light: WB_COLORS[10],
    },
    primary: BRAND_YELLOW[100],
  },
  // App 用簡化別名
  white: WB_COLORS[0],
  gray: WB_COLORS[50],
  // App 用語意化別名
  border: {
    DEFAULT: WB_COLORS[20],
    default: WB_COLORS[20],
    subtle: WB_COLORS[30],
    light: WB_COLORS[10],
    focus: BRAND_YELLOW[100],
    error: BRAND_RED[100],
  },
  text: {
    main: WB_COLORS[100],
    subtle: WB_COLORS[70],
    muted: WB_COLORS[60],
    disabled: WB_COLORS[50],
    placeholder: WB_COLORS[50],
  },
  background: {
    page: WB_COLORS[10],
    card: WB_COLORS[0],
    surface: WB_COLORS[0],
    input: WB_COLORS[0],
    subtle: WB_COLORS[10],
    muted: WB_COLORS[20],
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: BRAND_RED[100],
    info: '#3B82F6',
  },
} as const

// ============================================
// 字體系統 (Typography)
// ============================================

/**
 * 字體家族
 */
export const FONT_FAMILY = {
  // 主要字體（繁體中文）
  sans: 'Noto Sans TC',
  // 展示字體（標題）
  display: 'Glow Sans TC',
  // 等寬字體（數字、代碼）
  mono: 'Allerta Stencil',
} as const

/**
 * 字體尺寸（以 px 為單位）
 */
export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const

/**
 * 行高
 */
export const LINE_HEIGHT = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 28,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 56,
} as const

/**
 * 字重
 */
export const FONT_WEIGHT = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

// ============================================
// 間距系統 (Spacing)
// ============================================

/**
 * 間距尺度（基於 4px）
 */
export const SPACING = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  // 命名別名（用於 App）
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

/**
 * 圓角
 */
export const BORDER_RADIUS = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const

/**
 * RADIUS 別名（用於 App）
 */
export const RADIUS = BORDER_RADIUS

// ============================================
// 陰影 (Shadows) - React Native 格式
// ============================================

/**
 * 陰影（React Native 格式）
 */
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
} as const

// ============================================
// 動畫 (Animation)
// ============================================

/**
 * 動畫時長（毫秒）
 */
export const DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const

// ============================================
// 組件規格 (Component Specs)
// ============================================

/**
 * 按鈕尺寸規格
 */
export const BUTTON_SIZES = {
  sm: {
    height: 32,
    paddingHorizontal: SPACING[3],
    fontSize: FONT_SIZE.sm,
  },
  md: {
    height: 40,
    paddingHorizontal: SPACING[4],
    fontSize: FONT_SIZE.base,
  },
  lg: {
    height: 48,
    paddingHorizontal: SPACING[6],
    fontSize: FONT_SIZE.base,
  },
} as const

/**
 * 輸入框規格
 */
export const INPUT_SPECS = {
  height: 48,
  paddingHorizontal: SPACING[4],
  borderRadius: BORDER_RADIUS.md,
  borderWidth: 1,
  fontSize: FONT_SIZE.base,
} as const

/**
 * 頭像尺寸
 */
export const AVATAR_SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
} as const

// ============================================
// 類型導出 (Type Exports)
// ============================================

export type WBColorKey = keyof typeof WB_COLORS
export type BrandYellowKey = keyof typeof BRAND_YELLOW
export type BrandRedKey = keyof typeof BRAND_RED
export type SpacingKey = keyof typeof SPACING
export type BorderRadiusKey = keyof typeof BORDER_RADIUS
export type FontSizeKey = keyof typeof FONT_SIZE
export type ButtonSize = keyof typeof BUTTON_SIZES
export type AvatarSize = keyof typeof AVATAR_SIZES
