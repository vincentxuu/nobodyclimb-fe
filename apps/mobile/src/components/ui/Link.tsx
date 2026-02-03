/**
 * Link 組件
 *
 * 連結元件，與 apps/web/src/components/ui/link.tsx 對應
 * 使用 expo-router 的 Link
 */
import React from 'react'
import { Link as ExpoLink, type Href } from 'expo-router'
import { Text } from './Text'
import { SEMANTIC_COLORS } from '@nobodyclimb/constants'
import type { ViewStyle, StyleProp } from 'react-native'

export interface LinkProps {
  /** 連結目標 */
  href: Href
  /** 子元素 */
  children?: React.ReactNode
  /** 連結文字顏色 */
  color?: string
  /** 是否有底線 */
  underline?: boolean
  /** 樣式 */
  style?: StyleProp<ViewStyle>
  /** 是否替換歷史記錄 */
  replace?: boolean
  /** 是否異步加載 */
  asChild?: boolean
}

export function Link({
  href,
  children,
  color = SEMANTIC_COLORS.textMain,
  underline = false,
  style,
  replace,
  asChild,
}: LinkProps) {
  return (
    <ExpoLink href={href} style={style} replace={replace} asChild={asChild}>
      {typeof children === 'string' ? (
        <Text
          color="main"
          style={{
            color,
            textDecorationLine: underline ? 'underline' : 'none',
          }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </ExpoLink>
  )
}

export default Link
