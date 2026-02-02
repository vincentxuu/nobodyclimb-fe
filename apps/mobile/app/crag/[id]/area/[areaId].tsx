/**
 * 區域詳情頁面
 *
 * 顯示特定攀岩區域的詳細資訊，包含：
 * - 區域基本資訊
 * - 難度分佈
 * - 區域內的路線列表
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Share,
  Pressable,
  FlatList,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown } from 'react-native-reanimated'
import {
  ChevronLeft,
  Share2,
  MapPin,
  Mountain,
  ChevronRight,
  Filter,
} from 'lucide-react-native'

import { Text, IconButton, Card } from '@/components/ui'
import { RouteListItem, RouteListFilter } from '@/components/crag'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'
import {
  type CragDetailData,
  type RouteSidebarItem,
  isGradeInRange,
  GRADE_FILTERS,
  TYPE_FILTERS,
} from '@/lib/crag-data'

// MVP 階段使用模擬資料
const MOCK_CRAG_DETAILS: Record<string, CragDetailData> = {
  longdong: {
    id: 'longdong',
    name: '龍洞',
    englishName: 'Long Dong',
    location: '新北市貢寮區龍洞灣',
    description: '龍洞是台灣最具代表性的戶外攀岩場地。',
    videoUrl: '',
    images: [],
    type: 'mixed',
    rockType: '四稜砂岩',
    routes: 616,
    difficulty: '5.3 - 5.14a',
    height: '5-100m',
    approach: '5-30分鐘步行',
    seasons: ['春', '秋', '冬'],
    transportation: [],
    parking: '龍洞灣公園停車場',
    amenities: [],
    googleMapsUrl: '',
    geoCoordinates: { latitude: 25.1085, longitude: 121.9215 },
    weatherLocation: '新北市貢寮區',
    areas: [
      { id: 'school-gate', name: '校門口', description: '校門口是龍洞最受歡迎的攀登區域之一，擁有多條適合初學者到中階攀岩者的路線。岩壁面向東北，下午時段有良好的遮陰。', difficulty: '5.6 - 5.12', routes: 51, image: '' },
      { id: 'clocktower', name: '鐘塔', description: '鐘塔區域以其高聳的岩壁聞名，提供多條長路線和多繩距攀登選擇。適合有經驗的攀岩者。', difficulty: '5.7 - 5.13', routes: 54, image: '' },
      { id: 'long-lane', name: '長巷', description: '長巷是一條狹長的岩溝，提供獨特的裂隙攀登體驗。路線多為傳統攀登風格。', difficulty: '5.8 - 5.12', routes: 47, image: '' },
      { id: 'music-hall', name: '音樂廳', description: '音樂廳是龍洞規模最大的攀登區域，擁有壯觀的半圓形岩壁和多樣化的路線選擇。', difficulty: '5.6 - 5.13', routes: 103, image: '' },
      { id: 'first-cave', name: '第一洞', description: '第一洞區域特色是有天然的岩洞地形，提供有趣的洞穴攀登體驗。', difficulty: '5.7 - 5.11', routes: 35, image: '' },
      { id: 'second-cave', name: '第二洞', description: '第二洞相較於第一洞規模較小，但路線品質優良，適合避開人群。', difficulty: '5.8 - 5.12', routes: 28, image: '' },
    ],
    routes_details: [
      // 校門口路線
      { id: 'r1', name: '小乖', englishName: 'Little Good', grade: '5.8', length: '15m', type: 'Sport', firstAscent: '', area: 'school-gate', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
      { id: 'r2', name: '大乖', englishName: 'Big Good', grade: '5.9', length: '18m', type: 'Sport', firstAscent: '', area: 'school-gate', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
      { id: 'r3', name: '乖乖', englishName: 'Good Good', grade: '5.7', length: '12m', type: 'Sport', firstAscent: '', area: 'school-gate', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
      { id: 'r4', name: '小壞', englishName: 'Little Bad', grade: '5.10a', length: '16m', type: 'Sport', firstAscent: '', area: 'school-gate', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
      { id: 'r5', name: '大壞', englishName: 'Big Bad', grade: '5.10c', length: '18m', type: 'Sport', firstAscent: '', area: 'school-gate', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
      { id: 'r6', name: '黃金路線', englishName: 'Golden Route', grade: '5.11a', length: '20m', type: 'Sport', firstAscent: '', area: 'school-gate', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
      // 鐘塔路線
      { id: 'r7', name: '黃色乖', englishName: 'Yellow Good', grade: '5.10a', length: '20m', type: 'Sport', firstAscent: '', area: 'clocktower', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
      { id: 'r8', name: '鐘塔直上', englishName: 'Clocktower Direct', grade: '5.11c', length: '25m', type: 'Trad', firstAscent: '', area: 'clocktower', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
      { id: 'r9', name: '時光隧道', englishName: 'Time Tunnel', grade: '5.10b', length: '22m', type: 'Trad', firstAscent: '', area: 'clocktower', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
      // 長巷路線
      { id: 'r10', name: '長巷裂隙', englishName: 'Long Lane Crack', grade: '5.9', length: '18m', type: 'Trad', firstAscent: '', area: 'long-lane', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
      { id: 'r11', name: '紅色長巷', englishName: 'Red Lane', grade: '5.10c', length: '20m', type: 'Trad', firstAscent: '', area: 'long-lane', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
      // 音樂廳路線
      { id: 'r12', name: '交響曲', englishName: 'Symphony', grade: '5.11b', length: '25m', type: 'Sport', firstAscent: '', area: 'music-hall', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
      { id: 'r13', name: '搖滾樂', englishName: 'Rock and Roll', grade: '5.10d', length: '22m', type: 'Sport', firstAscent: '', area: 'music-hall', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
      { id: 'r14', name: '爵士藍調', englishName: 'Jazz Blues', grade: '5.9', length: '18m', type: 'Sport', firstAscent: '', area: 'music-hall', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
    ],
    metadata: {
      source: 'Taiwan Climb Wiki',
      lastUpdated: '2026-01-09',
      maintainer: 'NobodyClimb',
      version: '1.0.0',
    },
  },
}

// 轉換為 RouteSidebarItem 格式
function convertToSidebarRoutes(routes: CragDetailData['routes_details']): RouteSidebarItem[] {
  return routes.map((route) => ({
    id: route.id,
    name: route.name,
    grade: route.grade,
    type: route.type,
    areaId: route.area,
    areaName: route.area,
    sector: undefined,
  }))
}

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
    if (grade.includes('5.6') || grade.includes('5.5') || grade.includes('5.4') || grade.includes('5.3')) {
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

  const [crag, setCrag] = useState<CragDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // 篩選狀態
  const [filterState, setFilterState] = useState({
    searchQuery: '',
    selectedGrade: 'all',
    selectedType: 'all',
  })

  // 載入資料
  const loadData = useCallback(async () => {
    if (!id || !areaId) return

    setIsLoading(true)
    try {
      // MVP 階段使用模擬資料
      await new Promise((resolve) => setTimeout(resolve, 300))
      const mockData = MOCK_CRAG_DETAILS[id] || MOCK_CRAG_DETAILS.longdong
      setCrag(mockData)
    } catch (err) {
      console.error('Failed to load area:', err)
    } finally {
      setIsLoading(false)
    }
  }, [id, areaId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  // 找到當前區域
  const area = useMemo(() => {
    if (!crag || !areaId) return null
    return crag.areas.find((a) => a.id === areaId) || null
  }, [crag, areaId])

  // 區域內的路線
  const areaRoutes = useMemo(() => {
    if (!crag || !areaId) return []
    const routes = crag.routes_details.filter((r) => r.area === areaId)
    return convertToSidebarRoutes(routes)
  }, [crag, areaId])

  // 過濾後的路線
  const filteredRoutes = useMemo(() => {
    let result = areaRoutes

    // 搜尋過濾
    if (filterState.searchQuery) {
      const query = filterState.searchQuery.toLowerCase()
      result = result.filter((route) =>
        route.name.toLowerCase().includes(query)
      )
    }

    // 難度過濾
    if (filterState.selectedGrade !== 'all') {
      result = result.filter((route) =>
        isGradeInRange(route.grade, filterState.selectedGrade)
      )
    }

    // 類型過濾
    if (filterState.selectedType !== 'all') {
      result = result.filter((route) => route.type === filterState.selectedType)
    }

    return result
  }, [areaRoutes, filterState])

  // 難度分佈
  const gradeDistribution = useMemo(() => {
    return calculateGradeDistribution(areaRoutes)
  }, [areaRoutes])

  // 找到最大值用於計算百分比
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
    router.push(`/crag/${id}/route/${routeId}` as any)
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  if (isLoading) {
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* 封面 */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.coverContainer}>
          <LinearGradient
            colors={['#6B8E9F', '#3D5A6C']}
            style={styles.coverPlaceholder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.gradient}
          />
          <View style={styles.coverContent}>
            <Text variant="h2" fontWeight="700" style={styles.coverTitle}>
              {area.name}
            </Text>
            <View style={styles.coverStats}>
              <View style={styles.statItem}>
                <Mountain size={16} color="#FFFFFF" />
                <Text variant="body" style={styles.statText}>
                  {area.routes} 條路線
                </Text>
              </View>
              <View style={styles.statDivider} />
              <Text variant="body" style={styles.statText}>
                {area.difficulty}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* 區域描述 */}
        {area.description && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                區域介紹
              </Text>
              <View style={styles.sectionDivider} />
            </View>
            <Text variant="body" color="textSubtle" style={styles.description}>
              {area.description}
            </Text>
          </Animated.View>
        )}

        {/* 難度分佈 */}
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
                    style={[
                      styles.distributionBar,
                      { width: `${(count / maxCount) * 100}%` },
                    ]}
                  />
                </View>
                <Text variant="small" color="textSubtle" style={styles.distributionCount}>
                  {count}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

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
              onTypeChange={(type) =>
                setFilterState((prev) => ({ ...prev, selectedType: type }))
              }
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

        {filteredRoutes.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text color="textSubtle">沒有符合條件的路線</Text>
          </View>
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
  description: {
    lineHeight: 22,
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
  bottomPadding: {
    height: 40,
  },
})
