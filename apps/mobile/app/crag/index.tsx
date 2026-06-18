/**
 * 岩場列表頁面
 *
 * 對應 apps/web/src/app/crag/page.tsx
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { ChevronLeft, MapPin, Mountain } from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CragCard } from '@/components/crag'
import { EmptyState, IconButton, SearchInput, Text } from '@/components/ui'
import type { CragListItem } from '@/lib/crag-data'
import { useCrags } from '@/lib/hooks/useCrags'

const cragMapPositions: Record<string, { top: `${number}%`; left: `${number}%` }> = {
  longdong: { top: '26%', left: '90%' },
  defulan: { top: '42%', left: '68%' },
  guanziling: { top: '58%', left: '58%' },
  shoushan: { top: '75%', left: '54%' },
  kenting: { top: '90%', left: '60%' },
}

function CragMapPanel({
  crags,
  onCragPress,
}: {
  crags: CragListItem[]
  onCragPress: (id: string) => void
}) {
  const mappedCrags = crags.filter((crag) => cragMapPositions[crag.id])

  if (mappedCrags.length === 0) return null

  return (
    <View style={styles.mapCard}>
      <View style={styles.mapHeader}>
        <Text variant="body" fontWeight="600">
          岩場地圖
        </Text>
        <Text variant="small" color="textSubtle">
          點擊標記前往岩場
        </Text>
      </View>
      <View style={styles.mapCanvas}>
        <View style={styles.taiwanShape} />
        {mappedCrags.map((crag) => {
          const position = cragMapPositions[crag.id]
          return (
            <Pressable
              key={crag.id}
              onPress={() => onCragPress(crag.id)}
              style={({ pressed }) => [
                styles.mapMarker,
                { top: position.top, left: position.left },
                pressed && styles.mapMarkerPressed,
              ]}
              hitSlop={10}
            >
              <MapPin size={16} color="#FFFFFF" fill={SEMANTIC_COLORS.textMain} />
              <View style={styles.markerLabel}>
                <Text variant="caption" numberOfLines={1} style={styles.markerLabelText}>
                  {crag.name}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export default function CragListScreen() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const { data: crags = [], isLoading, refetch } = useCrags({ limit: 50 })
  const [refreshing, setRefreshing] = useState(false)

  const handleBack = () => {
    router.back()
  }

  const handleCragPress = useCallback(
    (id: string) => {
      router.push(`/crag/${id}` as any)
    },
    [router]
  )

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  // 過濾岩場
  const filteredCrags = useMemo(() => {
    if (!searchTerm.trim()) {
      return crags
    }
    const query = searchTerm.toLowerCase()
    return crags.filter(
      (crag) =>
        crag.name.toLowerCase().includes(query) ||
        crag.nameEn.toLowerCase().includes(query) ||
        crag.location.toLowerCase().includes(query)
    )
  }, [crags, searchTerm])

  const renderItem = useCallback(
    ({ item, index }: { item: CragListItem; index: number }) => (
      <CragCard
        id={item.id}
        name={item.name}
        nameEn={item.nameEn}
        location={item.location}
        type={item.type}
        rockType={item.rockType}
        routes={item.routes}
        difficulty={item.difficulty}
        seasons={item.seasons}
        image={item.image}
        onPress={() => handleCragPress(item.id)}
        index={index}
      />
    ),
    [handleCragPress]
  )

  const renderEmptyState = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
          <Text color="textSubtle" style={{ marginTop: SPACING.sm }}>
            載入中...
          </Text>
        </View>
      )
    }
    if (searchTerm) {
      return (
        <EmptyState
          icon={<Mountain size={48} color={SEMANTIC_COLORS.textMuted} />}
          title="找不到岩場"
          description={`沒有符合「${searchTerm}」的岩場`}
        />
      )
    }
    return (
      <EmptyState
        icon={<Mountain size={48} color={SEMANTIC_COLORS.textMuted} />}
        title="暫無岩場資料"
        description="岩場資料載入中，請稍後再試"
      />
    )
  }, [searchTerm, isLoading])

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
          <View style={styles.headerTitle}>
            <Text variant="h3" fontWeight="600">
              探索岩場
            </Text>
            <Text variant="small" color="textMuted">
              {filteredCrags.length} 個岩場
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* 搜尋欄 */}
        <SearchInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="搜尋岩場名稱或地點..."
          style={styles.searchInput}
        />

        {/* 副標題說明 */}
        <Text variant="small" color="textSubtle" style={styles.subtitle}>
          發現台灣各地最佳攀岩地點，從海蝕岩場到山區砂岩
        </Text>
      </View>

      {/* 岩場列表 */}
      <FlatList
        data={filteredCrags}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          filteredCrags.length > 0 ? (
            <CragMapPanel crags={filteredCrags} onCragPress={handleCragPress} />
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
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
    backgroundColor: SEMANTIC_COLORS.cardBg,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchInput: {
    marginHorizontal: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  mapCard: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderWidth: 1,
    borderColor: '#EBEAEA',
  },
  mapHeader: {
    gap: 2,
  },
  mapCanvas: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  taiwanShape: {
    width: 136,
    height: 224,
    borderTopLeftRadius: 90,
    borderTopRightRadius: 58,
    borderBottomLeftRadius: 82,
    borderBottomRightRadius: 110,
    backgroundColor: '#E5E7EB',
    transform: [{ rotate: '10deg' }],
  },
  mapMarker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -8 }, { translateY: -16 }],
  },
  mapMarkerPressed: {
    opacity: 0.72,
    transform: [{ translateX: -8 }, { translateY: -16 }, { scale: 0.94 }],
  },
  markerLabel: {
    maxWidth: 88,
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  markerLabelText: {
    color: '#FFFFFF',
  },
  separator: {
    height: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
})
