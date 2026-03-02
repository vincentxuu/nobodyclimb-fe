/**
 * GymHighlights 組件
 *
 * 熱門攀岩館區塊，對應 apps/web/src/components/home/gym-highlights.tsx
 */
import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Pressable,
  FlatList,
  Dimensions,
  Image,
} from 'react-native'
import { YStack, XStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { MapPin, Star, ArrowRight } from 'lucide-react-native'
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated'

import { Text, Button, Skeleton } from '@/components/ui'
import { FadeIn, SlideUp } from '@/components/animation'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, WB_COLORS } from '@nobodyclimb/constants'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = (SCREEN_WIDTH - SPACING[4] * 2 - SPACING[4]) / 2

interface Gym {
  id: string
  name: string
  slug: string
  coverImage: string
  address: string
  description?: string
  rating: number
  reviews: number
  facilities?: string[]
}

// 模擬資料（實際應從 API 獲取）
const mockGyms: Gym[] = [
  {
    id: 'redrock',
    name: '紅石攀岩館',
    slug: 'redrock',
    coverImage: '',
    address: '台北市大安區',
    description: '台北市最大的室內攀岩館之一',
    rating: 4.8,
    reviews: 256,
    facilities: ['抱石區', '繩攀區', '健身區', '淋浴間'],
  },
  {
    id: 'double8',
    name: 'Double 8 岩究所',
    slug: 'double8',
    coverImage: '',
    address: '台北市中山區',
    description: '專業的抱石訓練中心',
    rating: 4.7,
    reviews: 189,
    facilities: ['抱石區', '訓練區', '咖啡廳'],
  },
  {
    id: 'corner',
    name: '角落攀岩館',
    slug: 'corner',
    coverImage: '',
    address: '新北市板橋區',
    description: '新北市人氣攀岩館',
    rating: 4.6,
    reviews: 145,
    facilities: ['抱石區', '繩攀區', '兒童區'],
  },
]

function GymCard({ gym, index }: { gym: Gym; index: number }) {
  const router = useRouter()

  const handlePress = () => {
    router.push(`/gym/${gym.slug}`)
  }

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(400)}
      style={styles.cardContainer}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
      >
        {/* 封面圖片 */}
        <View style={styles.coverContainer}>
          {gym.coverImage ? (
            <Image
              source={{ uri: gym.coverImage }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <Text style={styles.placeholderText}>
                {gym.name.charAt(0)}
              </Text>
            </View>
          )}

          {/* 評分標籤 */}
          <View style={styles.ratingBadge}>
            <Star
              size={12}
              color="#FACC15"
              fill="#FACC15"
            />
            <Text style={styles.ratingText}>{gym.rating.toFixed(1)}</Text>
            <Text style={styles.reviewsText}>({gym.reviews})</Text>
          </View>
        </View>

        {/* 內容區 */}
        <View style={styles.cardContent}>
          <Text style={styles.gymName} numberOfLines={1}>
            {gym.name}
          </Text>

          <XStack alignItems="center" gap={4} marginTop={SPACING[1]}>
            <MapPin size={12} color={SEMANTIC_COLORS.textMuted} />
            <Text style={styles.addressText} numberOfLines={1}>
              {gym.address}
            </Text>
          </XStack>

          {gym.description && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {gym.description}
            </Text>
          )}

          {/* 設施標籤 */}
          {gym.facilities && gym.facilities.length > 0 && (
            <XStack flexWrap="wrap" gap={SPACING[1]} marginTop={SPACING[2]}>
              {gym.facilities.slice(0, 2).map((facility) => (
                <View key={facility} style={styles.facilityBadge}>
                  <Text style={styles.facilityText}>{facility}</Text>
                </View>
              ))}
              {gym.facilities.length > 2 && (
                <View style={styles.facilityBadge}>
                  <Text style={styles.facilityText}>
                    +{gym.facilities.length - 2}
                  </Text>
                </View>
              )}
            </XStack>
          )}
        </View>
      </Pressable>
    </Animated.View>
  )
}

