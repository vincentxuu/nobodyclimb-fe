/**
 * 位置詳情頁面
 *
 * 對應 apps/web/src/app/biography/explore/location/[name]/page.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import {
  ChevronLeft,
  MapPin,
  Users,
  Target,
  CheckCircle2,
  Mountain,
} from 'lucide-react-native'

import { Text, Card, Avatar, IconButton, Breadcrumb } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

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

interface LocationDetail {
  location: string
  country: string
  description?: string
  visitors: Visitor[]
  bucket_items: BucketListItem[]
  stats: {
    total_visitors: number
    total_goals: number
    completed_goals: number
  }
}

export default function LocationDetailScreen() {
  const router = useRouter()
  const { name } = useLocalSearchParams<{ name: string }>()
  const decodedName = name ? decodeURIComponent(name) : ''

  const [location, setLocation] = useState<LocationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 載入資料
  const loadLocationDetail = useCallback(async () => {
    if (!decodedName) return

    setLoading(true)
    setError(null)

    try {
      // TODO: 整合 API
      await new Promise((resolve) => setTimeout(resolve, 500))

      // 模擬資料
      setLocation({
        location: decodedName,
        country: '台灣',
        description: `${decodedName}是台灣著名的攀岩地點，擁有豐富的路線選擇，吸引許多攀岩者前來挑戰。`,
        visitors: [
          { id: '1', name: '攀岩小明', avatar_url: null, slug: 'xiaoming', climbing_years: 5 },
          { id: '2', name: '抱石達人', avatar_url: null, slug: 'boulderer', climbing_years: 3 },
          { id: '3', name: '阿強', avatar_url: null, slug: 'aqiang', climbing_years: 8 },
          { id: '4', name: '小美', avatar_url: null, slug: 'xiaomei', climbing_years: 2 },
          { id: '5', name: '大偉', avatar_url: null, slug: 'dawei', climbing_years: 6 },
        ],
        bucket_items: [
          {
            id: '1',
            title: `完攀${decodedName}經典路線`,
            category: 'outdoor_route',
            target_grade: '5.10a',
            user_count: 15,
            completed_count: 5,
            author_name: '攀岩小明',
            author_slug: 'xiaoming',
          },
          {
            id: '2',
            title: `${decodedName}連續攀登一週`,
            category: 'adventure',
            user_count: 8,
            completed_count: 2,
            author_name: '阿強',
            author_slug: 'aqiang',
          },
        ],
        stats: {
          total_visitors: 25,
          total_goals: 15,
          completed_goals: 7,
        },
      })
    } catch (err) {
      console.error('Failed to load location detail:', err)
      setError('無法載入地點資料')
    } finally {
      setLoading(false)
    }
  }, [decodedName])

  useEffect(() => {
    loadLocationDetail()
  }, [loadLocationDetail])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadLocationDetail()
    setRefreshing(false)
  }, [loadLocationDetail])

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

  if (error || !location) {
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
          <Text color="error">{error || '找不到此地點'}</Text>
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
          {location.location}
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
              { label: location.location },
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
                {location.location}
              </Text>
              <Text variant="body" color="textSubtle">
                {location.country}
              </Text>
            </View>
          </View>

          {location.description && (
            <Text variant="body" color="textSubtle" style={styles.description}>
              {location.description}
            </Text>
          )}

          {/* 統計數據 */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Users size={20} color={SEMANTIC_COLORS.textMuted} />
              <Text variant="h4" fontWeight="600">
                {location.stats.total_visitors}
              </Text>
              <Text variant="small" color="textMuted">
                人去過
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Target size={20} color={SEMANTIC_COLORS.textMuted} />
              <Text variant="h4" fontWeight="600">
                {location.stats.total_goals}
              </Text>
              <Text variant="small" color="textMuted">
                個目標
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <CheckCircle2 size={20} color="#16A34A" />
              <Text variant="h4" fontWeight="600">
                {location.stats.completed_goals}
              </Text>
              <Text variant="small" color="textMuted">
                已完成
              </Text>
            </View>
          </View>
        </Card>

        {/* 去過的人 */}
        <View style={styles.section}>
          <Text variant="h4" fontWeight="600" style={styles.sectionTitle}>
            去過的攀岩者 ({location.visitors.length})
          </Text>
          <View style={styles.visitorGrid}>
            {location.visitors.map((visitor, index) => (
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

        {/* 相關目標 */}
        {location.bucket_items.length > 0 && (
          <View style={styles.section}>
            <Text variant="h4" fontWeight="600" style={styles.sectionTitle}>
              相關目標
            </Text>
            {location.bucket_items.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 50).duration(400)}
              >
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
                  <Pressable
                    style={styles.authorLink}
                    onPress={() => router.push(`/biography/${item.author_slug}` as any)}
                  >
                    <Text variant="small" color="textMuted">
                      由 {item.author_name} 設立
                    </Text>
                  </Pressable>
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
  description: {
    marginBottom: SPACING.md,
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
