/**
 * 搜尋頁面
 *
 * 對應 apps/web/src/app/search/page.tsx
 */
import React, { useState, useCallback, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { IconButton, SearchInput } from '@/components/ui'
import {
  SearchFilters,
  SearchResults,
  type SearchType,
  type SearchResultItem,
  type SearchStatus,
} from '@/components/search'

// 模擬搜尋結果（TODO: 整合實際 API）
const mockSearch = (query: string, type: SearchType): SearchResultItem[] => {
  if (!query.trim()) return []

  const allResults: SearchResultItem[] = [
    {
      id: '1',
      type: 'biography',
      title: '測試用戶',
      subtitle: '攀岩愛好者',
      image: 'https://picsum.photos/100?random=1',
    },
    {
      id: '2',
      type: 'biography',
      title: '張三',
      subtitle: '抱石選手',
      image: 'https://picsum.photos/100?random=2',
    },
    { id: '3', type: 'crag', title: '龍洞', subtitle: '新北市貢寮區' },
    { id: '4', type: 'crag', title: '北投攀岩場', subtitle: '台北市北投區' },
    { id: '5', type: 'gym', title: 'RedRock', subtitle: '台北市內湖區' },
    { id: '6', type: 'gym', title: 'MegaSTONE', subtitle: '新北市永和區' },
    { id: '7', type: 'blog', title: '攀岩入門指南', subtitle: '2024-01-15' },
    {
      id: '8',
      type: 'blog',
      title: '如何提升攀岩技巧',
      subtitle: '2024-02-20',
    },
  ]

  // 先過濾關鍵字
  let results = allResults.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(query.toLowerCase())
  )

  // 再過濾類型
  if (type !== 'all') {
    results = results.filter((item) => item.type === type)
  }

  return results
}

export default function SearchScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ q?: string; type?: string }>()

  // 狀態
  const [searchQuery, setSearchQuery] = useState(params.q || '')
  const [activeTab, setActiveTab] = useState<SearchType>(
    (params.type as SearchType) || 'all'
  )
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [status, setStatus] = useState<SearchStatus>('idle')

  // 執行搜尋
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setResults([])
      setStatus('idle')
      return
    }

    setStatus('loading')
    try {
      // TODO: 整合實際 searchService
      await new Promise((resolve) => setTimeout(resolve, 300))
      const searchResults = mockSearch(searchQuery, activeTab)
      setResults(searchResults)
      setStatus(searchResults.length > 0 ? 'success' : 'empty')
    } catch (error) {
      console.error('Search failed:', error)
      setStatus('error')
    }
  }, [searchQuery, activeTab])

  // 監聽搜尋詞和分類變化
  useEffect(() => {
    const timer = setTimeout(performSearch, 300)
    return () => clearTimeout(timer)
  }, [performSearch])

  // 返回
  const handleBack = () => {
    router.back()
  }

  // 結果點擊
  const handleResultPress = (item: SearchResultItem) => {
    switch (item.type) {
      case 'biography':
        router.push(`/biography/${item.slug || item.id}` as any)
        break
      case 'crag':
        router.push(`/crag/${item.id}` as any)
        break
      case 'gym':
        router.push(`/gym/${item.id}` as any)
        break
      case 'blog':
        router.push(`/blog/${item.id}` as any)
        break
    }
  }

  // 分類變化
  const handleTabChange = (tab: SearchType) => {
    setActiveTab(tab)
  }

  // 搜尋提交
  const handleSearchSubmit = () => {
    performSearch()
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - 搜尋輸入 */}
      <View style={styles.header}>
        <IconButton
          icon={ChevronLeft}
          onPress={handleBack}
          variant="ghost"
        />
        <View style={styles.headerSearch}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="搜尋人物、岩場、岩館..."
            autoFocus
            onSubmit={handleSearchSubmit}
          />
        </View>
      </View>

      {/* 過濾標籤（當有搜尋關鍵字時顯示） */}
      {searchQuery.trim() && (
        <SearchFilters
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          showTitle={false} // 移動端不顯示標題，空間有限
          onSearchSubmit={handleSearchSubmit}
        />
      )}

      {/* 搜尋結果 */}
      <SearchResults
        results={results}
        status={status}
        searchQuery={searchQuery}
        onResultPress={handleResultPress}
        showDevelopmentNote={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[2], // 8
    paddingVertical: SPACING[2], // 8
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: SPACING[1], // 4
  },
  headerSearch: {
    flex: 1,
  },
})
