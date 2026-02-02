/**
 * 傳記列表頁面
 *
 * 對應 apps/web/src/app/biography/page.tsx
 */
import React, { useState, useCallback } from 'react'
import { StyleSheet, View, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import { Text, SearchInput, LoadMoreButton } from '@/components/ui'
import { BiographyList } from '@/components/biography'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

export default function BiographyScreen() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // 處理搜尋
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  // 處理總數變更
  const handleTotalChange = useCallback((total: number, more: boolean) => {
    setTotalCount(total)
    setHasMore(more)
  }, [])

  // 處理刷新
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    // 重置搜尋觸發刷新
    setSearchTerm('')
    setTimeout(() => setRefreshing(false), 500)
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 標題區 */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text variant="h2" fontWeight="700">
            攀岩傳記
          </Text>
          <Text variant="body" color="textSubtle">
            探索攀岩者的故事
          </Text>
        </View>

        {/* 搜尋欄 */}
        <SearchInput
          value={searchTerm}
          onChangeText={handleSearch}
          placeholder="搜尋人物..."
          style={styles.searchInput}
        />

        {/* 總數顯示 */}
        {totalCount > 0 && (
          <Text variant="small" color="textMuted" style={styles.countText}>
            共 {totalCount} 位攀岩者
          </Text>
        )}
      </View>

      {/* 列表區 */}
      <View style={styles.listContainer}>
        <BiographyList
          searchTerm={searchTerm}
          onTotalChange={handleTotalChange}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titleSection: {
    marginBottom: SPACING.md,
  },
  searchInput: {
    marginBottom: SPACING.sm,
  },
  countText: {
    marginTop: SPACING.xs,
  },
  listContainer: {
    flex: 1,
  },
})
