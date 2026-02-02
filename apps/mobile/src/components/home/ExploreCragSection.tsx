/**
 * ExploreCragSection 組件
 *
 * 探索岩場區，對應 apps/web/src/components/home/explore-crag-section.tsx
 */
import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Pressable, FlatList, Dimensions, Image } from 'react-native'
import { YStack, XStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { MapPin, Mountain, Calendar } from 'lucide-react-native'
import Animated, { FadeInRight } from 'react-native-reanimated'

import { Text, Button, Skeleton, Badge } from '@/components/ui'
import { FadeIn, SlideUp } from '@/components/animation'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, WB_COLORS } from '@nobodyclimb/constants'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_WIDTH * 0.75

interface CragListItem {
  id: string
  name: string
  nameEn: string
  location: string
  type: string
  rockType: string
  routes: number
  difficulty: string
  seasons: string[]
  coverImage?: string
}

// 模擬岩場資料（實際應從 API 獲取）
const mockCrags: CragListItem[] = [
  {
    id: 'longdong',
    name: '龍洞',
    nameEn: 'Longdong',
    location: '新北市貢寮區',
    type: '傳統攀岩',
    rockType: '砂岩',
    routes: 500,
    difficulty: '5.5 - 5.14',
    seasons: ['春', '秋', '冬'],
  },
  {
    id: 'defulan',
    name: '德芙蘭',
    nameEn: 'Defulan',
    location: '台中市和平區',
    type: '運動攀岩',
    rockType: '石灰岩',
    routes: 150,
    difficulty: '5.8 - 5.13',
    seasons: ['秋', '冬'],
  },
  {
    id: 'shoushan',
    name: '壽山',
    nameEn: 'Shoushan',
    location: '高雄市鼓山區',
    type: '抱石',
    rockType: '珊瑚礁石灰岩',
    routes: 200,
    difficulty: 'V0 - V10',
    seasons: ['秋', '冬', '春'],
  },
]

function CragCard({ crag, index }: { crag: CragListItem; index: number }) {
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
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
      >
        {/* 岩場封面 */}
        <View style={styles.coverContainer}>
          {crag.coverImage ? (
            <Image
              source={{ uri: crag.coverImage }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <Mountain size={32} color={SEMANTIC_COLORS.textMuted} />
            </View>
          )}
          {/* 岩石類型標籤 */}
          <View style={styles.typeLabel}>
            <Text style={styles.typeLabelText}>{crag.type}</Text>
          </View>
        </View>

        {/* 岩場資訊 */}
        <View style={styles.cardContent}>
          <XStack alignItems="baseline" gap={SPACING[1.5]}>
            <Text style={styles.cragName}>{crag.name}</Text>
            <Text style={styles.cragNameEn}>{crag.nameEn}</Text>
          </XStack>

          <XStack alignItems="center" gap={SPACING[1.5]} marginTop={SPACING[1.5]}>
            <MapPin size={14} color={SEMANTIC_COLORS.textSubtle} />
            <Text style={styles.locationText}>{crag.location}</Text>
          </XStack>

          <XStack alignItems="center" gap={SPACING[3]} marginTop={SPACING[2]}>
            <XStack alignItems="center" gap={SPACING[1]}>
              <Mountain size={14} color={SEMANTIC_COLORS.textSubtle} />
              <Text style={styles.infoText}>{crag.routes} 條路線</Text>
            </XStack>
            <Text style={styles.difficultyText}>{crag.difficulty}</Text>
          </XStack>

          {/* 季節標籤 */}
          <XStack alignItems="center" gap={SPACING[1.5]} marginTop={SPACING[2]}>
            <Calendar size={14} color={SEMANTIC_COLORS.textMuted} />
            <XStack gap={SPACING[1]}>
              {crag.seasons.map((season) => (
                <View key={season} style={styles.seasonBadge}>
                  <Text style={styles.seasonText}>{season}</Text>
                </View>
              ))}
            </XStack>
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

export function ExploreCragSection() {
  const router = useRouter()
  const [crags, setCrags] = useState<CragListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCrags() {
      try {
        // TODO: 替換為實際的 API 端點
        // const response = await fetch('https://api.nobodyclimb.cc/api/v1/crags')
        // const result = await response.json()
        // setCrags(result.data)

        // 暫時使用模擬資料
        await new Promise((resolve) => setTimeout(resolve, 500))
        setCrags(mockCrags)
      } catch (error) {
        console.error('Failed to fetch crags:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCrags()
  }, [])

  const handleViewAll = () => {
    router.push('/crag')
  }

  return (
    <FadeIn>
      <View style={styles.container}>
        {/* 標題區 */}
        <View style={styles.header}>
          <YStack>
            <Text style={styles.title}>探索岩場</Text>
            <Text style={styles.subtitle}>發現台灣的天然攀岩場地</Text>
          </YStack>
        </View>

        {/* 岩場列表 - 橫向滾動 */}
        <FlatList<number | CragListItem>
          data={isLoading ? [1, 2, 3] : crags}
          keyExtractor={(item) => (typeof item === 'number' ? `skeleton-${item}` : item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) =>
            typeof item === 'number' ? (
              <CragSkeleton />
            ) : (
              <CragCard crag={item} index={index} />
            )
          }
          ItemSeparatorComponent={() => <View style={{ width: SPACING[4] }} />}
        />

        {/* 查看全部按鈕 */}
        <SlideUp delay={200}>
          <View style={styles.ctaContainer}>
            <Button variant="secondary" onPress={handleViewAll}>
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
    color: SEMANTIC_COLORS.textMain,
  },
  subtitle: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textSubtle,
    marginTop: SPACING[1],
  },
  listContent: {
    paddingHorizontal: SPACING[4],
  },
  cardContainer: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
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
    aspectRatio: 4,
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
    color: '#FFFFFF',
  },
  cardContent: {
    padding: SPACING[3],
  },
  cragName: {
    fontSize: 16,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textMain,
  },
  cragNameEn: {
    fontSize: 12,
    color: SEMANTIC_COLORS.textMuted,
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
  seasonBadge: {
    backgroundColor: WB_COLORS[10],
    paddingHorizontal: SPACING[1.5],
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  seasonText: {
    fontSize: 10,
    color: SEMANTIC_COLORS.textSubtle,
  },
  coverSkeleton: {
    aspectRatio: 4,
  },
  ctaContainer: {
    marginTop: SPACING[8],
    alignItems: 'center',
  },
})

export default ExploreCragSection