function GymSkeleton() {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <Skeleton style={styles.coverSkeleton} />
        <View style={styles.cardContent}>
          <Skeleton style={{ width: '80%', height: 16 }} />
          <Skeleton style={{ width: '60%', height: 12, marginTop: SPACING[1] }} />
          <Skeleton style={{ width: '100%', height: 28, marginTop: SPACING[2] }} />
        </View>
      </View>
    </View>
  )
}

export function GymHighlights() {
  const router = useRouter()
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGyms() {
      try {
        // TODO: 替換為實際的 API 端點
        // const response = await fetch('https://api.nobodyclimb.cc/api/v1/gyms/featured')
        // const result = await response.json()
        // setGyms(result.data)

        // 暫時使用模擬資料
        await new Promise((resolve) => setTimeout(resolve, 500))
        setGyms(mockGyms)
      } catch (error) {
        console.error('Failed to fetch gyms:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGyms()
  }, [])

  const handleViewAll = () => {
    router.push('/gym')
  }

  const handleAddGym = () => {
    router.push('/gym/add')
  }

  return (
    <FadeIn>
      <View style={styles.container}>
        {/* 標題區 */}
        <View style={styles.header}>
          <YStack flex={1}>
            <Text style={styles.title}>熱門攀岩館</Text>
          </YStack>
          <Pressable onPress={handleViewAll} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>查看全部</Text>
            <ArrowRight size={16} color={SEMANTIC_COLORS.textMain} />
          </Pressable>
        </View>

        {/* 岩館列表 */}
        {loading ? (
          <XStack flexWrap="wrap" gap={SPACING[4]}>
            <GymSkeleton />
            <GymSkeleton />
          </XStack>
        ) : (
          <XStack flexWrap="wrap" gap={SPACING[4]}>
            {gyms.map((gym, index) => (
              <GymCard key={gym.id} gym={gym} index={index} />
            ))}
          </XStack>
        )}

        {/* 加入新攀岩館提示 */}
        <SlideUp delay={300}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>發現新的攀岩場所？</Text>
            <Text style={styles.ctaDescription}>
              幫助社群成長！分享你知道的攀岩館資訊，讓更多攀岩愛好者受益。
            </Text>
            <Button variant="primary" onPress={handleAddGym}>
              新增攀岩館
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
    paddingHorizontal: SPACING[4],
    backgroundColor: WB_COLORS[10],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[6],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: SEMANTIC_COLORS.textMain,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textMain,
  },
  cardContainer: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  cardPressed: {
    opacity: 0.9,
  },
  coverContainer: {
    position: 'relative',
    height: 120,
  },
  coverImage: {
    flex: 1,
  },
  coverPlaceholder: {
    backgroundColor: WB_COLORS[30],
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: SEMANTIC_COLORS.textMuted,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: SPACING[2],
    right: SPACING[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: SPACING[2],
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textMain,
  },
  reviewsText: {
    fontSize: 10,
    color: SEMANTIC_COLORS.textMuted,
  },
  cardContent: {
    padding: SPACING[3],
  },
  gymName: {
    fontSize: 14,
    fontWeight: '600',
    color: SEMANTIC_COLORS.textMain,
  },
  addressText: {
    fontSize: 11,
    color: SEMANTIC_COLORS.textMuted,
    flex: 1,
  },
  descriptionText: {
    fontSize: 12,
    color: SEMANTIC_COLORS.textSubtle,
    marginTop: SPACING[1.5],
    lineHeight: 16,
  },
  facilityBadge: {
    backgroundColor: WB_COLORS[10],
    paddingHorizontal: SPACING[1.5],
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  facilityText: {
    fontSize: 10,
    color: SEMANTIC_COLORS.textSubtle,
  },
  coverSkeleton: {
    height: 120,
  },
  ctaCard: {
    marginTop: SPACING[8],
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[6],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: SEMANTIC_COLORS.textMain,
    marginBottom: SPACING[2],
  },
  ctaDescription: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textSubtle,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING[4],
  },
})

export default GymHighlights
