/**
 * 岩場列表頁面
 *
 * 對應 apps/web/src/app/crag/page.tsx
 */
import React, { useState, useCallback, useMemo } from 'react'
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft, MapPin, Mountain } from 'lucide-react-native'

import { Text, SearchInput, IconButton, EmptyState } from '@/components/ui'
import { CragCard } from '@/components/crag'
import { getAllCrags, searchCrags, type CragListItem } from '@/lib/crag-data'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

export default function CragListScreen() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [crags, setCrags] = useState<CragListItem[]>(() => getAllCrags())

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
    // 重新載入資料
    setCrags(getAllCrags())
    setRefreshing(false)
  }, [])

  // 過濾岩場
  const filteredCrags = useMemo(() => {
    if (!searchTerm.trim()) {
      return crags
    }
    return searchCrags({ query: searchTerm })
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
  }, [searchTerm])

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
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
  separator: {
    height: SPACING.sm,
  },
})
