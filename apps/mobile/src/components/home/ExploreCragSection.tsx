/**
 * ExploreCragSection 組件
 *
 * 探索岩場區，對應 apps/web/src/components/home/explore-crag-section.tsx
 * 串接 GET /crags API 取得真實資料
 * 串接 GET /crags/routes/featured API 取得熱門路線
 */

import { BORDER_RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { ChevronRight, MapPin, Mountain } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeInRight } from 'react-native-reanimated'
import { XStack, YStack } from 'tamagui'
import { FadeIn, SlideUp } from '@/components/animation'
import { Button, Skeleton, Text } from '@/components/ui'
import { apiClient } from '@/lib/api'

const CARD_WIDTH = 200
const ROUTE_CARD_WIDTH = 220

// 後端 API 回傳的 Crag 類型
interface ApiCrag {
  id: string
  name: string
  slug: string
  region: string
  location: string
  rock_type: string
  climbing_types: string[]
  route_count: number
  difficulty_range: string
  best_seasons: string[]
  cover_image: string | null
  images: string[]
}

// UI 顯示用的岩場資料
interface CragDisplayItem {
  id: string
  name: string
  location: string
  type: string
  routes: number
  difficulty: string
  coverImage?: string
}

// 熱門路線 API 回傳類型（後端已轉為 camelCase）
interface FeaturedRouteItem {
  id: string
  name: string
  nameEn: string
  grade: string
  type: string
  length?: string
  boltCount: number
  cragId: string
  cragName: string
  areaId?: string
  areaName?: string
  youtubeThumbnail?: string
  ascentCount: number
  storyCount: number
}

function adaptApiCrag(crag: ApiCrag): CragDisplayItem {
  return {
    id: crag.id,
    name: crag.name,
    location: crag.location || crag.region || '',
    type: crag.rock_type || '',
    routes: crag.route_count,
    difficulty: crag.difficulty_range || '',
    coverImage: crag.cover_image || crag.images?.[0] || undefined,
  }
}

function CragCard({ crag, index }: { crag: CragDisplayItem; index: number }) {
  const router = useRouter()

  const handlePress = () => {
    router.push(`/crag/${crag.id}`)
  }

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(400)}
      style={styles.cardContainer}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        {/* 岩場封面 */}
        <View style={styles.coverContainer}>
          {crag.coverImage ? (
            <Image source={{ uri: crag.coverImage }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <Mountain size={32} color={SEMANTIC_COLORS.textMuted} />
            </View>
          )}
          {/* 岩石類型標籤 */}
          {crag.type ? (
            <View style={styles.typeLabel}>
              <Text style={styles.typeLabelText}>{crag.type}</Text>
            </View>
          ) : null}
        </View>

        {/* 岩場資訊 */}
        <View style={styles.cardContent}>
          <Text style={styles.cragName}>{crag.name}</Text>

          <XStack alignItems="center" gap={SPACING[1.5]} marginTop={SPACING[1.5]}>
            <MapPin size={14} color={SEMANTIC_COLORS.textSubtle} />
            <Text style={styles.locationText}>{crag.location}</Text>
          </XStack>

          <XStack alignItems="center" gap={SPACING[3]} marginTop={SPACING[2]}>
            <XStack alignItems="center" gap={SPACING[1]}>
              <Mountain size={14} color={SEMANTIC_COLORS.textSubtle} />
              <Text style={styles.infoText}>{crag.routes} 條路線</Text>
            </XStack>
            {crag.difficulty ? <Text style={styles.difficultyText}>{crag.difficulty}</Text> : null}
          </XStack>
        </View>
      </Pressable>
    </Animated.View>
  )
}

function CragSkeleton() {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <Skeleton style={styles.coverSkeleton} />
        <View style={styles.cardContent}>
          <Skeleton style={{ width: 120, height: 20 }} />
          <Skeleton style={{ width: 100, height: 14, marginTop: SPACING[1.5] }} />
          <Skeleton style={{ width: 150, height: 14, marginTop: SPACING[2] }} />
        </View>
      </View>
    </View>
  )
}

