/**
 * GymHighlights 組件
 *
 * 熱門攀岩館區塊，對應 apps/web/src/components/home/gym-highlights.tsx
 */

import { BORDER_RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { ArrowRight, MapPin, Star } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Dimensions, Image, Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeInRight } from 'react-native-reanimated'
import { XStack, YStack } from 'tamagui'
import { FadeIn, SlideUp } from '@/components/animation'
import { Button, Skeleton, Text } from '@/components/ui'
import { apiClient } from '@/lib/api'

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

interface ApiGym {
  id: string
  name: string
  slug: string
  cover_image?: string
  address?: string
  description?: string
  rating?: number
  review_count?: number
  facilities?: string[]
}

function adaptApiGym(gym: ApiGym): Gym {
  return {
    id: gym.id,
    name: gym.name,
    slug: gym.slug,
    coverImage: gym.cover_image || '',
    address: gym.address || '',
    description: gym.description,
    rating: gym.rating || 0,
    reviews: gym.review_count || 0,
    facilities: gym.facilities,
  }
}

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
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        {/* 封面圖片 */}
        <View style={styles.coverContainer}>
          {gym.coverImage ? (
            <Image source={{ uri: gym.coverImage }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <Text style={styles.placeholderText}>{gym.name.charAt(0)}</Text>
            </View>
          )}

          {/* 評分標籤 */}
          <View style={styles.ratingBadge}>
            <Star size={12} color="#FACC15" fill="#FACC15" />
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
                  <Text style={styles.facilityText}>+{gym.facilities.length - 2}</Text>
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
        const response = await apiClient.get<{
          success: boolean
          data: ApiGym[]
        }>('/gyms/featured', { params: { limit: 4 } })
        if (response.data?.success && response.data.data) {
          setGyms(response.data.data.map(adaptApiGym))
        }
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
    backgroundColor: WB_COLORS[0],
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
    backgroundColor: WB_COLORS[0],
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
