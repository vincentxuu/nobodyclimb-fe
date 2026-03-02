/**
 * SearchResults 搜尋結果組件
 *
 * 對應 apps/web/src/components/search/search-results.tsx
 */
import React from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native'
import {
  Search,
  Users,
  Mountain,
  Building2,
  FileText,
  ChevronRight,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS } from '@nobodyclimb/constants'
import { Text } from '@/components/ui'
import { SearchType, TYPE_LABELS } from './SearchFilters'

// 搜尋結果項目類型
export interface SearchResultItem {
  id: string
  type: Exclude<SearchType, 'all'>
  title: string
  subtitle?: string
  image?: string
  slug?: string
}

// 類型對應圖標
const TYPE_ICONS: Record<Exclude<SearchType, 'all'>, React.ComponentType<{ size: number; color: string }>> = {
  biography: Users,
  crag: Mountain,
  gym: Building2,
  blog: FileText,
}

interface ResultItemProps {
  item: SearchResultItem
  onPress: (item: SearchResultItem) => void
  index: number
}

function ResultItem({ item, onPress, index }: ResultItemProps) {
  const Icon = TYPE_ICONS[item.type]

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <Pressable
        style={({ pressed }) => [
          styles.resultItem,
          pressed && styles.resultItemPressed,
        ]}
        onPress={() => onPress(item)}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.resultImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.resultIconContainer}>
            <Icon size={24} color={SEMANTIC_COLORS.textSubtle} />
          </View>
        )}
        <View style={styles.resultContent}>
          <Text variant="body" fontWeight="500" numberOfLines={1}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text variant="small" color="muted" numberOfLines={1}>
              {item.subtitle}
            </Text>
          )}
        </View>
        <View style={styles.typeBadge}>
          <Text variant="small" color="muted">
            {TYPE_LABELS[item.type]}
          </Text>
        </View>
        <ChevronRight size={18} color={SEMANTIC_COLORS.textMuted} />
      </Pressable>
    </Animated.View>
  )
}

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'

export interface SearchResultsProps {
  /** 搜尋結果 */
  results: SearchResultItem[]
  /** 搜尋狀態 */
  status: SearchStatus
  /** 搜尋關鍵字（用於顯示空狀態訊息） */
  searchQuery?: string
  /** 結果點擊時的回調 */
  onResultPress: (item: SearchResultItem) => void
  /** 錯誤訊息 */
  errorMessage?: string
  /** 是否顯示「開發中」提示 */
  showDevelopmentNote?: boolean
  /** 下拉刷新回調 */
  onRefresh?: () => void
  /** 是否正在刷新 */
  refreshing?: boolean
}

/**
 * 搜尋結果組件
 *
 * 顯示搜尋結果列表，包含載入狀態、空狀態和錯誤狀態
 *
 * @example
 * ```tsx
 * <SearchResults
 *   results={results}
 *   status={isLoading ? 'loading' : results.length > 0 ? 'success' : 'empty'}
 *   searchQuery={query}
 *   onResultPress={handleResultPress}
 * />
 * ```
 */
export function SearchResults({
  results,
  status,
  searchQuery,
  onResultPress,
  errorMessage,
  showDevelopmentNote = false,
  onRefresh,
  refreshing = false,
}: SearchResultsProps) {
  // 載入狀態
  if (status === 'loading') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
        <Text variant="body" color="subtle" style={styles.statusText}>
          搜尋中...
        </Text>
      </View>
    )
  }

  // 開發中提示（與 Web 版本一致）
  if (showDevelopmentNote) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.iconContainer}>
          <Search size={48} color={SEMANTIC_COLORS.textMuted} />
        </View>
        <Text variant="h4" color="muted" style={styles.statusTitle}>
          搜尋功能開發中
        </Text>
        {searchQuery && (
          <Text variant="body" color="muted" style={styles.statusText}>
            搜尋關鍵字：{searchQuery}
          </Text>
        )}
      </View>
    )
  }

  // 初始狀態
  if (status === 'idle') {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.iconContainer}>
          <Search size={48} color={SEMANTIC_COLORS.textMuted} />
        </View>
        <Text variant="body" color="subtle">
          輸入關鍵字開始搜尋
        </Text>
      </View>
    )
  }

  // 錯誤狀態
  if (status === 'error') {
    return (
      <View style={styles.centerContainer}>
        <Text variant="body" color="subtle">
          {errorMessage || '搜尋時發生錯誤，請稍後再試'}
        </Text>
      </View>
    )
  }

  // 空結果
  if (status === 'empty' || results.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.iconContainer}>
          <Search size={48} color={SEMANTIC_COLORS.textMuted} />
        </View>
        <Text variant="body" color="subtle">
          找不到符合「{searchQuery}」的結果
        </Text>
        <Text variant="small" color="muted" style={styles.hintText}>
          請嘗試其他關鍵字
        </Text>
      </View>
    )
  }

  // 結果列表
  return (
    <FlatList
      data={results}
      renderItem={({ item, index }) => (
        <ResultItem item={item} onPress={onResultPress} index={index} />
      )}
      keyExtractor={(item) => `${item.type}-${item.id}`}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  )
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING[6], // 24
  },
  iconContainer: {
    marginBottom: SPACING[4], // 16
  },
  statusTitle: {
    marginBottom: SPACING[1], // 4
    textAlign: 'center',
  },
  statusText: {
    marginTop: SPACING[1], // 4
    textAlign: 'center',
  },
  hintText: {
    marginTop: SPACING[1], // 4
  },
  listContent: {
    padding: SPACING[4], // 16
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING[4], // 16
    borderRadius: BORDER_RADIUS.md, // 8
    marginBottom: SPACING[2], // 8
    gap: SPACING[2], // 8
  },
  resultItemPressed: {
    backgroundColor: '#F5F5F5',
  },
  resultImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
  },
  resultIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
  },
  typeBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: SPACING[1], // 4
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm, // 4
  },
})

export default SearchResults