// 路線卡片組件
function RouteCard({ route, index }: { route: FeaturedRouteItem; index: number }) {
  const router = useRouter()

  const handlePress = () => {
    router.push(`/crag/${route.cragId}/route/${route.id}`)
  }

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(400)}
      style={styles.routeCardContainer}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        {/* YouTube 縮圖 */}
        {route.youtubeThumbnail ? (
          <View style={styles.routeThumbnailContainer}>
            <Image
              source={{ uri: route.youtubeThumbnail }}
              style={styles.routeThumbnailImage}
              resizeMode="cover"
            />
            {/* 難度標籤（覆蓋在圖片左下角） */}
            <View style={styles.gradeBadgeOverlay}>
              <Text style={styles.gradeBadgeText}>{route.grade}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.routeThumbnailContainer, styles.routeThumbnailPlaceholder]}>
            <Mountain size={28} color={SEMANTIC_COLORS.textMuted} />
            {/* 難度標籤 */}
            <View style={styles.gradeBadgeOverlay}>
              <Text style={styles.gradeBadgeText}>{route.grade}</Text>
            </View>
          </View>
        )}

        {/* 路線資訊 */}
        <View style={styles.routeCardContent}>
          {/* 路線名稱 */}
          <Text style={styles.routeName} numberOfLines={1}>
            {route.name}
          </Text>

          {/* 英文名稱 */}
          {route.nameEn ? (
            <Text style={styles.routeNameEn} numberOfLines={1}>
              {route.nameEn}
            </Text>
          ) : null}

          {/* 所屬岩場・區域 */}
          <XStack alignItems="center" gap={SPACING[1.5]} marginTop={SPACING[2]}>
            <MapPin size={14} color={SEMANTIC_COLORS.textSubtle} />
            <Text style={styles.routeLocationText} numberOfLines={1}>
              {route.cragName}
              {route.areaName ? `・${route.areaName}` : ''}
            </Text>
          </XStack>

          {/* 標籤區 */}
          <XStack alignItems="center" gap={SPACING[1.5]} marginTop={SPACING[2.5]}>
            {/* 類型標籤 */}
            <View style={styles.routeTagBadge}>
              <Text style={styles.routeTagText}>{route.type}</Text>
            </View>
            {/* 長度標籤 */}
            {route.length ? (
              <View style={styles.routeTagBadge}>
                <Text style={styles.routeTagText}>{route.length}</Text>
              </View>
            ) : null}
          </XStack>
        </View>
      </Pressable>
    </Animated.View>
  )
}

function RouteSkeleton() {
  return (
    <View style={styles.routeCardContainer}>
      <View style={styles.card}>
        <Skeleton style={styles.routeThumbnailSkeleton} />
        <View style={styles.routeCardContent}>
          <Skeleton style={{ width: 140, height: 18 }} />
          <Skeleton style={{ width: 100, height: 12, marginTop: SPACING[1] }} />
          <Skeleton style={{ width: 120, height: 14, marginTop: SPACING[2] }} />
          <Skeleton style={{ width: 80, height: 22, marginTop: SPACING[2.5], borderRadius: 11 }} />
        </View>
      </View>
    </View>
  )
}

