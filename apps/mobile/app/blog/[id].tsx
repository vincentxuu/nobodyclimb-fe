/**
 * 文章詳情頁面
 *
 * 對應 apps/web/src/app/blog/[id]/page.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Share,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ChevronLeft,
  Share2,
  Calendar,
  User,
  Clock,
  Heart,
  MessageCircle,
  Bookmark,
} from 'lucide-react-native'

import { Text, IconButton, Avatar, Divider } from '@/components/ui'
import { CommentSection } from '@/components/blog'
import { useAuthStore } from '@/store/authStore'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface ArticleDetail {
  id: string
  title: string
  content: string
  author: {
    name: string
    avatar?: string
  }
  publishedAt: string
  readTime: string
  coverImage: string
  likeCount: number
  commentCount: number
  isLiked?: boolean
  isBookmarked?: boolean
}

export default function ArticleDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isAuthenticated } = useAuthStore()

  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const loadArticle = useCallback(async () => {
    if (!id) return

    setIsLoading(true)
    try {
      // TODO: 整合 articleService
      await new Promise((resolve) => setTimeout(resolve, 500))
      setArticle({
        id,
        title: '攀岩入門指南：從零開始的完整攻略',
        content: `
攀岩是一項結合力量、技巧和心理素質的運動。無論你是完全的新手，還是想要更深入了解這項運動，這篇指南都將為你提供所需的基礎知識。

## 什麼是攀岩？

攀岩是指使用手腳攀爬岩壁或人工岩牆的運動。現代攀岩分為多種類型：

1. **抱石 (Bouldering)** - 在較低的岩壁上攀爬，不使用繩索保護
2. **運動攀岩 (Sport Climbing)** - 使用預先固定的錨點和繩索保護
3. **傳統攀岩 (Trad Climbing)** - 自行放置保護裝備

## 開始前的準備

### 裝備
- 攀岩鞋：最重要的裝備，選擇合腳的款式
- 粉袋：用於吸收手汗
- 安全吊帶：如果進行上攀

### 找一家好岩館
選擇離家近、環境友善的岩館開始練習。大多數岩館都提供入門課程和裝備租借。

## 基本技巧

1. **用腳攀爬**：腳的力量比手大得多
2. **保持身體貼近牆壁**：減少手臂負擔
3. **觀察路線**：在開始前先規劃動作

祝你攀岩愉快！
        `.trim(),
        author: {
          name: '攀岩小編',
          avatar: 'https://picsum.photos/100?random=50',
        },
        publishedAt: '2024-01-20',
        readTime: '8 分鐘',
        coverImage: 'https://picsum.photos/800/400?random=30',
        likeCount: 42,
        commentCount: 8,
      })
      setLikeCount(42)
    } catch (err) {
      console.error('Failed to load article:', err)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadArticle()
  }, [loadArticle])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadArticle()
    setRefreshing(false)
  }, [loadArticle])

  const handleBack = () => {
    router.back()
  }

  const handleShare = async () => {
    if (!article) return
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\nhttps://nobodyclimb.cc/blog/${article.id}`,
      })
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
        </View>
      </SafeAreaView>
    )
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
        </View>
        <View style={styles.errorContainer}>
          <Text color="textSubtle">找不到此文章</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 導航列 */}
      <View style={styles.header}>
        <IconButton
          icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleBack}
          variant="ghost"
        />
        <View style={styles.headerActions}>
          <IconButton
            icon={
              <Bookmark
                size={20}
                color={isBookmarked ? '#FFE70C' : SEMANTIC_COLORS.textMain}
                fill={isBookmarked ? '#FFE70C' : 'transparent'}
              />
            }
            onPress={handleBookmark}
            variant="ghost"
          />
          <IconButton
            icon={<Share2 size={20} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleShare}
            variant="ghost"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* 封面圖 */}
        <Image
          source={{ uri: article.coverImage }}
          style={styles.coverImage}
          contentFit="cover"
        />

        {/* 文章內容 */}
        <View style={styles.content}>
          {/* 標題 */}
          <Text variant="h2" fontWeight="700">
            {article.title}
          </Text>

          {/* 作者資訊 */}
          <View style={styles.authorRow}>
            <Avatar
              size="sm"
              source={
                article.author.avatar
                  ? { uri: article.author.avatar }
                  : undefined
              }
            />
            <View style={styles.authorInfo}>
              <Text variant="body" fontWeight="500">
                {article.author.name}
              </Text>
              <View style={styles.metaRow}>
                <Calendar size={12} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" color="textMuted">
                  {article.publishedAt}
                </Text>
                <Clock size={12} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" color="textMuted">
                  {article.readTime}
                </Text>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* 文章內容 */}
          <Text variant="body" style={styles.articleText}>
            {article.content}
          </Text>

          <Divider style={styles.divider} />

          {/* 互動列 */}
          <View style={styles.interactionRow}>
            <IconButton
              icon={
                <Heart
                  size={22}
                  color={isLiked ? '#EF4444' : SEMANTIC_COLORS.textSubtle}
                  fill={isLiked ? '#EF4444' : 'transparent'}
                />
              }
              onPress={handleLike}
              variant="ghost"
            />
            <Text variant="body" color="textSubtle">
              {likeCount}
            </Text>

            <View style={styles.interactionSpacer} />

            <MessageCircle size={22} color={SEMANTIC_COLORS.textSubtle} />
            <Text variant="body" color="textSubtle">
              {article.commentCount}
            </Text>
          </View>

          {/* 評論區塊 */}
          <CommentSection postId={article.id} isLoggedIn={isAuthenticated} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  authorInfo: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: 2,
  },
  divider: {
    marginVertical: SPACING.md,
  },
  articleText: {
    lineHeight: 26,
    color: SEMANTIC_COLORS.textMain,
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  interactionSpacer: {
    width: SPACING.md,
  },
  bottomPadding: {
    height: SPACING.xxl,
  },
})
