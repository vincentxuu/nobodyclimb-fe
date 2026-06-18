/**
 * 區域詳情頁面
 *
 * 顯示特定攀岩區域的詳細資訊，包含：
 * - 區域基本資訊
 * - 難度分佈
 * - 區域內的路線列表
 */

import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft, Filter, MapPin, Mountain, Share2 } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteListFilter, RouteListItem } from '@/components/crag'
import { IconButton, Text } from '@/components/ui'
import { isGradeInRange, type RouteSidebarItem } from '@/lib/crag-data'
import { useCragAreas, useCragDetail, useCragRoutes } from '@/lib/hooks/useCrags'

// 計算難度分佈
function calculateGradeDistribution(routes: RouteSidebarItem[]): Record<string, number> {
  const distribution: Record<string, number> = {
    '5.6-': 0,
    '5.7-5.8': 0,
    '5.9-5.10a': 0,
    '5.10b-5.10d': 0,
    '5.11': 0,
    '5.12+': 0,
  }

  routes.forEach((route) => {
    const grade = route.grade.toLowerCase()
    if (
      grade.includes('5.6') ||
      grade.includes('5.5') ||
      grade.includes('5.4') ||
      grade.includes('5.3')
    ) {
      distribution['5.6-']++
    } else if (grade.includes('5.7') || grade.includes('5.8')) {
      distribution['5.7-5.8']++
    } else if (grade.includes('5.9') || grade.includes('5.10a')) {
      distribution['5.9-5.10a']++
    } else if (grade.includes('5.10b') || grade.includes('5.10c') || grade.includes('5.10d')) {
      distribution['5.10b-5.10d']++
    } else if (grade.includes('5.11')) {
      distribution['5.11']++
    } else if (grade.includes('5.12') || grade.includes('5.13') || grade.includes('5.14')) {
      distribution['5.12+']++
    }
  })

  return distribution
}

