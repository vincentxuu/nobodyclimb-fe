/**
 * 岩館列表頁面
 *
 * 對應 apps/web/src/app/gym/page.tsx
 *
 * 功能：
 * - 雙層篩選系統：地區篩選 + 類型篩選（抱石/上攀）
 * - 響應式卡片佈局
 * - 搜尋功能
 * - Pull-to-Refresh
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import {
  ChevronLeft,
  MapPin,
  Star,
  Filter,
  X,
} from 'lucide-react-native'
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated'

import { Text, SearchInput, IconButton, Card, Button } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS, COLORS } from '@nobodyclimb/constants'
import {
  searchGyms,
  type GymListItem,
  REGIONS,
  GYM_TYPES,
} from '@/lib/gym-data'

// ============ 封面產生器組件 ============

interface GymCoverProps {
  type: 'bouldering' | 'lead' | 'mixed'
  name: string
  typeLabel: string
}

function GymCover({ type, name, typeLabel }: GymCoverProps) {
  // 根據類型決定漸層色
  const gradientColors = useMemo(() => {
    switch (type) {
      case 'bouldering':
        return ['#7DD3FC', '#38BDF8'] // sky-200 to sky-400
      case 'lead':
        return ['#6EE7B7', '#10B981'] // emerald-300 to emerald-500
      case 'mixed':
        return ['#A5B4FC', '#6366F1'] // indigo-300 to indigo-500
      default:
        return ['#D4D4D8', '#A1A1AA'] // zinc-300 to zinc-500
    }
  }, [type])

  return (
    <View style={[styles.coverContainer, { backgroundColor: gradientColors[0] }]}>
      <View style={styles.coverContent}>
        <Text
          variant="body"
          fontWeight="600"
          numberOfLines={1}
          style={styles.coverName}
        >
          {name}
        </Text>
        <View style={styles.coverBadge}>
          <Text variant="small" style={styles.coverBadgeText}>
            {typeLabel}
          </Text>
        </View>
      </View>
    </View>
  )
}

// ============ 篩選按鈕組件 ============

interface FilterButtonProps {
  label: string
  selected: boolean
  onPress: () => void
}

function FilterButton({ label, selected, onPress }: FilterButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterButton,
        selected && styles.filterButtonSelected,
      ]}
    >
      <Text
        variant="small"
        fontWeight={selected ? '600' : '400'}
        style={[
          styles.filterButtonText,
          selected && styles.filterButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

// ============ 岩館卡片組件 ============

interface GymCardProps {
  gym: GymListItem
  onPress: () => void
  index: number
}

function GymCard({ gym, onPress, index }: GymCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 50)}>
      <Pressable onPress={onPress}>
        <Card style={styles.gymCard}>
          {/* 封面圖 */}
          <View style={styles.gymImageContainer}>
            <GymCover type={gym.type} name={gym.name} typeLabel={gym.typeLabel} />
          </View>

          {/* 卡片內容 */}
          <View style={styles.gymContent}>
            <Text variant="body" fontWeight="600" numberOfLines={1}>
              {gym.name}
            </Text>
            {gym.nameEn && gym.nameEn !== gym.name && (
              <Text variant="small" color="textMuted" numberOfLines={1}>
                {gym.nameEn}
              </Text>
            )}

            <View style={styles.gymMeta}>
              <MapPin size={14} color={SEMANTIC_COLORS.textMuted} />
              <Text variant="small" color="textMuted">
                {gym.location}
              </Text>
            </View>

            <View style={styles.gymFooter}>
              <View style={styles.gymTag}>
                <Text variant="small" color="textSubtle">
                  {gym.typeLabel}
                </Text>
              </View>
              {gym.rating > 0 && (
                <View style={styles.ratingRow}>
                  <Star size={14} color="#FFE70C" fill="#FFE70C" />
                  <Text variant="small" fontWeight="500">
                    {gym.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  )
}

// ============ 主頁面組件 ============

export default function GymListScreen() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('所有地區')
  const [selectedType, setSelectedType] = useState('所有類型')
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [gyms, setGyms] = useState<GymListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 動畫狀態
  const filterHeight = useSharedValue(0)

  // 載入資料
  const loadGyms = useCallback(async () => {
    try {
      setError(null)
      const data = await searchGyms({
        query: searchTerm,
        region: selectedRegion,
        type: selectedType,
      })
      setGyms(data)
    } catch (err) {
      console.error('Error fetching gyms:', err)
      setError('無法載入岩館資料，請稍後再試')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [searchTerm, selectedRegion, selectedType])

  useEffect(() => {
    setIsLoading(true)
    loadGyms()
  }, [loadGyms])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadGyms()
  }, [loadGyms])

  const handleBack = () => {
    router.back()
  }

  const handleGymPress = useCallback(
    (id: string) => {
      router.push(`/gym/${id}` as any)
    },
    [router]
  )

  const handleToggleFilter = () => {
    setIsFilterExpanded(!isFilterExpanded)
    filterHeight.value = withTiming(isFilterExpanded ? 0 : 1, { duration: 300 })
  }

  const handleClearFilters = () => {
    setSelectedRegion('所有地區')
    setSelectedType('所有類型')
    setSearchTerm('')
  }

  const hasActiveFilters =
    selectedRegion !== '所有地區' ||
    selectedType !== '所有類型' ||
    searchTerm !== ''

  const filterAnimatedStyle = useAnimatedStyle(() => ({
    maxHeight: filterHeight.value * 200,
    opacity: filterHeight.value,
    overflow: 'hidden',
  }))

  const renderItem = ({ item, index }: { item: GymListItem; index: number }) => (
    <GymCard gym={item} onPress={() => handleGymPress(item.id)} index={index} />
  )

  const ListHeaderComponent = () => (
    <View style={styles.resultsHeader}>
      <Text variant="small" color="textSubtle">
        找到 <Text fontWeight="600">{gyms.length}</Text> 個攀岩館
      </Text>
      {hasActiveFilters && (
        <Pressable onPress={handleClearFilters} style={styles.clearButton}>
          <X size={14} color={SEMANTIC_COLORS.textMuted} />
          <Text variant="small" color="textMuted">
            清除篩選
          </Text>
        </Pressable>
      )}
    </View>
  )

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      {error ? (
        <>
          <Text color="textSubtle">{error}</Text>
          <Button
            variant="secondary"
            size="sm"
            onPress={loadGyms}
            style={styles.retryButton}
          >
            重試
          </Button>
        </>
      ) : (
        <>
          <Text color="textSubtle">
            {searchTerm
              ? `找不到符合「${searchTerm}」的岩館`
              : '沒有找到符合條件的攀岩館'}
          </Text>
          {hasActiveFilters && (
            <Pressable onPress={handleClearFilters} style={styles.clearFiltersButton}>
              <Text color="textSubtle" style={styles.clearFiltersText}>
                清除篩選條件
              </Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 標題區 */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
          <Text variant="h3" fontWeight="600">
            岩館介紹
          </Text>
          <IconButton
            icon={
              <Filter
                size={20}
                color={
                  hasActiveFilters
                    ? COLORS.brand.primary
                    : SEMANTIC_COLORS.textMain
                }
              />
            }
            onPress={handleToggleFilter}
            variant="ghost"
          />
        </View>

        {/* 搜尋欄 */}
        <SearchInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="搜尋岩館..."
          style={styles.searchInput}
        />

        {/* 篩選區塊（可展開） */}
        <Animated.View style={[styles.filterContainer, filterAnimatedStyle]}>
          {/* 地區篩選 */}
          <View style={styles.filterSection}>
            <Text variant="small" fontWeight="600" style={styles.filterLabel}>
              地區篩選
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {REGIONS.map((region) => (
                <FilterButton
                  key={region}
                  label={region}
                  selected={selectedRegion === region}
                  onPress={() => setSelectedRegion(region)}
                />
              ))}
            </ScrollView>
          </View>

          {/* 類型篩選 */}
          <View style={styles.filterSection}>
            <Text variant="small" fontWeight="600" style={styles.filterLabel}>
              類型篩選
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {GYM_TYPES.map((type) => (
                <FilterButton
                  key={type}
                  label={type}
                  selected={selectedType === type}
                  onPress={() => setSelectedType(type)}
                />
              ))}
            </ScrollView>
          </View>
        </Animated.View>

        {/* 快速篩選標籤（收合時顯示） */}
        {!isFilterExpanded && hasActiveFilters && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.activeFilters}>
            {selectedRegion !== '所有地區' && (
              <View style={styles.activeFilterTag}>
                <Text variant="small">{selectedRegion}</Text>
                <Pressable onPress={() => setSelectedRegion('所有地區')}>
                  <X size={12} color={SEMANTIC_COLORS.textSubtle} />
                </Pressable>
              </View>
            )}
            {selectedType !== '所有類型' && (
              <View style={styles.activeFilterTag}>
                <Text variant="small">{selectedType}</Text>
                <Pressable onPress={() => setSelectedType('所有類型')}>
                  <X size={12} color={SEMANTIC_COLORS.textSubtle} />
                </Pressable>
              </View>
            )}
          </Animated.View>
        )}
      </View>

      {/* 列表 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
          <Text color="textSubtle" style={styles.loadingText}>
            載入中...
          </Text>
        </View>
      ) : (
        <FlatList
          data={gyms}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

// ============ 樣式 ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  header: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  searchInput: {
    marginHorizontal: SPACING.xs,
  },
  filterContainer: {
    marginTop: SPACING.sm,
  },
  filterSection: {
    marginBottom: SPACING.sm,
  },
  filterLabel: {
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  filterScroll: {
    paddingHorizontal: SPACING.xs,
    gap: SPACING.xs,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterButtonSelected: {
    borderBottomColor: SEMANTIC_COLORS.textMain,
  },
  filterButtonText: {
    color: SEMANTIC_COLORS.textSubtle,
  },
  filterButtonTextSelected: {
    color: SEMANTIC_COLORS.textMain,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  listContent: {
    padding: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  columnWrapper: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gymCard: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
  },
  gymImageContainer: {
    width: '100%',
    height: 100,
  },
  coverContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.sm,
  },
  coverContent: {
    gap: 4,
  },
  coverName: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  coverBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  coverBadgeText: {
    color: '#1B1A1A',
    fontSize: 10,
  },
  gymContent: {
    padding: SPACING.sm,
  },
  gymMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  gymFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  gymTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  retryButton: {
    marginTop: SPACING.md,
  },
  clearFiltersButton: {
    marginTop: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: SEMANTIC_COLORS.textSubtle,
    paddingBottom: 2,
  },
  clearFiltersText: {
    textDecorationLine: 'underline',
  },
})
