/**
 * 探索頁面
 *
 * 整合岩場、岩館、影片等探索功能
 */
import React, { useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import {
  Mountain,
  Building2,
  Video,
  MapPin,
  ChevronRight,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, SearchInput, Card } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 探索類別
const EXPLORE_CATEGORIES = [
  {
    id: 'crag',
    title: '戶外岩場',
    description: '探索台灣各地的天然岩場',
    icon: Mountain,
    color: '#10B981',
    bgColor: '#ECFDF5',
    route: '/crag',
  },
  {
    id: 'gym',
    title: '室內岩館',
    description: '找到你附近的攀岩館',
    icon: Building2,
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    route: '/gym',
  },
  {
    id: 'videos',
    title: '攀岩影片',
    description: '觀看精彩的攀岩影片',
    icon: Video,
    color: '#EF4444',
    bgColor: '#FEF2F2',
    route: '/videos',
  },
]

// 熱門地點
const POPULAR_LOCATIONS = [
  { id: '1', name: '龍洞', type: '戶外岩場', image: 'https://picsum.photos/200/150?random=1' },
  { id: '2', name: '大砲岩', type: '戶外岩場', image: 'https://picsum.photos/200/150?random=2' },
  { id: '3', name: 'RedRock', type: '岩館', image: 'https://picsum.photos/200/150?random=3' },
]

interface CategoryCardProps {
  category: typeof EXPLORE_CATEGORIES[0]
  onPress: () => void
  index: number
}

function CategoryCard({ category, onPress, index }: CategoryCardProps) {
  const Icon = category.icon

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 100)}>
      <Pressable onPress={onPress}>
        <Card style={styles.categoryCard}>
          <View style={[styles.iconContainer, { backgroundColor: category.bgColor }]}>
            <Icon size={28} color={category.color} />
          </View>
          <View style={styles.categoryContent}>
            <Text variant="body" fontWeight="600">
              {category.title}
            </Text>
            <Text variant="small" color="textSubtle">
              {category.description}
            </Text>
          </View>
          <ChevronRight size={20} color={SEMANTIC_COLORS.textMuted} />
        </Card>
      </Pressable>
    </Animated.View>
  )
}

export default function ExploreScreen() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value.trim())}` as any)
    }
  }, [router])

  const handleCategoryPress = useCallback(
    (route: string) => {
      router.push(route as any)
    },
    [router]
  )

  const handleLocationPress = useCallback(
    (id: string, type: string) => {
      const route = type === '岩館' ? `/gym/${id}` : `/crag/${id}`
      router.push(route as any)
    },
    [router]
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 標題區 */}
        <View style={styles.header}>
          <Text variant="h2" fontWeight="700">
            探索
          </Text>
          <Text variant="body" color="textSubtle">
            探索岩場、岩館與攀岩影片
          </Text>
        </View>

        {/* 搜尋欄 */}
        <View style={styles.searchSection}>
          <SearchInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmit={() => handleSearch(searchTerm)}
            placeholder="搜尋岩場、岩館..."
          />
        </View>

        {/* 類別卡片 */}
        <View style={styles.categoriesSection}>
          {EXPLORE_CATEGORIES.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => handleCategoryPress(category.route)}
              index={index}
            />
          ))}
        </View>

        {/* 熱門地點 */}
        <View style={styles.popularSection}>
          <View style={styles.sectionHeader}>
            <Text variant="h4" fontWeight="600">
              熱門地點
            </Text>
            <Pressable>
              <Text variant="small" color="textSubtle">
                查看更多
              </Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularList}
          >
            {POPULAR_LOCATIONS.map((location) => (
              <Pressable
                key={location.id}
                style={styles.locationCard}
                onPress={() => handleLocationPress(location.id, location.type)}
              >
                <Image
                  source={{ uri: location.image }}
                  style={styles.locationImage}
                  contentFit="cover"
                  transition={300}
                />
                <View style={styles.locationInfo}>
                  <Text variant="body" fontWeight="500">
                    {location.name}
                  </Text>
                  <View style={styles.locationMeta}>
                    <MapPin size={12} color={SEMANTIC_COLORS.textMuted} />
                    <Text variant="small" color="textMuted">
                      {location.type}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  categoriesSection: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryContent: {
    flex: 1,
  },
  popularSection: {
    marginTop: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  popularList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  locationCard: {
    width: 160,
    borderRadius: RADIUS.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationImage: {
    width: '100%',
    height: 100,
  },
  locationInfo: {
    padding: SPACING.sm,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  bottomPadding: {
    height: SPACING.xxl,
  },
})
