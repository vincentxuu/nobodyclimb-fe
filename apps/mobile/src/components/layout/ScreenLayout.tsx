/**
 * ScreenLayout 組件
 *
 * 基礎頁面佈局，處理 Safe Area Insets
 */
import React from 'react'
import { View, StyleSheet, type ViewStyle, StatusBar } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'
import { SEMANTIC_COLORS } from '@nobodyclimb/constants'

export interface ScreenLayoutProps {
  /** 子元素 */
  children: React.ReactNode
  /** 背景色 */
  backgroundColor?: string
  /** 要處理的 Safe Area 邊緣 */
  edges?: Edge[]
  /** Header 組件 */
  header?: React.ReactNode
  /** Footer 組件 */
  footer?: React.ReactNode
  /** 內容區域樣式 */
  contentStyle?: ViewStyle
  /** 容器樣式 */
  style?: ViewStyle
  /** 狀態列樣式 */
  statusBarStyle?: 'light-content' | 'dark-content'
}

/**
 * 基礎頁面佈局
 *
 * @example
 * ```tsx
 * <ScreenLayout
 *   header={<Header title="首頁" />}
 *   edges={['top']}
 * >
 *   <View>內容</View>
 * </ScreenLayout>
 * ```
 */
export function ScreenLayout({
  children,
  backgroundColor = SEMANTIC_COLORS.pageBg,
  edges = ['top', 'left', 'right'],
  header,
  footer,
  contentStyle,
  style,
  statusBarStyle = 'dark-content',
}: ScreenLayoutProps) {
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }, style]}
      edges={edges}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      {header}
      <View style={[styles.content, contentStyle]}>{children}</View>
      {footer}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
})

export default ScreenLayout
