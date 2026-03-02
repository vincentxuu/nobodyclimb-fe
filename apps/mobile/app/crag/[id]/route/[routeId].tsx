/**
 * 路線詳情頁面
 *
 * 對應 apps/web/src/app/crag/[id]/route/[routeId]/RouteDetailClient.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Share,
  Linking,
  Pressable,
  Dimensions,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  MapPin,
  Ruler,
  Shield,
  User,
  Youtube,
  Instagram,
  ExternalLink,
  Play,
} from 'lucide-react-native'

import { Text, IconButton, Button, Card } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'
import type { RouteDetailData } from '@/lib/crag-data'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// 模擬資料
const MOCK_ROUTE_DETAIL: RouteDetailData = {
  route: {
    id: 'r1',
    name: '小乖',
    englishName: 'Little Good',
    grade: '5.8',
    length: '15m',
    type: 'Sport',
    typeEn: 'Sport',
    firstAscent: '張三',
    firstAscentDate: '1998',
    description: '這是一條經典的入門路線，適合初學者練習基本動作。岩質良好，保護完整。',
    protection: '8 個 bolts + 雙固定點',
    tips: '注意第三個 bolt 後的小平台，可以稍作休息。crux 在頂部的小屋簷處。',
    boltCount: 8,
    safetyRating: 'G',
    popularity: 85,
    views: 1234,
    images: [],
    videos: [],
    youtubeVideos: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    instagramPosts: [],
  },
  crag: {
    id: 'longdong',
    name: '龍洞',
    nameEn: 'Long Dong',
    slug: 'longdong',
    location: '新北市貢寮區龍洞灣',
  },
  area: {
    id: 'school-gate',
    name: '校門口',
    nameEn: 'School Gate',
  },
  relatedRoutes: [
    { id: 'r2', name: '大乖', grade: '5.9', type: 'Sport' },
    { id: 'r3', name: '黃色乖', grade: '5.10a', type: 'Sport' },
    { id: 'r4', name: '蟹老闆', grade: '5.10b', type: 'Sport' },
  ],
}

// 將 YouTube URL 轉換為縮圖 URL
function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/)
  if (match) {
    return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
  }
  return null
}

// 將 YouTube URL 轉換為嵌入 URL
function getYoutubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

export default function RouteDetailScreen() {
  const router = useRouter()
  const { id, routeId } = useLocalSearchParams<{ id: string; routeId: string }>()

  const [routeData, setRouteData] = useState<RouteDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  // 載入資料
  const loadRouteData = useCallback(async () => {
    if (!id || !routeId) return

    setIsLoading(true)
    try {
      // MVP 階段使用模擬資料
      await new Promise((resolve) => setTimeout(resolve, 300))
      setRouteData({
        ...MOCK_ROUTE_DETAIL,
        route: {
          ...MOCK_ROUTE_DETAIL.route,
          id: routeId,
        },
        crag: {
          ...MOCK_ROUTE_DETAIL.crag,
          id: id,
        },
      })
    } catch (err) {
      console.error('Failed to load route:', err)
    } finally {
      setIsLoading(false)
    }
  }, [id, routeId])

  useEffect(() => {
    loadRouteData()
  }, [loadRouteData])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadRouteData()
    setRefreshing(false)
  }, [loadRouteData])

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

  const handleRelatedRoutePress = (relatedRouteId: string) => {
    router.push(`/crag/${id}/route/${relatedRouteId}` as any)
  }

  const handleYoutubePress = (url: string) => {
    Linking.openURL(url)
  }

  const handleInstagramPress = (url: string) => {
    Linking.openURL(url)
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
  const hasYoutubeVideos = route.youtubeVideos && route.youtubeVideos.length > 0
  const hasInstagramPosts = route.instagramPosts && route.instagramPosts.length > 0

  return (
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
                {route.typeEn}
              </Text>
            </View>
          </View>
        </View>

        {/* 照片輪播 */}
        {hasImages && (
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
                  {route.images.map((_, index) => (
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
        )}

        {/* 基本資訊卡片 */}
        {(route.length || route.boltCount > 0 || route.firstAscent) && (
          <View style={styles.infoCards}>
            {route.length && (
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
            )}
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

        {/* YouTube 影片 */}
        {hasYoutubeVideos && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBar} />
              <Youtube size={18} color="#FF0000" />
              <Text variant="body" fontWeight="600">
                YouTube 影片
              </Text>
            </View>
            <View style={styles.mediaGrid}>
              {route.youtubeVideos.map((url, index) => {
                const thumbnail = getYoutubeThumbnail(url)
                return (
                  <Pressable
                    key={index}
                    style={styles.mediaCard}
                    onPress={() => handleYoutubePress(url)}
                  >
                    {thumbnail ? (
                      <Image
                        source={{ uri: thumbnail }}
                        style={styles.mediaThumbnail}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.mediaThumbnail, styles.mediaPlaceholder]}>
                        <Youtube size={32} color="#FF0000" />
                      </View>
                    )}
                    <View style={styles.mediaPlayIcon}>
                      <Play size={24} color="#FFFFFF" />
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </View>
        )}

        {/* Instagram 貼文 */}
        {hasInstagramPosts && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBar} />
              <Instagram size={18} color="#E4405F" />
              <Text variant="body" fontWeight="600">
                Instagram 貼文
              </Text>
            </View>
            <View style={styles.mediaGrid}>
              {route.instagramPosts.map((url, index) => (
                <Pressable
                  key={index}
                  style={styles.mediaCard}
                  onPress={() => handleInstagramPress(url)}
                >
                  <View style={[styles.mediaThumbnail, styles.mediaPlaceholder]}>
                    <Instagram size={32} color="#E4405F" />
                  </View>
                  <View style={styles.mediaLinkIcon}>
                    <ExternalLink size={16} color="#FFFFFF" />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

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
  photoSection: {
    position: 'relative',
    aspectRatio: 16 / 9,
    marginBottom: SPACING.md,
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
})
