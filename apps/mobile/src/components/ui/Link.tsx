/**
 * Link 組件
 *
 * 連結元件，與 apps/web/src/components/ui/link.tsx 對應
 * 使用 expo-router 的 Link
 */
import React from 'react'
import { Link as ExpoLink, LinkProps as ExpoLinkProps } from 'expo-router'
import { Text } from './Text'
import { SEMANTIC_COLORS } from '@nobodyclimb/constants'

export interface LinkProps extends ExpoLinkProps<string> {
  /** 連結文字顏色 */
  color?: string
  /** 是否有底線 */
  underline?: boolean
}

export function Link({
  children,
  color = SEMANTIC_COLORS.textMain,
  underline = false,
  style,
  ...props
}: LinkProps) {
  return (
    <ExpoLink {...props} style={style}>
      {typeof children === 'string' ? (
        <Text
          color="textMain"
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
