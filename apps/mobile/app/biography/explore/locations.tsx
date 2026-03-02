/**
 * 位置列表頁面
 *
 * 對應 apps/web/src/app/biography/explore/locations/page.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { ChevronLeft, MapPin, Globe, Users, Search } from 'lucide-react-native'

import { Text, Card, Avatar, SearchInput, IconButton } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 類型定義
interface LocationData {
  location: string
  country: string
  region: 'taiwan' | 'overseas'
  visitors: Array<{
    id: string
    name: string
    avatar_url: string | null
    slug: string
  }>
}

type TabType = 'all' | 'taiwan' | 'overseas'

export default function LocationsScreen() {
  const router = useRouter()
  const [locations, setLocations] = useState<LocationData[]>([])
  const [filteredLocations, setFilteredLocations] = useState<LocationData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('all')

  // 載入資料
  const loadLocations = useCallback(async () => {
    setLoading(true)
    try {
      // TODO: 整合 API
      await new Promise((resolve) => setTimeout(resolve, 500))

      const mockData: LocationData[] = [
        {
          location: '龍洞',
          country: '台灣',
          region: 'taiwan',
          visitors: [
            { id: '1', name: '小明', avatar_url: null, slug: 'xiaoming' },
            { id: '2', name: '小華', avatar_url: null, slug: 'xiaohua' },
            { id: '3', name: '阿強', avatar_url: null, slug: 'aqiang' },
            { id: '4', name: '小美', avatar_url: null, slug: 'xiaomei' },
            { id: '5', name: '大偉', avatar_url: null, slug: 'dawei' },
          ],
        },
        {
          location: '大砲岩',
          country: '台灣',
          region: 'taiwan',
          visitors: [
            { id: '1', name: '小明', avatar_url: null, slug: 'xiaoming' },
            { id: '6', name: '阿豪', avatar_url: null, slug: 'ahao' },
          ],
        },
        {
          location: '關子嶺',
          country: '台灣',
          region: 'taiwan',
          visitors: [
            { id: '2', name: '小華', avatar_url: null, slug: 'xiaohua' },
          ],
        },
        {
          location: '壽山',
          country: '台灣',
          region: 'taiwan',
          visitors: [
            { id: '3', name: '阿強', avatar_url: null, slug: 'aqiang' },
            { id: '4', name: '小美', avatar_url: null, slug: 'xiaomei' },
          ],
        },
        {
          location: 'Yosemite',
          country: '美國',
          region: 'overseas',
          visitors: [
            { id: '1', name: '小明', avatar_url: null, slug: 'xiaoming' },
          ],
        },
        {
          location: 'Fontainebleau',
          country: '法國',
          region: 'overseas',
          visitors: [
            { id: '2', name: '小華', avatar_url: null, slug: 'xiaohua' },
            { id: '7', name: '凱文', avatar_url: null, slug: 'kevin' },
          ],
        },
        {
          location: 'Bishop',
          country: '美國',
          region: 'overseas',
          visitors: [
            { id: '3', name: '阿強', avatar_url: null, slug: 'aqiang' },
          ],
        },
        {
          location: 'Kalymnos',
          country: '希臘',
          region: 'overseas',
          visitors: [
            { id: '8', name: '凱西', avatar_url: null, slug: 'kathy' },
          ],
        },
      ]

      setLocations(mockData)
    } catch (err) {
      console.error('Failed to load locations:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLocations()
  }, [loadLocations])

  // 過濾資料
  useEffect(() => {
    let filtered = locations

    // 依分頁過濾
    if (activeTab !== 'all') {
      filtered = filtered.filter((loc) => loc.region === activeTab)
    }

    // 依搜尋詞過濾
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (loc) =>
          loc.location.toLowerCase().includes(search) ||
          loc.country.toLowerCase().includes(search)
      )
    }

    // 依訪客數排序
    filtered = filtered.sort((a, b) => b.visitors.length - a.visitors.length)

    setFilteredLocations(filtered)
  }, [locations, activeTab, searchTerm])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadLocations()
    setRefreshing(false)
  }, [loadLocations])

  const renderLocationCard = ({ item, index }: { item: LocationData; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <Pressable
        onPress={() =>
          router.push(`/biography/explore/location/${encodeURIComponent(item.location)}` as any)
        }
      >
        <Card style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <View style={styles.locationInfo}>
              <Text variant="body" fontWeight="600">
                {item.location}
              </Text>
              <View style={styles.countryRow}>
                {item.region === 'taiwan' ? (
                  <MapPin size={14} color={SEMANTIC_COLORS.textMuted} />
                ) : (
                  <Globe size={14} color={SEMANTIC_COLORS.textMuted} />
                )}
                <Text variant="small" color="textMuted">
                  {item.country}
                </Text>
              </View>
            </View>
            <View style={styles.visitorCount}>
              <Users size={16} color={SEMANTIC_COLORS.textSubtle} />
              <Text variant="body" fontWeight="500">
                {item.visitors.length}
              </Text>
            </View>
          </View>

          {/* 訪客頭像 */}
          {item.visitors.length > 0 && (
            <View style={styles.avatarStack}>
              {item.visitors.slice(0, 5).map((visitor, i) => (
                <View key={visitor.id} style={[styles.stackedAvatar, { zIndex: 5 - i }]}>
                  <Avatar
                    size="sm"
                    source={visitor.avatar_url ? { uri: visitor.avatar_url } : undefined}
                  />
                </View>
              ))}
              {item.visitors.length > 5 && (
                <View style={[styles.stackedAvatar, styles.moreAvatar]}>
                  <Text style={styles.moreText}>+{item.visitors.length - 5}</Text>
                </View>
              )}
            </View>
          )}
        </Card>
      </Pressable>
    </Animated.View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 導航欄 */}
      <View style={styles.navbar}>
        <IconButton
          icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
          onPress={() => router.back()}
          variant="ghost"
        />
        <Text variant="h4" fontWeight="600">
          攀岩地點
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 搜尋與篩選 */}
      <View style={styles.filterSection}>
        <SearchInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="搜尋地點..."
          style={styles.searchInput}
        />

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              variant="small"
              style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}
            >
              全部 ({locations.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'taiwan' && styles.tabActive]}
            onPress={() => setActiveTab('taiwan')}
          >
            <MapPin
              size={14}
              color={activeTab === 'taiwan' ? '#fff' : SEMANTIC_COLORS.textSubtle}
            />
            <Text
              variant="small"
              style={[styles.tabText, activeTab === 'taiwan' && styles.tabTextActive]}
            >
              台灣
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'overseas' && styles.tabActive]}
            onPress={() => setActiveTab('overseas')}
          >
            <Globe
              size={14}
              color={activeTab === 'overseas' ? '#fff' : SEMANTIC_COLORS.textSubtle}
            />
            <Text
              variant="small"
              style={[styles.tabText, activeTab === 'overseas' && styles.tabTextActive]}
            >
              海外
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
        </View>
      ) : (
        <FlatList
          data={filteredLocations}
          renderItem={renderLocationCard}
          keyExtractor={(item) => `${item.location}-${item.country}`}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text color="textSubtle">
                {searchTerm ? `找不到符合「${searchTerm}」的地點` : '目前沒有地點資料'}
              </Text>
            </View>
          }
        />
      )}
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
  filterSection: {
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  searchInput: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
  },
  separator: {
    height: SPACING.md,
  },
  locationCard: {
    padding: SPACING.md,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  locationInfo: {
    flex: 1,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  visitorCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  stackedAvatar: {
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 18,
  },
  moreAvatar: {
    width: 36,
    height: 36,
    backgroundColor: '#F0F0F0',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 11,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textSubtle,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
})
