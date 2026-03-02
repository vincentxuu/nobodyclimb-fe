/**
 * LocationExplorer 組件
 *
 * 依地點探索，對應 apps/web/src/components/biography/explore/location-explorer.tsx
 */
import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import Animated, { FadeIn } from 'react-native-reanimated'
import { MapPin, Globe, Users, ChevronRight } from 'lucide-react-native'

import { Text, Card, Avatar } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 類型定義
interface LocationData {
  location: string
  country: string
  visitors: Array<{
    id: string
    name: string
    avatar_url: string | null
    slug: string
  }>
}

interface BucketListLocation {
  location: string
  item_count: number
  user_count: number
  completed_count: number
}

type TabType = 'taiwan' | 'overseas' | 'bucket'

export function LocationExplorer() {
  const router = useRouter()
  const [taiwanLocations, setTaiwanLocations] = useState<LocationData[]>([])
  const [overseasLocations, setOverseasLocations] = useState<LocationData[]>([])
  const [bucketListLocations, setBucketListLocations] = useState<BucketListLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('taiwan')

  useEffect(() => {
    const loadLocations = async () => {
      setLoading(true)
      setError(null)

      try {
        // TODO: 整合 bucketListService
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 模擬資料
        setTaiwanLocations([
          {
            location: '龍洞',
            country: '台灣',
            visitors: [
              { id: '1', name: '小明', avatar_url: null, slug: 'xiaoming' },
              { id: '2', name: '小華', avatar_url: null, slug: 'xiaohua' },
              { id: '3', name: '阿強', avatar_url: null, slug: 'aqiang' },
            ],
          },
          {
            location: '大砲岩',
            country: '台灣',
            visitors: [
              { id: '1', name: '小明', avatar_url: null, slug: 'xiaoming' },
            ],
          },
          {
            location: '關子嶺',
            country: '台灣',
            visitors: [
              { id: '2', name: '小華', avatar_url: null, slug: 'xiaohua' },
              { id: '3', name: '阿強', avatar_url: null, slug: 'aqiang' },
            ],
          },
          {
            location: '壽山',
            country: '台灣',
            visitors: [
              { id: '4', name: '小美', avatar_url: null, slug: 'xiaomei' },
            ],
          },
        ])

        setOverseasLocations([
          {
            location: 'Yosemite',
            country: '美國',
            visitors: [
              { id: '1', name: '小明', avatar_url: null, slug: 'xiaoming' },
            ],
          },
          {
            location: 'Fontainebleau',
            country: '法國',
            visitors: [
              { id: '2', name: '小華', avatar_url: null, slug: 'xiaohua' },
            ],
          },
        ])

        setBucketListLocations([
          { location: '龍洞', item_count: 50, user_count: 30, completed_count: 15 },
          { location: 'El Capitan', item_count: 25, user_count: 10, completed_count: 2 },
          { location: 'Fontainebleau', item_count: 35, user_count: 20, completed_count: 8 },
        ])
      } catch (err) {
        console.error('Failed to load locations:', err)
        setError('載入地點資料時發生錯誤')
      } finally {
        setLoading(false)
      }
    }

    loadLocations()
  }, [])

  const renderLocationCard = (loc: LocationData, index: number) => (
    <Animated.View key={`${loc.location}-${index}`} entering={FadeIn.delay(index * 50)}>
      <Pressable
        onPress={() => router.push(`/biography/explore/location/${encodeURIComponent(loc.location)}` as any)}
      >
        <Card style={styles.locationCard}>
          <Text variant="body" fontWeight="600" style={styles.locationName}>
            {loc.location}
          </Text>
          <Text variant="small" color="textMuted" style={styles.countryName}>
            {loc.country}
          </Text>
          <View style={styles.visitorsRow}>
            <Users size={14} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="small" color="textSubtle">
              {loc.visitors.length} 人去過
            </Text>
          </View>
          {/* 訪客頭像 */}
          {loc.visitors.length > 0 && (
            <View style={styles.avatarStack}>
              {loc.visitors.slice(0, 4).map((visitor, i) => (
                <View key={visitor.id} style={[styles.stackedAvatar, { zIndex: 4 - i }]}>
                  <Avatar
                    size="xs"
                    source={visitor.avatar_url ? { uri: visitor.avatar_url } : undefined}
                  />
                </View>
              ))}
              {loc.visitors.length > 4 && (
                <View style={[styles.stackedAvatar, styles.moreAvatar]}>
                  <Text style={styles.moreText}>+{loc.visitors.length - 4}</Text>
                </View>
              )}
            </View>
          )}
        </Card>
      </Pressable>
    </Animated.View>
  )

  const renderBucketListLocationCard = (loc: BucketListLocation, index: number) => (
    <Animated.View key={loc.location} entering={FadeIn.delay(index * 50)}>
      <Pressable
        onPress={() => router.push(`/biography/explore/location/${encodeURIComponent(loc.location)}` as any)}
      >
        <Card style={styles.locationCard}>
          <Text variant="body" fontWeight="600" style={styles.locationName}>
            {loc.location}
          </Text>
          <View style={styles.bucketStats}>
            <View style={styles.bucketStatRow}>
              <Text variant="small" color="textSubtle">
                設為目標
              </Text>
              <Text variant="small" fontWeight="500">
                {loc.item_count} 個
              </Text>
            </View>
            <View style={styles.bucketStatRow}>
              <Text variant="small" color="textSubtle">
                挑戰中
              </Text>
              <Text variant="small" fontWeight="500">
                {loc.user_count} 人
              </Text>
            </View>
            <View style={styles.bucketStatRow}>
              <Text variant="small" color="textSubtle">
                已完成
              </Text>
              <Text variant="small" fontWeight="500" style={styles.completedText}>
                {loc.completed_count} 人
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text color="error">{error}</Text>
      </View>
    )
  }

  const currentLocations =
    activeTab === 'taiwan'
      ? taiwanLocations
      : activeTab === 'overseas'
        ? overseasLocations
        : bucketListLocations

  return (
    <View style={styles.container}>
      {/* 標題 */}
      <View style={styles.headerRow}>
        <View style={styles.header}>
          <MapPin size={24} color="#3B82F6" />
          <Text variant="h4" fontWeight="700">
            依地點探索
          </Text>
        </View>
        <Pressable
          style={styles.moreLink}
          onPress={() => router.push('/biography/explore/locations' as any)}
        >
          <Text variant="small" color="textSubtle">
            更多地點
          </Text>
          <ChevronRight size={16} color={SEMANTIC_COLORS.textSubtle} />
        </Pressable>
      </View>

      {/* 標籤切換 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'taiwan' && styles.tabActive]}
            onPress={() => setActiveTab('taiwan')}
          >
            <MapPin size={14} color={activeTab === 'taiwan' ? '#fff' : SEMANTIC_COLORS.textSubtle} />
            <Text
              variant="small"
              style={[styles.tabText, activeTab === 'taiwan' && styles.tabTextActive]}
            >
              台灣岩場
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'overseas' && styles.tabActive]}
            onPress={() => setActiveTab('overseas')}
          >
            <Globe size={14} color={activeTab === 'overseas' ? '#fff' : SEMANTIC_COLORS.textSubtle} />
            <Text
              variant="small"
              style={[styles.tabText, activeTab === 'overseas' && styles.tabTextActive]}
            >
              海外攀岩
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'bucket' && styles.tabActive]}
            onPress={() => setActiveTab('bucket')}
          >
            <Text
              variant="small"
              style={[styles.tabText, activeTab === 'bucket' && styles.tabTextActive]}
            >
              目標地點
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* 地點網格 */}
      <View style={styles.grid}>
        {currentLocations.length > 0 ? (
          activeTab === 'bucket'
            ? (currentLocations as BucketListLocation[]).map((loc, index) =>
                renderBucketListLocationCard(loc, index)
              )
            : (currentLocations as LocationData[]).map((loc, index) =>
                renderLocationCard(loc, index)
              )
        ) : (
          <View style={styles.emptyContainer}>
            <Text color="textSubtle">
              {activeTab === 'taiwan'
                ? '暫無台灣岩場資料'
                : activeTab === 'overseas'
                  ? '暫無海外攀岩資料'
                  : '暫無目標地點資料'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  moreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  loadingContainer: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  tabsContainer: {
    marginBottom: SPACING.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  tabActive: {
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  tabText: {
    color: SEMANTIC_COLORS.textSubtle,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  locationCard: {
    width: 160,
    padding: SPACING.md,
  },
  locationName: {
    marginBottom: 4,
  },
  countryName: {
    marginBottom: SPACING.sm,
  },
  visitorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  stackedAvatar: {
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 14,
  },
  moreAvatar: {
    width: 28,
    height: 28,
    backgroundColor: '#F0F0F0',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 10,
    color: SEMANTIC_COLORS.textSubtle,
  },
  bucketStats: {
    marginTop: SPACING.sm,
    gap: 4,
  },
  bucketStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedText: {
    color: '#16A34A',
  },
})

export default LocationExplorer
