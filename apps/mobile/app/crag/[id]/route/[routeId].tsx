/**
 * 路線詳情頁面
 *
 * 對應 apps/web/src/app/crag/[id]/route/[routeId]/RouteDetailClient.tsx
 */

import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft, ChevronRight, MapPin, Ruler, Share2, Shield, User } from 'lucide-react-native'
import { useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteInstagramSection, RoutePhotosSection, RouteYouTubeSection } from '@/components/crag'
import { RouteAscentsSection } from '@/components/crag/RouteAscentsSection'
import { RouteStoriesSection } from '@/components/crag/RouteStoriesSection'
import { IconButton, Text } from '@/components/ui'
import { useRouteDetail } from '@/lib/hooks/useCrags'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function RouteDetailScreen() {
  const router = useRouter()
  const {
    id,
    routeId,
    q,
    area: areaFilter,
    sector,
    grade,
    type,
  } = useLocalSearchParams<{
    id: string
    routeId: string
    q?: string
    area?: string
    sector?: string
    grade?: string
    type?: string
  }>()

  const { data: routeData, isLoading, refetch } = useRouteDetail(id, routeId)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handleBack = () => {
    router.back()
  }

  const handleShare = async () => {
    if (!routeData) return
    try {
      await Share.share({
        title: `${routeData.route.name} - ${routeData.crag.name}`,
        message: `來看看 ${routeData.route.name} (${routeData.route.grade}) 路線！\nhttps://nobodyclimb.cc/crag/${routeData.crag.id}/route/${routeData.route.id}`,
      })
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const handleAreaPress = () => {
    if (!routeData?.area) return
    router.push(`/crag/${id}/area/${routeData.area.id}` as any)
  }

  const getRouteFilterQueryString = () => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (areaFilter) params.set('area', areaFilter)
    if (sector) params.set('sector', sector)
    if (grade) params.set('grade', grade)
    if (type) params.set('type', type)
    const queryString = params.toString()
    return queryString ? `?${queryString}` : ''
  }

  const handleRelatedRoutePress = (relatedRouteId: string) => {
    router.push(`/crag/${id}/route/${relatedRouteId}${getRouteFilterQueryString()}` as any)
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

  if (!routeData) {
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
          <Text color="textSubtle">找不到此路線</Text>
        </View>
      </SafeAreaView>
    )
  }

  const { route, crag, area, relatedRoutes } = routeData
  const hasImages = route.images && route.images.length > 0

  return (
    <>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {/* 麵包屑 */}
          <View style={styles.breadcrumb}>
            <Text variant="small" color="textMuted">
              {crag.name}
            </Text>
            <ChevronRight size={14} color={SEMANTIC_COLORS.textMuted} />
            {area && (
              <>
                <Pressable onPress={handleAreaPress}>
                  <Text variant="small" color="textSubtle">
                    {area.name}
                  </Text>
                </Pressable>
                <ChevronRight size={14} color={SEMANTIC_COLORS.textMuted} />
              </>
            )}
            <Text variant="small" fontWeight="500">
              {route.name}
            </Text>
          </View>

          {/* 標題區 */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <View style={styles.titleContent}>
                <Text variant="h2" fontWeight="700">
                  {route.name}
                </Text>
                {route.englishName && route.englishName !== route.name && (
                  <Text variant="body" color="textMuted" style={styles.englishName}>
                    {route.englishName}
                  </Text>
                )}
              </View>
              {area && (
                <Pressable onPress={handleAreaPress} style={styles.areaTag}>
                  <MapPin size={14} color={SEMANTIC_COLORS.textMuted} />
                  <Text variant="small" color="textMuted">
                    {area.name}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* 標籤 */}
            <View style={styles.tags}>
              <View style={styles.gradeTag}>
                <Text variant="body" fontWeight="600">
                  {route.grade}
                </Text>
              </View>
              <View style={styles.typeTag}>
                <Text variant="small" color="textSubtle">
                  {route.typeEn || route.type}
                </Text>
              </View>
            </View>
          </View>

          {/* 照片輪播 */}
          {hasImages && (
            <View style={styles.photoGallery}>
              <View style={styles.photoSection}>
                <Image
                  source={{ uri: route.images[currentPhotoIndex] }}
                  style={styles.mainPhoto}
                  contentFit="cover"
                />
                {route.images.length > 1 && (
                  <>
                    <Pressable
                      style={[styles.photoNav, styles.photoNavLeft]}
                      onPress={() =>
                        setCurrentPhotoIndex((prev) =>
                          prev === 0 ? route.images.length - 1 : prev - 1
                        )
                      }
                    >
                      <ChevronLeft size={24} color="#FFFFFF" />
                    </Pressable>
                    <Pressable
                      style={[styles.photoNav, styles.photoNavRight]}
                      onPress={() =>
                        setCurrentPhotoIndex((prev) =>
                          prev === route.images.length - 1 ? 0 : prev + 1
                        )
                      }
                    >
                      <ChevronRight size={24} color="#FFFFFF" />
                    </Pressable>
                    <View style={styles.photoDots}>
                      {route.images.map((_: string, index: number) => (
                        <Pressable
                          key={index}
                          onPress={() => setCurrentPhotoIndex(index)}
                          style={[
                            styles.photoDot,
                            currentPhotoIndex === index && styles.photoDotActive,
                          ]}
                        />
                      ))}
                    </View>
                  </>
                )}
              </View>
              {route.images.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photoThumbnailStrip}
                >
                  {route.images.map((image: string, index: number) => (
                    <Pressable
                      key={`${image}-${index}`}
                      onPress={() => setCurrentPhotoIndex(index)}
                      style={[
                        styles.photoThumbnailButton,
                        currentPhotoIndex === index && styles.photoThumbnailButtonActive,
                      ]}
                    >
                      <Image
                        source={{ uri: image }}
                        style={styles.photoThumbnail}
                        contentFit="cover"
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* 基本資訊卡片 */}
          {(route.length || route.boltCount > 0 || route.firstAscent) && (
            <View style={styles.infoCards}>
              {route.length ? (
                <View style={styles.infoCard}>
                  <View style={styles.infoCardIcon}>
                    <Ruler size={16} color={SEMANTIC_COLORS.textMuted} />
                    <Text variant="small" color="textMuted">
                      長度
                    </Text>
                  </View>
                  <Text variant="body" fontWeight="600">
                    {route.length}
                  </Text>
                </View>
              ) : null}
              {route.boltCount > 0 && (
                <View style={styles.infoCard}>
                  <View style={styles.infoCardIcon}>
                    <Shield size={16} color={SEMANTIC_COLORS.textMuted} />
                    <Text variant="small" color="textMuted">
                      Bolts
                    </Text>
                  </View>
                  <Text variant="body" fontWeight="600">
                    {route.boltCount}
                  </Text>
                </View>
              )}
              {route.firstAscent && (
                <View style={styles.infoCard}>
                  <View style={styles.infoCardIcon}>
                    <User size={16} color={SEMANTIC_COLORS.textMuted} />
                    <Text variant="small" color="textMuted">
                      首攀者
                    </Text>
                  </View>
                  <Text variant="body" fontWeight="600">
                    {route.firstAscent}
                  </Text>
                  {route.firstAscentDate && (
                    <Text variant="caption" color="textMuted">
                      {route.firstAscentDate}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* 路線描述 */}
          {route.description && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionBar} />
                <Text variant="body" fontWeight="600">
                  路線描述
                </Text>
              </View>
              <Text variant="body" color="textSubtle" style={styles.sectionText}>
                {route.description}
              </Text>
            </View>
          )}

          {/* 保護裝備 */}
          {route.protection && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionBar} />
                <Text variant="body" fontWeight="600">
                  保護裝備
                </Text>
              </View>
              <Text variant="body" color="textSubtle" style={styles.sectionText}>
                {route.protection}
              </Text>
            </View>
          )}

          {/* 攀登攻略 */}
          {route.tips && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionBar} />
                <Text variant="body" fontWeight="600">
                  攀登攻略
                </Text>
              </View>
              <Text variant="body" color="textSubtle" style={styles.sectionText}>
                {route.tips}
              </Text>
            </View>
          )}

          {/* 路線照片 */}
          <RoutePhotosSection
            routeId={routeId}
            routeName={route.name}
            staticPhotos={route.images}
          />

          {/* 攀岩故事 */}
          <RouteStoriesSection
            cragId={id}
            routeId={routeId}
            routeName={route.name}
            routeGrade={route.grade}
          />

          {/* YouTube 影片 */}
          <RouteYouTubeSection
            routeId={routeId}
            routeName={route.name}
            staticVideos={[...(route.videos || []), ...(route.youtubeVideos || [])]}
          />

          {/* Instagram 貼文 */}
          <RouteInstagramSection
            routeId={routeId}
            routeName={route.name}
            staticPosts={route.instagramPosts || []}
          />

          {/* 攀爬記錄 */}
          <RouteAscentsSection routeId={routeId} routeName={route.name} routeGrade={route.grade} />

          {/* 相關路線 */}
          {relatedRoutes.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionBar} />
                <Text variant="body" fontWeight="600">
                  同區域其他路線
                </Text>
              </View>
              <View style={styles.relatedRoutes}>
                {relatedRoutes.map((relRoute) => (
                  <Pressable
                    key={relRoute.id}
                    style={styles.relatedRouteCard}
                    onPress={() => handleRelatedRoutePress(relRoute.id)}
                  >
                    <View style={styles.relatedRouteContent}>
                      <Text variant="body" fontWeight="500">
                        {relRoute.name}
                      </Text>
                      <Text variant="small" color="textMuted">
                        {relRoute.type}
                      </Text>
                    </View>
                    <View style={styles.relatedRouteGrade}>
                      <Text variant="small" fontWeight="600">
                        {relRoute.grade}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </>
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
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 4,
    flexWrap: 'wrap',
  },
  titleSection: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  titleContent: {
    flex: 1,
  },
  englishName: {
    marginTop: 2,
  },
  areaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  gradeTag: {
    backgroundColor: '#FFF9D6',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 16,
  },
  photoGallery: {
    marginBottom: SPACING.md,
  },
  photoSection: {
    position: 'relative',
    aspectRatio: 16 / 9,
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
  },
  photoNav: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoNavLeft: {
    left: SPACING.md,
  },
  photoNavRight: {
    right: SPACING.md,
  },
  photoDots: {
    position: 'absolute',
    bottom: SPACING.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  photoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  photoDotActive: {
    backgroundColor: '#FFE70C',
  },
  photoThumbnailStrip: {
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: 2,
  },
  photoThumbnailButton: {
    width: 96,
    height: 64,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  photoThumbnailButtonActive: {
    borderColor: '#FFE70C',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  infoCards: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  infoCard: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  infoCardIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  section: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionBar: {
    width: 4,
    height: 18,
    backgroundColor: '#FFE70C',
    borderRadius: 2,
  },
  sectionText: {
    lineHeight: 22,
  },
  videoList: {
    gap: SPACING.sm,
  },
  videoCard: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#F9F9F9',
  },
  videoThumbnailContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoInfo: {
    padding: SPACING.sm,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  mediaCard: {
    position: 'relative',
    width: (SCREEN_WIDTH - SPACING.md * 4 - SPACING.sm) / 2,
    aspectRatio: 16 / 9,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaLinkIcon: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedRoutes: {
    gap: SPACING.sm,
  },
  relatedRouteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#EBEAEA',
    borderRadius: RADIUS.md,
  },
  relatedRouteContent: {
    flex: 1,
  },
  relatedRouteGrade: {
    backgroundColor: '#FFF9D6',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bottomPadding: {
    height: SPACING.xxl,
  },

  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
})
