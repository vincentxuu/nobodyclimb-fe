/**
 * Icon 組件
 *
 * 封裝 Lucide 圖標，支援設計系統尺寸
 */
import React from 'react'
import { SEMANTIC_COLORS } from '@nobodyclimb/constants'
import type { LucideIcon, LucideProps } from 'lucide-react-native'

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

export interface IconProps extends Omit<LucideProps, 'size'> {
  /** Lucide 圖標組件 */
  icon: LucideIcon
  /** 尺寸 */
  size?: IconSize | number
  /** 顏色 (預設為 textSubtle) */
  color?: string
}

/**
 * 通用圖標組件
 *
 * @example
 * ```tsx
 * import { Home } from 'lucide-react-native'
 *
 * <Icon icon={Home} size="md" />
 * <Icon icon={Home} size={24} color="#FF0000" />
 * ```
 */
export function Icon({
  icon: IconComponent,
  size = 'md',
  color = SEMANTIC_COLORS.textSubtle,
  ...props
}: IconProps) {
  const iconSize = typeof size === 'number' ? size : ICON_SIZES[size]

  return <IconComponent size={iconSize} color={color} {...props} />
}

export default Icon
