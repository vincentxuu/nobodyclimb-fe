/**
 * 位置詳情頁面
 *
 * 對應 apps/web/src/app/biography/explore/location/[name]/page.tsx
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CheckCircle2, ChevronLeft, MapPin, Mountain, Target, Users } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Avatar, Breadcrumb, Card, IconButton, Text } from '@/components/ui'
import { apiClient } from '@/lib/api'

// 類型定義
interface Visitor {
  id: string
  name: string
  avatar_url: string | null
  slug: string
  climbing_years?: number
}

interface BucketListItem {
  id: string
  title: string
  category: string
  target_grade?: string
  user_count: number
  completed_count: number
  author_name: string
  author_slug: string
}

// API 回傳的人生清單項目（欄位可能與前端 BucketListItem 不同）
interface ApiBucketItem {
  id: string
  title: string
  category?: string
  target_grade?: string
  user_count?: number
  inspired_count?: number
  completed_count?: number
  author_name?: string
  biography_name?: string
  author_slug?: string
  biography_slug?: string
}

interface LocationExploreDetail {
  location: string
  country: string
  visitor_count: number
  visitors: Visitor[]
}

interface BucketListLocationDetail {
  location: string
  stats: {
    total_items: number
    total_users: number
    completed_count: number
  }
  items: ApiBucketItem[]
  visitors: Array<{
    id: string
    name: string
    avatar_url: string | null
    slug: string
    completed_at: string
  }>
}

export default function LocationDetailScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { name } = useLocalSearchParams<{ name: string }>()
  const decodedName = name ? decodeURIComponent(name) : ''

  // 取得攀岩足跡地點詳情
  const {
    data: locationData,
    isLoading: locationLoading,
    error: locationError,
  } = useQuery<LocationExploreDetail>({
    queryKey: ['climbing-location-detail', decodedName],
    queryFn: async () => {
      const response = await apiClient.get(
        `/climbing-locations/explore/${encodeURIComponent(decodedName)}`
      )
      return response.data?.data ?? response.data
    },
    enabled: !!decodedName,
  })

  // 取得人生清單地點詳情
  const { data: bucketData } = useQuery<BucketListLocationDetail>({
    queryKey: ['bucket-list-location-detail', decodedName],
    queryFn: async () => {
      const response = await apiClient.get(
        `/bucket-list/explore/locations/${encodeURIComponent(decodedName)}`,
        { params: { limit: 10 } }
      )
      return response.data?.data ?? response.data
    },
    enabled: !!decodedName,
  })

  const loading = locationLoading
  const error = locationError

  // 合併統計資料
  const stats = {
    total_visitors: locationData?.visitor_count ?? locationData?.visitors?.length ?? 0,
    total_goals: bucketData?.stats?.total_items ?? 0,
    completed_goals: bucketData?.stats?.completed_count ?? 0,
  }

  const visitors = locationData?.visitors ?? []
  const bucketItems: BucketListItem[] = (bucketData?.items ?? []).map((item: ApiBucketItem) => ({
    id: item.id,
    title: item.title,
    category: item.category ?? '',
    target_grade: item.target_grade,
    user_count: item.user_count ?? item.inspired_count ?? 0,
    completed_count: item.completed_count ?? 0,
    author_name: item.author_name ?? item.biography_name ?? '',
    author_slug: item.author_slug ?? item.biography_slug ?? '',
  }))

  const [refreshing, setRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({
      queryKey: ['climbing-location-detail', decodedName],
    })
    await queryClient.invalidateQueries({
      queryKey: ['bucket-list-location-detail', decodedName],
    })
    setRefreshing(false)
  }, [queryClient, decodedName])

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={() => router.back()}
            variant="ghost"
          />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !locationData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={() => router.back()}
            variant="ghost"
          />
        </View>
        <View style={styles.errorContainer}>
          <Text color="textSubtle">{error instanceof Error ? error.message : '找不到此地點'}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 導航欄 */}
      <View style={styles.navbar}>
        <IconButton
          icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
          onPress={() => router.back()}
          variant="ghost"
        />
        <Text variant="h4" fontWeight="600" numberOfLines={1} style={styles.navTitle}>
          {locationData.location}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 麵包屑 */}
        <View style={styles.breadcrumbContainer}>
          <Breadcrumb
            items={[
              { label: '探索', href: '/biography/explore' },
              { label: '地點', href: '/biography/explore/locations' },
              { label: locationData.location },
            ]}
          />
        </View>

        {/* 地點資訊卡 */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.locationIcon}>
              <MapPin size={32} color="#3B82F6" />
            </View>
            <View style={styles.locationInfo}>
              <Text variant="h3" fontWeight="700">
                {locationData.location}
              </Text>
              <Text variant="body" color="textSubtle">
                {locationData.country}
              </Text>
            </View>
          </View>

          {/* 統計數據 */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Users size={20} color={SEMANTIC_COLORS.textMuted} />
              <Text variant="h4" fontWeight="600">
                {stats.total_visitors}
              </Text>
              <Text variant="small" color="textMuted">
                人去過
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Target size={20} color={SEMANTIC_COLORS.textMuted} />
              <Text variant="h4" fontWeight="600">
                {stats.total_goals}
              </Text>
              <Text variant="small" color="textMuted">
                個目標
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <CheckCircle2 size={20} color="#16A34A" />
              <Text variant="h4" fontWeight="600">
                {stats.completed_goals}
              </Text>
              <Text variant="small" color="textMuted">
                已完成
              </Text>
            </View>
          </View>
        </Card>

        {/* 去過的人 */}
        {visitors.length > 0 && (
          <View style={styles.section}>
            <Text variant="h4" fontWeight="600" style={styles.sectionTitle}>
              去過的攀岩者 ({visitors.length})
            </Text>
            <View style={styles.visitorGrid}>
              {visitors.map((visitor, index) => (
                <Animated.View
                  key={visitor.id}
                  entering={FadeInDown.delay(index * 50).duration(400)}
                >
                  <Pressable
                    style={styles.visitorCard}
                    onPress={() => router.push(`/biography/${visitor.slug}` as any)}
                  >
                    <Avatar
                      size="md"
                      source={visitor.avatar_url ? { uri: visitor.avatar_url } : undefined}
                    />
                    <Text variant="small" fontWeight="500" numberOfLines={1}>
                      {visitor.name}
                    </Text>
                    {visitor.climbing_years && (
                      <Text variant="small" color="textMuted">
                        {visitor.climbing_years} 年
                      </Text>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {/* 相關目標 */}
        {bucketItems.length > 0 && (
          <View style={styles.section}>
            <Text variant="h4" fontWeight="600" style={styles.sectionTitle}>
              相關目標
            </Text>
            {bucketItems.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(index * 50).duration(400)}>
                <Card style={styles.bucketCard}>
                  <View style={styles.bucketHeader}>
                    <Mountain size={16} color={SEMANTIC_COLORS.textMuted} />
                    <Text variant="body" fontWeight="500" style={styles.bucketTitle}>
                      {item.title}
                    </Text>
                  </View>
                  {item.target_grade && (
                    <Text variant="small" color="textMuted" style={styles.bucketGrade}>
                      {item.target_grade}
                    </Text>
                  )}
                  <View style={styles.bucketStats}>
                    <Text variant="small" color="textSubtle">
                      {item.user_count} 人挑戰中 · {item.completed_count} 人已完成
                    </Text>
                  </View>
                  {item.author_name && (
                    <Pressable
                      style={styles.authorLink}
                      onPress={() => router.push(`/biography/${item.author_slug}` as any)}
                    >
                      <Text variant="small" color="textMuted">
                        由 {item.author_name} 設立
                      </Text>
                    </Pressable>
                  )}
                </Card>
              </Animated.View>
            ))}
          </View>
        )}

        {/* 底部留白 */}
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
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
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
  breadcrumbContainer: {
    marginBottom: SPACING.md,
  },
  infoCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  locationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F0F0F0',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  visitorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  visitorCard: {
    alignItems: 'center',
    width: 80,
    gap: 4,
  },
  bucketCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  bucketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  bucketTitle: {
    flex: 1,
  },
  bucketGrade: {
    marginBottom: SPACING.xs,
  },
  bucketStats: {
    marginBottom: SPACING.xs,
  },
  authorLink: {
    alignSelf: 'flex-start',
  },
  bottomPadding: {
    height: SPACING.xxl,
  },
})
