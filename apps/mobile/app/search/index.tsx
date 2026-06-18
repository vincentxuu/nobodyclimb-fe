/**
 * 搜尋頁面
 *
 * 對應 apps/web/src/app/search/page.tsx
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  SearchFilters,
  SearchResults,
  type SearchStatus,
  type SearchType,
} from '@/components/search'
import { IconButton, SearchInput } from '@/components/ui'
import { useDebounce, useSearch } from '@/lib/hooks'

export default function SearchScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ q?: string; type?: string }>()

  // 狀態
  const [searchQuery, setSearchQuery] = useState(params.q || '')
  const [activeTab, setActiveTab] = useState<SearchType>((params.type as SearchType) || 'all')

  // 使用 debounce 避免每次按鍵都發送 API 請求
  const debouncedQuery = useDebounce(searchQuery, 300)

  // 使用真實 API 搜尋
  const { data: results = [], isLoading, isError } = useSearch(debouncedQuery, activeTab)

  // 計算搜尋狀態
  const status: SearchStatus = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return 'idle'
    if (isLoading) return 'loading'
    if (isError) return 'error'
    if (results.length === 0) return 'empty'
    return 'success'
  }, [searchQuery, isLoading, isError, results.length])

  // 返回
  const handleBack = () => {
    router.back()
  }

  // 結果點擊
  const handleResultPress = (item: { type: string; slug?: string; id: string }) => {
    switch (item.type) {
      case 'biography':
        router.push(`/biography/profile/${item.slug || item.id}` as any)
        break
      case 'crag':
        router.push(`/crag/${item.slug || item.id}` as any)
        break
      case 'gym':
        router.push(`/gym/${item.slug || item.id}` as any)
        break
      case 'blog':
        router.push(`/blog/${item.slug || item.id}` as any)
        break
      case 'gallery':
        router.push('/gallery')
        break
      case 'video':
        router.push('/videos')
        break
    }
  }

  // 分類變化
  const handleTabChange = (tab: SearchType) => {
    setActiveTab(tab)
  }

  // 搜尋提交
  const handleSearchSubmit = () => {
    // 直接觸發（debounce 已處理）
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - 搜尋輸入 */}
      <View style={styles.header}>
        <IconButton icon={ChevronLeft} onPress={handleBack} variant="ghost" />
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
          showTitle={false}
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
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[2],
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: SPACING[1],
  },
  headerSearch: {
    flex: 1,
  },
})
