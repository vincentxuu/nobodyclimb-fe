/**
 * 傳記探索頁面
 *
 * 對應 apps/web/src/app/biography/explore/page.tsx
 */
import React, { useState, useCallback } from 'react'
import { StyleSheet, View, ScrollView, RefreshControl, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft, BarChart3 } from 'lucide-react-native'

import { Text, SearchInput, IconButton, Breadcrumb } from '@/components/ui'
import {
  TrendingGoals,
  RecentCompletedStories,
  LocationExplorer,
  CategoryExplorer,
} from '@/components/biography/explore'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

type FilterTab = 'all' | 'growth' | 'experience' | 'recovery' | 'footprint'

const filterTabs: { value: FilterTab; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'growth', label: '成長故事' },
  { value: 'experience', label: '攀登經驗' },
  { value: 'recovery', label: '受傷復原' },
  { value: 'footprint', label: '攀岩足跡' },
]

export default function ExploreScreen() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [refreshing, setRefreshing] = useState(false)

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    // 重置搜尋和篩選
    setSearchTerm('')
    setActiveFilter('all')
    await new Promise((resolve) => setTimeout(resolve, 500))
    setRefreshing(false)
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 導航欄 */}
      <View style={styles.navbar}>
        <IconButton
          icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
          onPress={() => router.back()}
          variant="ghost"
        />
        <Text variant="h4" fontWeight="600">
          探索攀岩故事
        </Text>
        <Pressable
          style={styles.statsButton}
          onPress={() => router.push('/biography/community' as any)}
        >
          <BarChart3 size={18} color={SEMANTIC_COLORS.textSubtle} />
          <Text variant="small" color="textSubtle">
            社群統計
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 麵包屑 */}
        <View style={styles.breadcrumbContainer}>
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '人物誌', href: '/biography' },
              { label: '探索' },
            ]}
          />
        </View>

        {/* 搜尋與篩選 */}
        <View style={styles.filterSection}>
          <SearchInput
            value={searchTerm}
            onChangeText={handleSearch}
            placeholder="搜尋目標、地點或攀岩者..."
            style={styles.searchInput}
          />

          {/* 篩選標籤 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterTabs}>
              {filterTabs.map((tab) => (
                <Pressable
                  key={tab.value}
                  style={[styles.filterTab, activeFilter === tab.value && styles.filterTabActive]}
                  onPress={() => setActiveFilter(tab.value)}
                >
                  <Text
                    variant="small"
                    style={[
                      styles.filterTabText,
                      activeFilter === tab.value && styles.filterTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 熱門目標排行 */}
        <View style={styles.section}>
          <TrendingGoals searchTerm={searchTerm} filter={activeFilter} />
        </View>

        {/* 最新完成故事 */}
        <View style={styles.section}>
          <RecentCompletedStories searchTerm={searchTerm} filter={activeFilter} />
        </View>

        {/* 依地點探索 */}
        <View style={styles.section}>
          <LocationExplorer />
        </View>

        {/* 技巧與經驗分享 */}
        <View style={styles.section}>
          <CategoryExplorer />
        </View>

        {/* 底部留白 */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  breadcrumbContainer: {
    marginBottom: SPACING.md,
  },
  filterSection: {
    marginBottom: SPACING.lg,
  },
  searchInput: {
    marginBottom: SPACING.md,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  filterTabActive: {
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  filterTabText: {
    color: SEMANTIC_COLORS.textSubtle,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  bottomPadding: {
    height: SPACING.xxl,
  },
})