export default function AreaDetailScreen() {
  const router = useRouter()
  const { id, areaId } = useLocalSearchParams<{ id: string; areaId: string }>()

  const [refreshing, setRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // 使用 API hooks 獲取資料
  const { data: crag, isLoading: isCragLoading, refetch: refetchCrag } = useCragDetail(id)
  const { data: allRoutes = [], refetch: refetchRoutes } = useCragRoutes(id)
  const { data: apiAreas = [] } = useCragAreas(id)

  // 篩選狀態
  const [filterState, setFilterState] = useState({
    searchQuery: '',
    selectedGrade: 'all',
    selectedType: 'all',
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchCrag(), refetchRoutes()])
    setRefreshing(false)
  }

  // 找到當前區域
  const area = useMemo(() => {
    if (!areaId) return null
    // 先從 apiAreas 找
    const fromApi = apiAreas.find((a) => a.id === areaId)
    if (fromApi) return fromApi
    // 再從 crag.areas 找
    if (crag?.areas) {
      const fromCrag = crag.areas.find((a) => a.id === areaId)
      if (fromCrag)
        return {
          id: fromCrag.id,
          name: fromCrag.name,
          description: fromCrag.description,
          difficulty: fromCrag.difficulty,
          routes: fromCrag.routes,
          nameEn: '',
          descriptionEn: '',
          boltCount: 0,
        }
    }
    return null
  }, [apiAreas, crag, areaId])

  // 區域內的路線
  const areaRoutes = useMemo(() => {
    if (!areaId) return []
    return allRoutes.filter((r) => r.areaId === areaId)
  }, [allRoutes, areaId])

  // 過濾後的路線
  const filteredRoutes = useMemo(() => {
    let result = areaRoutes

    if (filterState.searchQuery) {
      const query = filterState.searchQuery.toLowerCase()
      result = result.filter((route) => route.name.toLowerCase().includes(query))
    }

    if (filterState.selectedGrade !== 'all') {
      result = result.filter((route) => isGradeInRange(route.grade, filterState.selectedGrade))
    }

    if (filterState.selectedType !== 'all') {
      result = result.filter((route) => route.type === filterState.selectedType)
    }

    return result
  }, [areaRoutes, filterState])

  // 難度分佈
  const gradeDistribution = useMemo(() => {
    return calculateGradeDistribution(areaRoutes)
  }, [areaRoutes])

  const typeDistribution = useMemo(() => {
    return areaRoutes.reduce<Record<string, number>>((acc, route) => {
      const routeType = route.type || '未分類'
      acc[routeType] = (acc[routeType] || 0) + 1
      return acc
    }, {})
  }, [areaRoutes])

  const otherAreas = useMemo(() => {
    return apiAreas.filter((item) => item.id !== areaId).slice(0, 3)
  }, [apiAreas, areaId])

  const maxCount = useMemo(() => {
    return Math.max(...Object.values(gradeDistribution), 1)
  }, [gradeDistribution])

  const handleBack = () => {
    router.back()
  }

  const handleShare = async () => {
    if (!crag || !area) return
    try {
      await Share.share({
        title: `${area.name} - ${crag.name} - NobodyClimb`,
        message: `來看看 ${crag.name} 的 ${area.name} 區域！\nhttps://nobodyclimb.cc/crag/${crag.id}/area/${areaId}`,
      })
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const handleRoutePress = (routeId: string) => {
    const params: Record<string, string> = { area: areaId }
    if (filterState.selectedGrade !== 'all') params.grade = filterState.selectedGrade
    if (filterState.selectedType !== 'all') params.type = filterState.selectedType
    if (filterState.searchQuery) params.q = filterState.searchQuery

    const qs = new URLSearchParams(params).toString()
    router.push(`/crag/${id}/route/${routeId}${qs ? '?' + qs : ''}` as any)
  }

  const handleAreaNavigate = (targetAreaId: string) => {
    router.push(`/crag/${id}/area/${targetAreaId}` as any)
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  if (isCragLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
        </View>
      </SafeAreaView>
    )
  }

  if (!crag || !area) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
        </View>
        <View style={styles.errorContainer}>
          <Text color="textSubtle">找不到此區域</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 導航列 */}
      <View style={styles.header}>
        <IconButton
          icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleBack}
          variant="ghost"
        />
        <View style={styles.headerTitleContainer}>
          <Text variant="body" fontWeight="600" numberOfLines={1}>
            {area.name}
          </Text>
          <Text variant="caption" color="textSubtle">
            {crag.name}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <IconButton
            icon={<Share2 size={20} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleShare}
            variant="ghost"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* 封面 */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.coverContainer}>
          <LinearGradient
            colors={['#6B8E9F', '#3D5A6C']}
            style={styles.coverPlaceholder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.gradient} />
          <View style={styles.coverContent}>
            <Text variant="h2" fontWeight="700" style={styles.coverTitle}>
              {area.name}
            </Text>
            {area.nameEn ? (
              <Text variant="body" style={styles.coverSubtitle}>
                {area.nameEn}
              </Text>
            ) : null}
            <View style={styles.coverStats}>
              <View style={styles.statItem}>
                <Mountain size={16} color="#FFFFFF" />
                <Text variant="body" style={styles.statText}>
                  {area.routes || areaRoutes.length} 條路線
                </Text>
              </View>
              {area.difficulty && (
                <>
                  <View style={styles.statDivider} />
                  <Text variant="body" style={styles.statText}>
                    {area.difficulty}
                  </Text>
                </>
              )}
            </View>
          </View>
        </Animated.View>

        {/* 快速統計 */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.statCards}>
          <View style={styles.statCard}>
            <Text variant="caption" color="textMuted">
              路線數
            </Text>
            <Text variant="h4" fontWeight="700">
              {areaRoutes.length}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text variant="caption" color="textMuted">
              難度範圍
            </Text>
            <Text variant="h4" fontWeight="700" numberOfLines={1}>
              {area.difficulty || 'N/A'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text variant="caption" color="textMuted">
              Bolts
            </Text>
            <Text variant="h4" fontWeight="700">
              {area.boltCount || 0}
            </Text>
          </View>
        </Animated.View>

        {/* 區域描述 */}
        {(area.description || area.descriptionEn) && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                區域介紹
              </Text>
              <View style={styles.sectionDivider} />
            </View>
            {area.description ? (
              <Text variant="body" color="textSubtle" style={styles.description}>
                {area.description}
              </Text>
            ) : null}
            {area.descriptionEn ? (
              <Text variant="body" color="textMuted" style={styles.descriptionEn}>
                {area.descriptionEn}
              </Text>
            ) : null}
          </Animated.View>
        )}

        {/* 難度分佈 */}
        {areaRoutes.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                難度分佈
              </Text>
              <View style={styles.sectionDivider} />
            </View>
            <View style={styles.distributionContainer}>
              {Object.entries(gradeDistribution).map(([grade, count]) => (
                <View key={grade} style={styles.distributionRow}>
                  <Text variant="small" style={styles.distributionLabel}>
                    {grade}
                  </Text>
                  <View style={styles.distributionBarContainer}>
                    <View
                      style={[styles.distributionBar, { width: `${(count / maxCount) * 100}%` }]}
                    />
                  </View>
                  <Text variant="small" color="textSubtle" style={styles.distributionCount}>
                    {count}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* 路線類型分佈 */}
        {Object.keys(typeDistribution).length > 0 && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                路線類型分佈
              </Text>
              <View style={styles.sectionDivider} />
            </View>
            <View style={styles.typeChips}>
              {Object.entries(typeDistribution).map(([routeType, count]) => (
                <View key={routeType} style={styles.typeChip}>
                  <Text variant="small" fontWeight="600">
                    {routeType}
                  </Text>
                  <Text variant="small" color="textMuted">
                    ({count})
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* 路線列表標題和篩選 */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.routesHeader}>
          <View style={styles.routesTitleRow}>
            <Text variant="h4" fontWeight="600">
              路線列表
            </Text>
            <Pressable onPress={toggleFilters} style={styles.filterButton}>
              <Filter size={16} color={showFilters ? '#F97316' : SEMANTIC_COLORS.textSubtle} />
              <Text
                variant="small"
                style={{ color: showFilters ? '#F97316' : SEMANTIC_COLORS.textSubtle }}
              >
                篩選
              </Text>
            </Pressable>
          </View>
          <Text variant="small" color="textSubtle">
            共 {filteredRoutes.length} / {areaRoutes.length} 條路線
          </Text>
        </Animated.View>

        {/* 篩選器 */}
        {showFilters && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.filterSection}>
            <RouteListFilter
              searchQuery={filterState.searchQuery}
              selectedArea="all"
              selectedSector="all"
              selectedGrade={filterState.selectedGrade}
              selectedType={filterState.selectedType}
              onSearchChange={(query) =>
                setFilterState((prev) => ({ ...prev, searchQuery: query }))
              }
              onAreaChange={() => {}}
              onSectorChange={() => {}}
              onGradeChange={(grade) =>
                setFilterState((prev) => ({ ...prev, selectedGrade: grade }))
              }
              onTypeChange={(type) => setFilterState((prev) => ({ ...prev, selectedType: type }))}
              areas={[]}
              sectors={[]}
              showAreaFilter={false}
              showSectorFilter={false}
            />
          </Animated.View>
        )}

        {/* 路線列表 */}
        <View style={styles.routesList}>
          {filteredRoutes.map((route, index) => (
            <Animated.View
              key={route.id}
              entering={FadeInDown.delay(400 + index * 50).duration(300)}
            >
              <RouteListItem
                id={route.id}
                name={route.name}
                grade={route.grade}
                type={route.type}
                onPress={() => handleRoutePress(route.id)}
              />
            </Animated.View>
          ))}
        </View>

        {filteredRoutes.length === 0 && !isCragLoading && (
          <View style={styles.emptyContainer}>
            <Text color="textSubtle">沒有符合條件的路線</Text>
          </View>
        )}

        {/* 其他區域推薦 */}
        {otherAreas.length > 0 && (
          <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                {crag.name} 的其他區域
              </Text>
              <View style={styles.sectionDivider} />
            </View>
            <View style={styles.otherAreas}>
              {otherAreas.map((otherArea) => (
                <Pressable
                  key={otherArea.id}
                  onPress={() => handleAreaNavigate(otherArea.id)}
                  style={({ pressed }) => [
                    styles.otherAreaCard,
                    pressed && styles.otherAreaCardPressed,
                  ]}
                >
                  <View style={styles.otherAreaContent}>
                    <Text variant="body" fontWeight="600" numberOfLines={1}>
                      {otherArea.name}
                    </Text>
                    <View style={styles.otherAreaMeta}>
                      <MapPin size={13} color={SEMANTIC_COLORS.textMuted} />
                      <Text variant="caption" color="textMuted" numberOfLines={1}>
                        {(otherArea.difficulty || 'N/A') +
                          ' · ' +
                          (otherArea.routes || 0) +
                          ' 條路線'}
                      </Text>
                    </View>
                  </View>
                  <ChevronLeft
                    size={18}
                    color={SEMANTIC_COLORS.textMuted}
                    style={styles.otherAreaChevron}
                  />
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverContainer: {
    position: 'relative',
    height: 180,
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  coverContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
  },
  coverTitle: {
    color: '#FFFFFF',
  },
  coverSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  coverStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statText: {
    color: 'rgba(255,255,255,0.9)',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: SPACING.sm,
  },
  section: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  sectionHeader: {
    marginBottom: SPACING.sm,
  },
  sectionTitleOrange: {
    color: '#F97316',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginTop: SPACING.xs,
  },
  statCards: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  description: {
    lineHeight: 22,
  },
  descriptionEn: {
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  distributionContainer: {
    gap: SPACING.sm,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  distributionLabel: {
    width: 80,
    color: SEMANTIC_COLORS.textSubtle,
  },
  distributionBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 6,
  },
  distributionCount: {
    width: 24,
    textAlign: 'right',
  },
  typeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#EBEAEA',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  routesHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  routesTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  filterSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  routesList: {
    paddingHorizontal: SPACING.md,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  otherAreas: {
    gap: SPACING.sm,
  },
  otherAreaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBEAEA',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  otherAreaCardPressed: {
    backgroundColor: '#F8F8F8',
  },
  otherAreaContent: {
    flex: 1,
  },
  otherAreaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  otherAreaChevron: {
    transform: [{ rotate: '180deg' }],
  },
  bottomPadding: {
    height: 40,
  },
})
