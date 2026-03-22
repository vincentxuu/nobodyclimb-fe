/**
 * 岩場詳情頁面
 *
 * 對應 apps/web/src/app/crag/[id]/CragDetailClient.tsx
 */
import React, { useState, useCallback, useRef, useMemo } from 'react'
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
} from 'lucide-react-native'

import { Text, IconButton, Button } from '@/components/ui'
import {
  AreaCard, InfoRow, RouteDrawer, type RouteDrawerRef,
  WeatherDisplay, YouTubeLiveCard, TrafficCamerasCard, DataSourceSection,
  GradeDistributionChart, computeGradeRanges, GoogleMapsEmbed,
} from '@/components/crag'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'
import { useCragDetail, useCragRoutes, useCragAreas } from '@/lib/hooks/useCrags'
import { isGradeInRange, type RouteSidebarItem } from '@/lib/crag-data'

export default function CragDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const drawerRef = useRef<RouteDrawerRef>(null)

  // 使用 API hooks 獲取資料
  const {
    data: crag,
    isLoading: isCragLoading,
    error: cragError,
    refetch: refetchCrag,
  } = useCragDetail(id)
  const { data: routes = [], refetch: refetchRoutes } = useCragRoutes(id)
  const { data: apiAreas = [] } = useCragAreas(id)

  const [refreshing, setRefreshing] = useState(false)

  // 篩選狀態
  const [filterState, setFilterState] = useState({
    searchQuery: '',
    selectedArea: 'all',
    selectedSector: 'all',
    selectedGrade: 'all',
    selectedType: 'all',
  })

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchCrag(), refetchRoutes()])
    setRefreshing(false)
  }, [refetchCrag, refetchRoutes])

  // 過濾路線
  const filteredRoutes = useMemo(() => {
    let result = routes

    if (filterState.searchQuery) {
      const query = filterState.searchQuery.toLowerCase()
      result = result.filter((route) =>
        route.name.toLowerCase().includes(query)
      )
    }

    if (filterState.selectedArea !== 'all') {
      result = result.filter(
        (route) => route.areaId === filterState.selectedArea || route.areaName === filterState.selectedArea
      )
    }

    if (filterState.selectedSector !== 'all') {
      result = result.filter((route) => route.sector === filterState.selectedSector)
    }

    if (filterState.selectedGrade !== 'all') {
      result = result.filter((route) =>
        isGradeInRange(route.grade, filterState.selectedGrade)
      )
    }

    if (filterState.selectedType !== 'all') {
      result = result.filter((route) => route.type === filterState.selectedType)
    }

    return result
  }, [routes, filterState])

  // 區域列表（用於篩選）
  const areas = useMemo(() => {
    return apiAreas.map((area) => ({ id: area.id, name: area.name }))
  }, [apiAreas])

  // Sector 列表（依選取的區域動態計算）
  const sectors = useMemo(() => {
    if (filterState.selectedArea === 'all') return []
    const sectorsSet = new Set<string>()
    routes
      .filter(route => route.areaId === filterState.selectedArea && route.sector)
      .forEach(route => sectorsSet.add(route.sector!))
    return Array.from(sectorsSet).map(sector => ({ id: sector, name: sector }))
  }, [routes, filterState.selectedArea])

  // 用已拉取的 routes 計算每個 area 的實際路線數
  const areaRouteCountMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const route of routes) {
      if (route.areaId) {
        map.set(route.areaId, (map.get(route.areaId) || 0) + 1)
      }
    }
    return map
  }, [routes])

  // 難度分佈
  const gradeRanges = useMemo(() => {
    return computeGradeRanges(routes.map((r) => r.grade))
  }, [routes])

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

  if (isCragLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
        </View>
      </SafeAreaView>
    )
  }

  if (cragError || !crag) {
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
            {crag.seasons && crag.seasons.length > 0 && (
              <View style={styles.infoItem}>
                <Sun size={20} color={SEMANTIC_COLORS.textSubtle} />
                <Text variant="small" color="textSubtle">
                  {crag.seasons.join('、')}
                </Text>
              </View>
            )}
          </View>

          {/* 導航按鈕 */}
          {crag.geoCoordinates && (
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
          )}

          {/* 岩場介紹 */}
          {crag.description && (
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
          )}

          {/* 岩場基本資訊 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                岩場基本資訊
              </Text>
              <View style={styles.sectionDivider} />
            </View>
            <View style={styles.infoGrid}>
              {crag.type && <InfoRow label="岩場類型" value={crag.type} />}
              {crag.rockType && <InfoRow label="岩石類型" value={crag.rockType} />}
              <InfoRow label="路線數量" value={`~${crag.routes}`} />
              {crag.difficulty && <InfoRow label="難度範圍" value={crag.difficulty} />}
              {crag.height && <InfoRow label="岩壁高度" value={crag.height} />}
              {crag.approach && <InfoRow label="步行時間" value={crag.approach} />}
            </View>
          </View>

          {/* 交通方式 */}
          {crag.transportation && crag.transportation.length > 0 && (
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
                {crag.parking && <InfoRow label="停車" value={crag.parking} />}
              </View>
            </View>
          )}

          {/* 岩場位置 */}
          {(crag.googleMapsUrl || crag.geoCoordinates) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                  岩場位置
                </Text>
                <View style={styles.sectionDivider} />
              </View>
              {crag.googleMapsUrl && (
                <Pressable onPress={handleOpenMap} style={styles.mapLink}>
                  <MapPin size={14} color="#2563EB" />
                  <Text variant="small" style={styles.mapLinkText}>
                    在 Google Maps 開啟
                  </Text>
                  <ExternalLink size={12} color="#2563EB" />
                </Pressable>
              )}
              {crag.geoCoordinates && (
                <View style={{ marginTop: SPACING.sm }}>
                  <GoogleMapsEmbed
                    latitude={crag.geoCoordinates.latitude}
                    longitude={crag.geoCoordinates.longitude}
                  />
                </View>
              )}
            </View>
          )}

          {/* 岩場設施 */}
          {crag.amenities && crag.amenities.length > 0 && (
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
          )}

          {/* 難度分佈 */}
          {routes.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                  難度分佈
                </Text>
                <View style={styles.sectionDivider} />
              </View>
              <GradeDistributionChart
                gradeRanges={gradeRanges}
                totalRoutes={routes.length}
              />
            </View>
          )}

          {/* 天氣預報 */}
          {(crag.weatherLocation || crag.geoCoordinates) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                  天氣預報
                </Text>
                <View style={styles.sectionDivider} />
              </View>
              <WeatherDisplay
                location={crag.weatherLocation || crag.location}
                latitude={crag.geoCoordinates?.latitude}
                longitude={crag.geoCoordinates?.longitude}
              />
            </View>
          )}

          {/* 即時影像 */}
          {(crag.liveVideoId || crag.geoCoordinates) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                  即時影像
                </Text>
                <View style={styles.sectionDivider} />
              </View>
              <View style={{ gap: SPACING[4] }}>
                {crag.geoCoordinates && (
                  <TrafficCamerasCard
                    latitude={crag.geoCoordinates.latitude}
                    longitude={crag.geoCoordinates.longitude}
                  />
                )}
                {crag.liveVideoId && (
                  <YouTubeLiveCard
                    videoId={crag.liveVideoId}
                    title={crag.liveVideoTitle}
                    description={crag.liveVideoDescription}
                  />
                )}
              </View>
            </View>
          )}

          {/* 攀岩區域 */}
          {crag.areas && crag.areas.length > 0 && (
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
                    routesCount={areaRouteCountMap.get(area.id) || area.routes}
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
              <View style={styles.sectionHeader}>
                <Text variant="body" fontWeight="600" style={styles.sectionTitleOrange}>
                  資料來源
                </Text>
                <View style={styles.sectionDivider} />
              </View>
              <DataSourceSection data={crag.metadata} />
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
          sectors={sectors}
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
