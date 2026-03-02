/**
 * 岩場詳情頁面
 *
 * 對應 apps/web/src/app/crag/[id]/CragDetailClient.tsx
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Share,
  Linking,
  Pressable,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  ChevronLeft,
  Share2,
  MapPin,
  Mountain,
  Sun,
  Navigation,
  ExternalLink,
  List,
  Car,
  Bus,
  Clock,
  ChevronRight,
} from 'lucide-react-native'

import { Text, IconButton, Button, Card } from '@/components/ui'
import { AreaCard, InfoCard, InfoRow, RouteDrawer, type RouteDrawerRef } from '@/components/crag'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'
import {
  getAllCrags,
  type CragListItem,
  type CragDetailData,
  type RouteSidebarItem,
  isGradeInRange,
} from '@/lib/crag-data'

// 為了 MVP 階段，使用靜態資料
const MOCK_CRAG_DETAILS: Record<string, CragDetailData> = {
  longdong: {
    id: 'longdong',
    name: '龍洞',
    englishName: 'Long Dong',
    location: '新北市貢寮區龍洞灣',
    description:
      '龍洞是台灣最具代表性的戶外攀岩場地，位於新北市貢寮區，擁有壯觀的海岸岩壁和多樣化的攀登路線。是台灣規模最大、路線最多的天然岩場。',
    videoUrl: '',
    liveVideoId: '8-xSAfWwh10',
    liveVideoTitle: '龍洞即時影像',
    liveVideoDescription: '龍洞岩場周邊即時影像',
    images: ['/images/crag/longdong-1.jpg'],
    type: 'mixed',
    rockType: '四稜砂岩',
    routes: 616,
    difficulty: '5.3 - 5.14a',
    height: '5-100m',
    approach: '5-30分鐘步行',
    seasons: ['春', '秋', '冬'],
    transportation: [
      {
        type: '開車',
        description: '從台北走國道1號轉台2線濱海公路，約1.5小時車程',
      },
      {
        type: '大眾運輸',
        description: '從瑞芳火車站搭乘基隆客運至龍洞站',
      },
    ],
    parking: '龍洞灣公園停車場',
    amenities: ['停車場', '廁所', '海灘', '浮潛'],
    googleMapsUrl: 'https://maps.app.goo.gl/CgDGjdp3NX1cGUQK6',
    geoCoordinates: {
      latitude: 25.1085,
      longitude: 121.9215,
    },
    weatherLocation: '新北市貢寮區',
    areas: [
      { id: 'school-gate', name: '校門口', description: '校門口攀登區域', difficulty: '5.6 - 5.12', routes: 51, image: '' },
      { id: 'clocktower', name: '鐘塔', description: '鐘塔攀登區域', difficulty: '5.7 - 5.13', routes: 54, image: '' },
      { id: 'long-lane', name: '長巷', description: '長巷攀登區域', difficulty: '5.8 - 5.12', routes: 47, image: '' },
      { id: 'music-hall', name: '音樂廳', description: '音樂廳攀登區域', difficulty: '5.6 - 5.13', routes: 103, image: '' },
    ],
    routes_details: [
      { id: 'r1', name: '小乖', englishName: 'Little Good', grade: '5.8', length: '15m', type: 'Sport', firstAscent: '', area: '校門口', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
      { id: 'r2', name: '大乖', englishName: 'Big Good', grade: '5.9', length: '18m', type: 'Sport', firstAscent: '', area: '校門口', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
      { id: 'r3', name: '黃色乖', englishName: 'Yellow Good', grade: '5.10a', length: '20m', type: 'Sport', firstAscent: '', area: '鐘塔', description: '', protection: '', popularity: 0, views: 0, images: [], videos: [], tips: '', instagramPosts: [], youtubeVideos: [] },
    ],
    metadata: {
      source: 'Taiwan Climb Wiki',
      sourceUrl: 'https://climb.tw',
      lastUpdated: '2026-01-09',
      maintainer: 'NobodyClimb',
      maintainerUrl: 'https://nobodyclimb.cc',
      version: '1.0.0',
    },
  },
}

// 轉換為 RouteSidebarItem 格式
function convertToSidebarRoutes(crag: CragDetailData): RouteSidebarItem[] {
  return crag.routes_details.map((route) => ({
    id: route.id,
    name: route.name,
    grade: route.grade,
    type: route.type,
    areaId: route.area,
    areaName: route.area,
    sector: undefined,
  }))
}

export default function CragDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const drawerRef = useRef<RouteDrawerRef>(null)

  const [crag, setCrag] = useState<CragDetailData | null>(null)
  const [routes, setRoutes] = useState<RouteSidebarItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 篩選狀態
  const [filterState, setFilterState] = useState({
    searchQuery: '',
    selectedArea: 'all',
    selectedSector: 'all',
    selectedGrade: 'all',
    selectedType: 'all',
  })

  // 載入資料
  const loadCrag = useCallback(async () => {
    if (!id) return

    setIsLoading(true)
    try {
      // MVP 階段使用模擬資料
      await new Promise((resolve) => setTimeout(resolve, 300))

      const mockData = MOCK_CRAG_DETAILS[id] || MOCK_CRAG_DETAILS.longdong
      setCrag({
        ...mockData,
        id: id,
      })
      setRoutes(convertToSidebarRoutes(mockData))
    } catch (err) {
      console.error('Failed to load crag:', err)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadCrag()
  }, [loadCrag])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadCrag()
    setRefreshing(false)
  }, [loadCrag])

  // 過濾路線
  const filteredRoutes = useMemo(() => {
    let result = routes

    // 搜尋過濾
    if (filterState.searchQuery) {
      const query = filterState.searchQuery.toLowerCase()
      result = result.filter((route) =>
        route.name.toLowerCase().includes(query)
      )
    }

    // 區域過濾
    if (filterState.selectedArea !== 'all') {
      result = result.filter(
        (route) => route.areaName === filterState.selectedArea
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
  }, [routes, filterState])

  // 區域列表
  const areas = useMemo(() => {
    if (!crag) return []
    return crag.areas.map((area) => ({ id: area.name, name: area.name }))
  }, [crag])

  const handleBack = () => {
    router.back()
  }

  const handleShare = async () => {
    if (!crag) return
    try {
      await Share.share({
        title: `${crag.name} - NobodyClimb`,
        message: `來看看 ${crag.name} 岩場！\nhttps://nobodyclimb.cc/crag/${crag.id}`,
      })
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const handleNavigate = () => {
    if (!crag?.geoCoordinates) return
    const url = `https://www.google.com/maps/dir/?api=1&destination=${crag.geoCoordinates.latitude},${crag.geoCoordinates.longitude}`
    Linking.openURL(url)
  }

  const handleOpenMap = () => {
    if (!crag?.googleMapsUrl) return
    Linking.openURL(crag.googleMapsUrl)
  }

  const handleAreaPress = (areaId: string) => {
    router.push(`/crag/${id}/area/${areaId}` as any)
  }

  const handleRoutePress = (routeId: string) => {
    router.push(`/crag/${id}/route/${routeId}` as any)
  }

  const handleOpenDrawer = () => {
    drawerRef.current?.open()
  }

  const handleCloseDrawer = () => {
    drawerRef.current?.close()
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

  if (!crag) {
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
          <Text color="textSubtle">找不到此岩場</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 導航列 */}
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
          <IconButton
            icon={<Share2 size={20} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleShare}
            variant="ghost"
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* 封面圖 */}
          <View style={styles.coverContainer}>
            <LinearGradient
              colors={['#8B7355', '#5D4E37']}
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
                {crag.name}
              </Text>
              <Text variant="body" style={styles.coverSubtitle}>
                {crag.englishName}
              </Text>
              <View style={styles.locationRow}>
                <MapPin size={16} color="#FFFFFF" />
                <Text variant="body" style={styles.coverLocation}>
                  {crag.location}
                </Text>
              </View>
            </View>
          </View>

          {/* 快速資訊 */}
          <View style={styles.quickInfo}>
            <View style={styles.infoItem}>
              <Mountain size={20} color={SEMANTIC_COLORS.textSubtle} />
              <Text variant="small" color="textSubtle">
                {crag.routes} 條路線
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="small" color="textSubtle">
                {crag.difficulty}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Sun size={20} color={SEMANTIC_COLORS.textSubtle} />
              <Text variant="small" color="textSubtle">
                {crag.seasons.join('、')}
              </Text>
            </View>
          </View>

          {/* 導航按鈕 */}
          <View style={styles.actionSection}>
            <Button
              variant="primary"
              size="lg"
              onPress={handleNavigate}
              style={styles.navButton}
            >
              <Navigation size={18} color="#FFFFFF" />
              <Text fontWeight="600" style={styles.navButtonText}>
                導航前往
              </Text>
            </Button>
          </View>

          {/* 岩場介紹 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                岩場介紹
              </Text>
              <View style={styles.sectionDivider} />
            </View>
            <Text variant="body" color="textSubtle" style={styles.description}>
              {crag.description}
            </Text>
          </View>

          {/* 岩場基本資訊 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                岩場基本資訊
              </Text>
              <View style={styles.sectionDivider} />
            </View>
            <View style={styles.infoGrid}>
              <InfoRow label="岩場類型" value={crag.type} />
              <InfoRow label="岩石類型" value={crag.rockType} />
              <InfoRow label="路線數量" value={`~${crag.routes}`} />
              <InfoRow label="難度範圍" value={crag.difficulty} />
              <InfoRow label="岩壁高度" value={crag.height} />
              <InfoRow label="步行時間" value={crag.approach} />
            </View>
          </View>

          {/* 交通方式 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                交通方式
              </Text>
              <View style={styles.sectionDivider} />
            </View>
            <View style={styles.infoGrid}>
              {crag.transportation.map((item, index) => (
                <View key={index} style={styles.transportRow}>
                  {item.type === '開車' ? (
                    <Car size={16} color={SEMANTIC_COLORS.textSubtle} />
                  ) : (
                    <Bus size={16} color={SEMANTIC_COLORS.textSubtle} />
                  )}
                  <View style={styles.transportContent}>
                    <Text variant="small" fontWeight="500">
                      {item.type}
                    </Text>
                    <Text variant="small" color="textSubtle">
                      {item.description}
                    </Text>
                  </View>
                </View>
              ))}
              <InfoRow label="停車" value={crag.parking} />
            </View>
          </View>

          {/* 岩場位置 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                岩場位置
              </Text>
              <View style={styles.sectionDivider} />
            </View>
            <Pressable onPress={handleOpenMap} style={styles.mapLink}>
              <MapPin size={14} color="#2563EB" />
              <Text variant="small" style={styles.mapLinkText}>
                在 Google Maps 開啟
              </Text>
              <ExternalLink size={12} color="#2563EB" />
            </Pressable>
          </View>

          {/* 岩場設施 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                岩場設施
              </Text>
              <View style={styles.sectionDivider} />
            </View>
            <View style={styles.amenitiesList}>
              {crag.amenities.map((item, index) => (
                <View key={index} style={styles.amenityTag}>
                  <Text variant="small" color="textSubtle">
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 攀岩區域 */}
          {crag.areas.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="h4" fontWeight="600">
                  攀岩區域
                </Text>
              </View>
              <View style={styles.areaGrid}>
                {crag.areas.map((area) => (
                  <AreaCard
                    key={area.id}
                    id={area.id}
                    name={area.name}
                    description={area.description}
                    difficulty={area.difficulty}
                    routesCount={area.routes}
                    image={area.image}
                    onPress={() => handleAreaPress(area.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 資料來源 */}
          {crag.metadata && (
            <View style={styles.section}>
              <View style={styles.metadataContainer}>
                <Text variant="caption" color="textMuted">
                  資料來源：{crag.metadata.source}
                </Text>
                <Text variant="caption" color="textMuted">
                  最後更新：{crag.metadata.lastUpdated}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* 浮動按鈕 - 開啟路線列表 */}
        <Pressable
          style={styles.floatingButton}
          onPress={handleOpenDrawer}
        >
          <List size={24} color="#FFFFFF" />
        </Pressable>

        {/* 路線抽屜 */}
        <RouteDrawer
          ref={drawerRef}
          cragName={crag.name}
          routes={routes}
          filteredRoutes={filteredRoutes}
          filterState={filterState}
          onSearchChange={(query) =>
            setFilterState((prev) => ({ ...prev, searchQuery: query }))
          }
          onAreaChange={(area) =>
            setFilterState((prev) => ({
              ...prev,
              selectedArea: area,
              selectedSector: 'all',
            }))
          }
          onSectorChange={(sector) =>
            setFilterState((prev) => ({ ...prev, selectedSector: sector }))
          }
          onGradeChange={(grade) =>
            setFilterState((prev) => ({ ...prev, selectedGrade: grade }))
          }
          onTypeChange={(type) =>
            setFilterState((prev) => ({ ...prev, selectedType: type }))
          }
          areas={areas}
          sectors={[]}
          onRoutePress={handleRoutePress}
          onClose={handleCloseDrawer}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    height: 220,
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
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  coverLocation: {
    color: '#FFFFFF',
  },
  quickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionSection: {
    padding: SPACING.md,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  navButtonText: {
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
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
  infoGrid: {
    gap: SPACING.sm,
  },
  transportRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  transportContent: {
    flex: 1,
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  mapLinkText: {
    color: '#2563EB',
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  amenityTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 16,
  },
  areaGrid: {
    gap: SPACING.sm,
  },
  metadataContainer: {
    gap: 4,
  },
  bottomPadding: {
    height: 100,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1B1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
})
