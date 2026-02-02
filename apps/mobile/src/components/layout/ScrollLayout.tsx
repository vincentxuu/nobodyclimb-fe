/**
 * ScrollLayout 組件
 *
 * 可滾動頁面佈局，支援 Pull-to-Refresh
 */
import React, { useCallback, useState } from 'react'
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  type ViewStyle,
  type ScrollViewProps,
} from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'
import { SEMANTIC_COLORS, SPACING, BRAND_YELLOW } from '@nobodyclimb/constants'

export interface ScrollLayoutProps extends Omit<ScrollViewProps, 'style'> {
  /** 子元素 */
  children: React.ReactNode
  /** 背景色 */
  backgroundColor?: string
  /** 要處理的 Safe Area 邊緣 */
  edges?: Edge[]
  /** Header 組件 */
  header?: React.ReactNode
  /** 內容區域 padding */
  padding?: number
  /** 是否啟用 Pull-to-Refresh */
  enableRefresh?: boolean
  /** 刷新回調 */
  onRefresh?: () => Promise<void>
  /** 內容區域樣式 */
  contentStyle?: ViewStyle
  /** 容器樣式 */
  style?: ViewStyle
}

/**
 * 可滾動頁面佈局
 *
 * @example
 * ```tsx
 * <ScrollLayout
 *   header={<Header title="列表" />}
 *   enableRefresh
 *   onRefresh={async () => await refetch()}
 * >
 *   <View>內容</View>
 * </ScrollLayout>
 * ```
 */
export function ScrollLayout({
  children,
  backgroundColor = SEMANTIC_COLORS.pageBg,
  edges = ['top', 'left', 'right'],
  header,
  padding = SPACING[4],
  enableRefresh = false,
  onRefresh,
  contentStyle,
  style,
  ...scrollViewProps
}: ScrollLayoutProps) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }, [onRefresh])

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }, style]}
      edges={edges}
    >
      {header}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { padding },
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          enableRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={BRAND_YELLOW[100]}
              colors={[BRAND_YELLOW[100]]}
            />
          ) : undefined
        }
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
})

export default ScrollLayout
