/**
 * HeroArticle 組件
 *
 * 精選文章 Hero 輪播，對應 apps/web/src/components/home/hero-article.tsx
 */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  Image,
  ImageBackground,
} from 'react-native'
import { YStack, XStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'

import { Text, Spinner, Avatar } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, BRAND_YELLOW } from '@nobodyclimb/constants'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const HERO_HEIGHT = SCREEN_HEIGHT * 0.65

interface FeaturedArticle {
  id: string
  title: string
  excerpt?: string
  content?: string
  cover_image?: string
  category?: string
  published_at?: string
  created_at: string
  author_avatar?: string
  display_name?: string
  username?: string
}

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
  if (!category) return '文章'
  return categoryLabels[category] || '文章'
}

function generateSummary(content?: string, maxLength: number = 120): string {
  if (!content) return ''
  // 移除 HTML 標籤和多餘空白
  const plainText = content
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (plainText.length <= maxLength) return plainText
  return plainText.slice(0, maxLength) + '...'
}

function ArticleSlide({
  article,
  isActive,
}: {
  article: FeaturedArticle
  isActive: boolean
}) {
  const router = useRouter()
  const opacity = useSharedValue(isActive ? 1 : 0)

  useEffect(() => {
    opacity.value = withTiming(isActive ? 1 : 0, { duration: 700 })
  }, [isActive, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const handlePress = () => {
    router.push(`/blog/${article.id}`)
  }

  const displayDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('zh-TW')
    : new Date(article.created_at).toLocaleDateString('zh-TW')

  const excerpt =
    article.excerpt || generateSummary(article.content)

  const authorName =
    article.display_name || article.username || '匿名作者'

  if (!isActive) return null

  return (
    <Animated.View style={[styles.slideContainer, animatedStyle]}>
      <Pressable onPress={handlePress} style={styles.slidePressable}>
        <ImageBackground
          source={{
            uri: article.cover_image || 'https://nobodyclimb.cc/photo/cont-intro.jpeg',
          }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          {/* 漸層遮罩 */}
          <View style={styles.gradientOverlay} />

          {/* 文章資訊 */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(600)}
            style={styles.contentContainer}
          >
            {/* 分類標籤與日期 */}
            <XStack alignItems="center" gap={SPACING[3]} marginBottom={SPACING[4]}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {getCategoryLabel(article.category)}
                </Text>
              </View>
              <Text style={styles.dateText}>{displayDate}</Text>
            </XStack>

            {/* 標題 */}
            <Text style={styles.title} numberOfLines={3}>
              {article.title}
            </Text>

            {/* 摘要 */}
            {excerpt && (
              <Text style={styles.excerpt} numberOfLines={2}>
                {excerpt}
              </Text>
            )}

            {/* 作者資訊 */}
            <XStack alignItems="center" gap={SPACING[3]} marginTop={SPACING[6]}>
              <Avatar
                size="sm"
                source={
                  article.author_avatar ? { uri: article.author_avatar } : undefined
                }
              />
              <Text style={styles.authorName}>{authorName}</Text>
            </XStack>
          </Animated.View>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  )
}

function FallbackHero() {
  return (
    <View style={styles.fallbackContainer}>
      <ImageBackground
        source={{ uri: 'https://nobodyclimb.cc/photo/cont-intro.jpeg' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.gradientOverlay} />
        <Animated.View
          entering={FadeIn.duration(700)}
          style={styles.fallbackContent}
        >
          <Text style={styles.fallbackTitle}>探索攀岩的世界</Text>
          <Text style={styles.fallbackSubtitle}>
            發現精彩故事、認識攀岩人物、探索台灣岩場
          </Text>
        </Animated.View>
      </ImageBackground>
    </View>
  )
}

export function HeroArticle() {
  const [articles, setArticles] = useState<FeaturedArticle[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  // 獲取精選文章
  useEffect(() => {
    async function fetchFeaturedArticles() {
      try {
        const response = await fetch(
          'https://api.nobodyclimb.cc/api/v1/posts/featured'
        )
        const result = await response.json()
        if (result.success && result.data && result.data.length > 0) {
          setArticles(result.data)
        } else {
          setError('目前沒有精選文章')
        }
      } catch (err) {
        console.error('Failed to fetch featured articles:', err)
        setError('無法載入精選文章')
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedArticles()
  }, [])

  // 輪播控制
  const nextSlide = useCallback(() => {
    if (articles.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % articles.length)
    }
  }, [articles.length])

  const prevSlide = useCallback(() => {
    if (articles.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + articles.length) % articles.length)
    }
  }, [articles.length])

  // 自動播放
  useEffect(() => {
    if (articles.length <= 1) return

    autoPlayRef.current = setInterval(nextSlide, 5000)

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [articles.length, nextSlide])

  // 載入狀態
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size="lg" />
      </View>
    )
  }

  // 錯誤狀態或無資料
  if (error || articles.length === 0) {
    return <FallbackHero />
  }

  return (
    <View style={styles.container}>
      {/* 文章輪播 */}
      {articles.map((article, index) => (
        <ArticleSlide
          key={article.id}
          article={article}
          isActive={index === currentSlide}
        />
      ))}

      {/* 導航點 */}
      {articles.length > 1 && (
        <XStack style={styles.dotsContainer} gap={SPACING[3]}>
          {articles.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => setCurrentSlide(index)}
              style={[
                styles.dot,
                index === currentSlide ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </XStack>
      )}

      {/* 導航箭頭 */}
      {articles.length > 1 && (
        <>
          <Pressable
            style={[styles.navButton, styles.navButtonLeft]}
            onPress={prevSlide}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </Pressable>
          <Pressable
            style={[styles.navButton, styles.navButtonRight]}
            onPress={nextSlide}
          >
            <ChevronRight size={24} color="#FFFFFF" />
          </Pressable>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  loadingContainer: {
    height: HERO_HEIGHT,
    backgroundColor: SEMANTIC_COLORS.textMain,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  slidePressable: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    // 簡化漸層效果，使用半透明黑色
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  contentContainer: {
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[16],
  },
  categoryBadge: {
    backgroundColor: BRAND_YELLOW[100],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textMain,
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 36,
    marginBottom: SPACING[4],
  },
  excerpt: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
  },
  authorName: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: SPACING[6],
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 32,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  navButtonLeft: {
    left: SPACING[4],
  },
  navButtonRight: {
    right: SPACING[4],
  },
  fallbackContainer: {
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  fallbackContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING[4],
  },
  fallbackTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING[4],
  },
  fallbackSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
})

export default HeroArticle
