/**
 * SearchFilters 搜尋過濾器組件
 *
 * 對應 apps/web/src/components/search/search-filters.tsx
 */
import React from 'react'
import { StyleSheet, View, ScrollView, Pressable } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SEMANTIC_COLORS, SPACING, DURATION } from '@nobodyclimb/constants'
import { Text, SearchInput } from '@/components/ui'

export type SearchType = 'all' | 'biography' | 'crag' | 'gym' | 'blog'

export const TYPE_LABELS: Record<SearchType, string> = {
  all: '全部',
  biography: '人物誌',
  crag: '岩場介紹',
  gym: '岩館',
  blog: '部落格',
}

export const SEARCH_TYPES: SearchType[] = ['all', 'biography', 'crag', 'gym', 'blog']

interface TabButtonProps {
  label: string
  isActive: boolean
  onPress: () => void
}

function TabButton({ label, isActive, onPress }: TabButtonProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: DURATION.fast })
  }

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: DURATION.fast })
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
      >
        <Text
          variant="body"
          fontWeight={isActive ? '500' : '400'}
          color="main"
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

export interface SearchFiltersProps {
  /** 搜尋關鍵字 */
  searchQuery: string
  /** 搜尋關鍵字變化時的回調 */
  onSearchQueryChange: (query: string) => void
  /** 目前選中的分類 */
  activeTab: SearchType
  /** 分類變化時的回調 */
  onTabChange: (tab: SearchType) => void
  /** 是否顯示標題 */
  showTitle?: boolean
  /** 搜尋提交時的回調 */
  onSearchSubmit?: () => void
}

/**
 * 搜尋過濾器組件
 *
 * 包含搜尋輸入框和分類標籤過濾
 *
 * @example
 * ```tsx
 * <SearchFilters
 *   searchQuery={query}
 *   onSearchQueryChange={setQuery}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 * ```
 */
export function SearchFilters({
  searchQuery,
  onSearchQueryChange,
  activeTab,
  onTabChange,
  showTitle = true,
  onSearchSubmit,
}: SearchFiltersProps) {
  return (
    <View style={styles.container}>
      {/* 標題區 */}
      {showTitle && (
        <View style={styles.titleSection}>
          <Text variant="h2" fontWeight="500" color="main">
            {searchQuery ? `${searchQuery} 的搜尋結果` : '搜尋結果'}
          </Text>
        </View>
      )}

      {/* 搜尋輸入框 */}
      <View style={styles.searchSection}>
        <SearchInput
          value={searchQuery}
          onChangeText={onSearchQueryChange}
          placeholder="搜尋..."
          onSubmit={onSearchSubmit}
        />
      </View>

      {/* 分類標籤 */}
      <View style={styles.tabsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {SEARCH_TYPES.map((type) => (
            <TabButton
              key={type}
              label={TYPE_LABELS[type]}
              isActive={activeTab === type}
              onPress={() => onTabChange(type)}
            />
          ))}
        </ScrollView>
        <View style={styles.tabsDivider} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  titleSection: {
    paddingHorizontal: SPACING[4], // 16
    paddingTop: SPACING[6], // 24
    paddingBottom: SPACING[2], // 8
  },
  searchSection: {
    paddingHorizontal: SPACING[4], // 16
    paddingBottom: SPACING[4], // 16
    width: 240,
  },
  tabsSection: {
    paddingTop: SPACING[1], // 4
  },
  tabsContent: {
    paddingHorizontal: SPACING[4], // 16
    gap: SPACING[1], // 4
  },
  tabButton: {
    paddingHorizontal: SPACING[6], // 24
    paddingVertical: SPACING[2], // 8
    position: 'relative',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: SEMANTIC_COLORS.textMain,
  },
  tabsDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
  },
})

export default SearchFilters
