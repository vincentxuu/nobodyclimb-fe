/**
 * FeaturedPosts 組件
 *
 * 探索攀岩區塊，對應 apps/web/src/components/home/featured-posts.tsx
 */
import React from 'react'
import { StyleSheet, View, Pressable, FlatList } from 'react-native'
import { useRouter } from 'expo-router'
import { YStack } from 'tamagui'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 文章資料類型
interface Post {
  id: number
  title: string
  slug: string
  colors: [string, string] // 漸層顏色
}

// 探索區塊文章資料
const explorePosts: Post[] = [
  {
    id: 1,
    title: '裝備介紹',
    slug: 'equipment-intro',
    colors: ['#667eea', '#764ba2'],
  },
  {
    id: 2,
    title: '技巧介紹',
    slug: 'technique-intro',
    colors: ['#f093fb', '#f5576c'],
  },
  {
    id: 3,
    title: '技術研究',
    slug: 'technical-research',
    colors: ['#4facfe', '#00f2fe'],
  },
  {
    id: 4,
    title: '比賽介紹',
    slug: 'competition-intro',
    colors: ['#43e97b', '#38f9d7'],
  },
]

// 探索卡片組件
function ExploreCard({ post, index }: { post: Post; index: number }) {
  const router = useRouter()

  const handlePress = () => {
    router.push(`/blog/${post.slug}`)
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(500)}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.cardContainer,
          pressed && styles.cardPressed,
        ]}
      >
        <LinearGradient
          colors={post.colors}
          style={styles.cardImage}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* 遮罩 */}
          <View style={styles.cardOverlay} />

          {/* 標題 */}
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{post.title}</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  )
}

export function FeaturedPosts() {
  return (
    <YStack gap={SPACING.lg}>
      {/* 標題區塊 */}
      <YStack alignItems="center" gap={SPACING.sm}>
        <Text variant="h2" style={styles.sectionTitle}>
          探索攀岩
        </Text>
        <Text color="textSubtle" style={styles.sectionSubtitle}>
          關於攀岩的各種知識和故事
        </Text>
      </YStack>

      {/* 文章列表 - 橫向滾動 */}
      <FlatList
        data={explorePosts}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <ExploreCard post={item} index={index} />
        )}
        ItemSeparatorComponent={() => <View style={{ width: SPACING.sm }} />}
      />
    </YStack>
  )
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 28,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textMain,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
  },
  cardContainer: {
    width: 160,
    height: 160,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardImage: {
    flex: 1,
    justifyContent: 'flex-end',
    borderRadius: RADIUS.md,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  cardTitleContainer: {
    padding: SPACING.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
})

export default FeaturedPosts
