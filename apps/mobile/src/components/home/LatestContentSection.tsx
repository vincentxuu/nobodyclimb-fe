/**
 * LatestContentSection 組件
 *
 * 最新文章區塊，對應 apps/web/src/components/home/latest-content-section.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
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
import Animated, { FadeInUp } from 'react-native-reanimated'

import { Text, Button, Skeleton, Spinner } from '@/components/ui'
import { FadeIn } from '@/components/animation'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, WB_COLORS } from '@nobodyclimb/constants'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = (SCREEN_WIDTH - SPACING[4] * 2 - SPACING[4]) / 2

// 分類標籤映射
const categoryLabels: Record<string, string> = {
  climbing_story: '攀岩故事',
  training: '訓練心得',
  gear_review: '裝備評測',
  route_beta: '路線攻略',
  competition: '比賽資訊',
  outdoor: '戶外攀岩',
  lifestyle: '攀岩生活',
}

function getCategoryLabel(category?: string): string {
  if (!category) return ''
  return categoryLabels[category] || ''
}

function generateSummary(content?: string, maxLength: number = 80): string {
  if (!content) return ''
  const plainText = content
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (plainText.length <= maxLength) return plainText
  return plainText.slice(0, maxLength) + '...'
}

interface Article {
  id: string
  title: string
  thumbnail: string | null
  excerpt: string
  date: string
  category?: string
  author?: string
}

interface BackendPost {
  id: string
  title: string
  cover_image?: string
  excerpt?: string
  content?: string
  category?: string
  published_at?: string
  created_at: string
  display_name?: string
  username?: string
}

function ArticleCard({ article, index }: { article: Article; index: number }) {
  const router = useRouter()

  const handlePress = () => {
    router.push(`/blog/${article.id}`)
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 100).duration(500)}
      style={styles.cardContainer}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
      >
        {/* 縮圖 */}
        <View style={styles.thumbnailContainer}>
          {article.thumbnail ? (
            <Image
              source={{ uri: article.thumbnail }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Text style={styles.placeholderText}>
                {article.title.charAt(0)}
              </Text>
            </View>
          )}

          {/* 分類標籤 */}
          {article.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{article.category}</Text>
            </View>
          )}
        </View>

        {/* 內容區 */}
        <View style={styles.cardContent}>
          <Text style={styles.articleTitle} numberOfLines={2}>
            {article.title}
          </Text>
          <Text style={styles.excerptText} numberOfLines={2}>
            {article.excerpt}
          </Text>
          <XStack
            alignItems="center"
            justifyContent="space-between"
            marginTop={SPACING[2]}
          >
            <Text style={styles.dateText}>{article.date}</Text>
            {article.author && (
              <Text style={styles.authorText} numberOfLines={1}>
                {article.author}
              </Text>
            )}
          </XStack>
        </View>
      </Pressable>
    </Animated.View>
  )
}

function ArticleSkeleton() {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <Skeleton style={styles.thumbnailSkeleton} />
        <View style={styles.cardContent}>
          <Skeleton style={{ width: '100%', height: 16 }} />
          <Skeleton style={{ width: '100%', height: 28, marginTop: SPACING[2] }} />
          <Skeleton style={{ width: '60%', height: 12, marginTop: SPACING[2] }} />
        </View>
      </View>
    </View>
  )
}

export function LatestContentSection() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  const fetchArticles = useCallback(async () => {
    try {
      const response = await fetch(
        'https://api.nobodyclimb.cc/api/v1/posts?page=1&limit=4'
      )
      const result = await response.json()

      if (result.success && result.data) {
        const items: Article[] = result.data.map((post: BackendPost) => ({
          id: post.id,
          title: post.title,
          thumbnail: post.cover_image || null,
          excerpt: post.excerpt || generateSummary(post.content),
          date: post.published_at
            ? new Date(post.published_at).toLocaleDateString('zh-TW')
            : new Date(post.created_at).toLocaleDateString('zh-TW'),
          category: getCategoryLabel(post.category) || undefined,
          author: post.display_name || post.username || undefined,
        }))
        setArticles(items)
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const handleViewMore = () => {
    router.push('/blog')
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>最新文章</Text>
          <Text style={styles.subtitle}>探索攀岩社群的最新動態</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Spinner size="lg" />
        </View>
      </View>
    )
  }

  if (articles.length === 0) {
    return null
  }

  return (
    <FadeIn>
      <View style={styles.container}>
        {/* 標題區 */}
        <View style={styles.header}>
          <Text style={styles.title}>最新文章</Text>
          <Text style={styles.subtitle}>探索攀岩社群的最新動態</Text>
        </View>

        {/* 文章網格 */}
        <XStack flexWrap="wrap" gap={SPACING[4]}>
          {articles.map((article, index) => (
            <ArticleCard key={article.id} article={article} index={index} />
          ))}
        </XStack>

        {/* 查看更多按鈕 */}
        <View style={styles.ctaContainer}>
          <Button variant="secondary" onPress={handleViewMore}>
            查看更多文章
          </Button>
        </View>
      </View>
    </FadeIn>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING[8],
    paddingHorizontal: SPACING[4],
    borderTopWidth: 1,
    borderTopColor: WB_COLORS[30],
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING[8],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: SEMANTIC_COLORS.textMain,
  },
  subtitle: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textSubtle,
    marginTop: SPACING[2],
  },
  loadingContainer: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  thumbnailContainer: {
    position: 'relative',
    aspectRatio: 4 / 3,
    backgroundColor: WB_COLORS[10],
  },
  thumbnail: {
    flex: 1,
  },
  thumbnailPlaceholder: {
    backgroundColor: WB_COLORS[20],
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: SEMANTIC_COLORS.textMuted,
  },
  categoryBadge: {
    position: 'absolute',
    top: SPACING[3],
    left: SPACING[3],
    backgroundColor: SEMANTIC_COLORS.textMain,
    paddingHorizontal: SPACING[2],
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  cardContent: {
    padding: SPACING[4],
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textMain,
    lineHeight: 20,
  },
  excerptText: {
    fontSize: 12,
    color: SEMANTIC_COLORS.textSubtle,
    marginTop: SPACING[2],
    lineHeight: 18,
  },
  dateText: {
    fontSize: 11,
    color: SEMANTIC_COLORS.textMuted,
  },
  authorText: {
    fontSize: 11,
    color: SEMANTIC_COLORS.textMuted,
    maxWidth: 80,
  },
  thumbnailSkeleton: {
    aspectRatio: 4 / 3,
  },
  ctaContainer: {
    marginTop: SPACING[8],
    alignItems: 'center',
  },
})

export default LatestContentSection