// 子標題列（含「查看全部」連結）
function SubsectionHeader({ title, onViewAll }: { title: string; onViewAll: () => void }) {
  return (
    <View style={styles.subsectionHeader}>
      <Text style={styles.subsectionTitle}>{title}</Text>
      <Pressable
        onPress={onViewAll}
        style={({ pressed }) => [styles.viewAllButton, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.viewAllText}>查看全部</Text>
        <ChevronRight size={16} color={SEMANTIC_COLORS.textSubtle} />
      </Pressable>
    </View>
  )
}

export function ExploreCragSection() {
  const router = useRouter()
  const [crags, setCrags] = useState<CragDisplayItem[]>([])
  const [featuredRoutes, setFeaturedRoutes] = useState<FeaturedRouteItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    async function fetchData() {
      try {
        // 並行取得岩場和熱門路線
        const [cragsResponse, routesResponse] = await Promise.all([
          apiClient.get<{
            success: boolean
            data: ApiCrag[]
            pagination: { page: number; limit: number; total: number; total_pages: number }
          }>('/crags', { params: { limit: 5 } }),
          apiClient.get<{
            success: boolean
            data: FeaturedRouteItem[]
          }>('/crags/routes/featured', { params: { limit: 8 } }),
        ])

        if (cragsResponse.data?.success && cragsResponse.data.data) {
          setCrags(cragsResponse.data.data.map(adaptApiCrag))
        }

        if (routesResponse.data?.success && routesResponse.data.data) {
          setFeaturedRoutes(routesResponse.data.data)
        }
      } catch (error) {
        console.error('[ExploreCragSection] Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleViewAllCrags = () => {
    router.push('/crag')
  }

  const handleViewAllRoutes = () => {
    router.push('/crag')
  }

  return (
    <FadeIn>
      <View style={styles.container}>
        {/* 標題區 */}
        <View style={styles.header}>
          <YStack>
            <Text style={styles.title}>查路線</Text>
            <Text style={styles.subtitle}>探索台灣岩場，找到你的下一條路線</Text>
          </YStack>
        </View>

        {/* 熱門岩場小標題 */}
        <SubsectionHeader title="熱門岩場" onViewAll={handleViewAllCrags} />

        {/* 岩場列表 - 橫向滾動 */}
        <FlatList<number | CragDisplayItem>
          data={isLoading ? [1, 2, 3] : crags}
          keyExtractor={(item) => (typeof item === 'number' ? `skeleton-${item}` : item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) =>
            typeof item === 'number' ? <CragSkeleton /> : <CragCard crag={item} index={index} />
          }
          ItemSeparatorComponent={() => <View style={{ width: SPACING[4] }} />}
        />

        {/* 熱門路線區塊 */}
        {(isLoading || featuredRoutes.length > 0) && (
          <View style={styles.routesSection}>
            <SubsectionHeader title="熱門路線" onViewAll={handleViewAllRoutes} />

            <FlatList<number | FeaturedRouteItem>
              data={isLoading ? [1, 2, 3] : featuredRoutes}
              keyExtractor={(item) =>
                typeof item === 'number' ? `route-skeleton-${item}` : `${item.cragId}-${item.id}`
              }
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item, index }) =>
                typeof item === 'number' ? (
                  <RouteSkeleton />
                ) : (
                  <RouteCard route={item} index={index} />
                )
              }
              ItemSeparatorComponent={() => <View style={{ width: SPACING[4] }} />}
            />
          </View>
        )}

        {/* 查看全部按鈕 */}
        <SlideUp delay={200}>
          <View style={styles.ctaContainer}>
            <Button variant="outline" onPress={handleViewAllCrags}>
              探索更多岩場
            </Button>
          </View>
        </SlideUp>
      </View>
    </FadeIn>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING[8],
    borderTopWidth: 1,
    borderTopColor: WB_COLORS[30],
  },
  header: {
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[6],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 38,
    color: SEMANTIC_COLORS.textMain,
  },
  subtitle: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textSubtle,
    marginTop: SPACING[1],
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[4],
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textMain,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[0.5],
  },
  viewAllText: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textSubtle,
  },
  listContent: {
    paddingHorizontal: SPACING[4],
  },
  cardContainer: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: WB_COLORS[0],
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: WB_COLORS[100],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  coverContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
  },
  coverImage: {
    flex: 1,
  },
  coverPlaceholder: {
    backgroundColor: WB_COLORS[20],
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    position: 'absolute',
    top: SPACING[2],
    left: SPACING[2],
    backgroundColor: 'rgba(27, 26, 26, 0.8)',
    paddingHorizontal: SPACING[1.5],
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  typeLabelText: {
    fontSize: 10,
    fontWeight: '500',
    color: WB_COLORS[0],
  },
  cardContent: {
    padding: SPACING[3],
  },
  cragName: {
    fontSize: 16,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textMain,
  },
  locationText: {
    fontSize: 12,
    color: SEMANTIC_COLORS.textSubtle,
  },
  infoText: {
    fontSize: 12,
    color: SEMANTIC_COLORS.textSubtle,
  },
  difficultyText: {
    fontSize: 12,
    color: SEMANTIC_COLORS.textMuted,
  },
  coverSkeleton: {
    aspectRatio: 16 / 9,
  },
  ctaContainer: {
    marginTop: SPACING[8],
    alignItems: 'center',
  },

  // 熱門路線區塊樣式
  routesSection: {
    marginTop: SPACING[10],
  },
  routeCardContainer: {
    width: ROUTE_CARD_WIDTH,
  },
  routeThumbnailContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
  },
  routeThumbnailImage: {
    flex: 1,
  },
  routeThumbnailPlaceholder: {
    backgroundColor: WB_COLORS[20],
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBadgeOverlay: {
    position: 'absolute',
    bottom: SPACING[2],
    left: SPACING[2],
    backgroundColor: '#FFE70C',
    paddingHorizontal: SPACING[2.5],
    paddingVertical: SPACING[1],
    borderRadius: 20,
    shadowColor: WB_COLORS[100],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  gradeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B1A1A',
  },
  routeCardContent: {
    padding: SPACING[4],
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: SEMANTIC_COLORS.textMain,
  },
  routeNameEn: {
    fontSize: 12,
    color: SEMANTIC_COLORS.textMuted,
    marginTop: SPACING[1],
  },
  routeLocationText: {
    fontSize: 12,
    color: SEMANTIC_COLORS.textSubtle,
    flex: 1,
  },
  routeTagBadge: {
    backgroundColor: WB_COLORS[10],
    paddingHorizontal: SPACING[2.5],
    paddingVertical: SPACING[1],
    borderRadius: 20,
  },
  routeTagText: {
    fontSize: 12,
    color: SEMANTIC_COLORS.textSubtle,
  },
  routeThumbnailSkeleton: {
    aspectRatio: 16 / 9,
  },
})

export default ExploreCragSection
