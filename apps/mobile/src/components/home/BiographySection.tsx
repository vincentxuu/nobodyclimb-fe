/**
 * BiographySection 組件
 *
 * 傳記區塊，對應 apps/web/src/components/home/biography-section.tsx
 */
import React from 'react'
import { StyleSheet, View, Pressable, FlatList } from 'react-native'
import { useRouter } from 'expo-router'
import { YStack, XStack } from 'tamagui'
import { ChevronRight } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, Avatar, Card, CardContent, Button } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 傳記卡片資料類型
interface BiographyItem {
  id: string
  name: string
  subtitle: string
  avatarUrl?: string
  slug: string
}

// 模擬資料
const featuredBiographies: BiographyItem[] = [
  {
    id: '1',
    name: '攀岩愛好者',
    subtitle: '5年抱石經驗',
    slug: 'climber-1',
  },
  {
    id: '2',
    name: '山岳探險家',
    subtitle: '傳統攀岩高手',
    slug: 'climber-2',
  },
  {
    id: '3',
    name: '都市攀岩者',
    subtitle: '室內攀岩達人',
    slug: 'climber-3',
  },
]

// 傳記卡片組件
function BiographyCard({ item, index }: { item: BiographyItem; index: number }) {
  const router = useRouter()

  const handlePress = () => {
    router.push(`/biography/${item.slug}`)
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(500)}>
      <Pressable onPress={handlePress}>
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <Avatar
              size="lg"
              source={item.avatarUrl ? { uri: item.avatarUrl } : undefined}
            />
            <YStack gap={4} flex={1}>
              <Text fontWeight="600">{item.name}</Text>
              <Text variant="small" color="textSubtle">
                {item.subtitle}
              </Text>
            </YStack>
            <ChevronRight size={20} color={SEMANTIC_COLORS.textMuted} />
          </CardContent>
        </Card>
      </Pressable>
    </Animated.View>
  )
}

export function BiographySection() {
  const router = useRouter()

  const handleViewAll = () => {
    router.push('/biography')
  }

  return (
    <YStack gap={SPACING.md}>
      {/* 標題區塊 */}
      <XStack justifyContent="space-between" alignItems="center">
        <YStack>
          <Text variant="h3">精選傳記</Text>
          <Text variant="small" color="textSubtle">
            探索攀岩者的故事
          </Text>
        </YStack>
        <Pressable onPress={handleViewAll}>
          <XStack alignItems="center" gap={4}>
            <Text variant="small" color="textMain">
              查看全部
            </Text>
            <ChevronRight size={16} color={SEMANTIC_COLORS.textMain} />
          </XStack>
        </Pressable>
      </XStack>

      {/* 傳記列表 */}
      <YStack gap={SPACING.sm}>
        {featuredBiographies.map((item, index) => (
          <BiographyCard key={item.id} item={item} index={index} />
        ))}
      </YStack>

      {/* 查看更多按鈕 */}
      <Button
        variant="secondary"
        onPress={handleViewAll}
        style={styles.viewAllButton}
      >
        <Text>探索更多傳記</Text>
      </Button>
    </YStack>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
  },
  viewAllButton: {
    marginTop: SPACING.sm,
  },
})

export default BiographySection
