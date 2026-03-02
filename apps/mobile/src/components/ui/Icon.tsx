/**
 * Icon 組件
 *
 * 封裝 Lucide 圖標，支援設計系統尺寸
 * 支援兩種使用方式：
 * 1. icon 屬性：傳入 Lucide 圖標組件
 * 2. name 屬性：傳入圖標名稱字串
 */
import React from 'react'
import { SEMANTIC_COLORS } from '@nobodyclimb/constants'
import type { LucideIcon, LucideProps } from 'lucide-react-native'
import * as LucideIcons from 'lucide-react-native'

/**
 * 圖標尺寸對應
 */
export const ICON_SIZES = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
} as const

export type IconSize = keyof typeof ICON_SIZES

/**
 * 常用圖標名稱
 */
export type IconName =
  | 'AtSign'
  | 'BookOpen'
  | 'Camera'
  | 'Check'
  | 'ChevronDown'
  | 'ChevronRight'
  | 'ChevronUp'
  | 'GripVertical'
  | 'Instagram'
  | 'Link'
  | 'MapPin'
  | 'Mountain'
  | 'Settings'
  | 'Sparkles'
  | 'User'
  | 'X'
  | 'Youtube'
  | (string & {})

export interface IconPropsWithIcon extends Omit<LucideProps, 'size'> {
  /** Lucide 圖標組件 */
  icon: LucideIcon
  name?: never
  /** 尺寸 */
  size?: IconSize | number
  /** 顏色 (預設為 textSubtle) */
  color?: string
}

export interface IconPropsWithName extends Omit<LucideProps, 'size'> {
  icon?: never
  /** 圖標名稱 */
  name: IconName
  /** 尺寸 */
  size?: IconSize | number
  /** 顏色 (預設為 textSubtle) */
  color?: string
}

export type IconProps = IconPropsWithIcon | IconPropsWithName

/**
 * 通用圖標組件
 *
 * @example
 * ```tsx
 * // 使用 icon 屬性
 * import { Home } from 'lucide-react-native'
 * <Icon icon={Home} size="md" />
 *
 * // 使用 name 屬性
 * <Icon name="Home" size="md" />
 * <Icon name="ChevronRight" size={24} color="#FF0000" />
 * ```
 */
export function Icon({
  icon,
  name,
  size = 'md',
  color = SEMANTIC_COLORS.textSubtle,
  ...props
}: IconProps) {
  const iconSize = typeof size === 'number' ? size : ICON_SIZES[size]

  // 如果提供了 icon 屬性，直接使用
  if (icon) {
    const IconComponent = icon
    return <IconComponent size={iconSize} color={color} {...props} />
  }

  // 如果提供了 name 屬性，從 lucide-react-native 查找
  if (name) {
    const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[name]
    if (IconComponent) {
      return <IconComponent size={iconSize} color={color} {...props} />
    }
    // 如果找不到圖標，返回 null（或可以返回一個 fallback 圖標）
    console.warn(`Icon "${name}" not found in lucide-react-native`)
    return null
  }

  return null
}

export default Icon
