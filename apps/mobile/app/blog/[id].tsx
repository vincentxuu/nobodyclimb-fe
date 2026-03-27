/**
 * 文章詳情頁面
 *
 * 對應 apps/web/src/app/blog/[id]/page.tsx
 */
import React, { useState, useCallback } from 'react'
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
import { usePost } from '@/lib/hooks'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

export default function ArticleDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isAuthenticated } = useAuthStore()

  const { data: article, isLoading, error, refetch } = usePost(id)

  const [refreshing, setRefreshing] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

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
    } catch (err) {
      console.error('Share failed:', err)
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

  if (error || !article) {
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
          <Text color="textSubtle">
            {error ? '載入文章失敗，請稍後再試' : '找不到此文章'}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const authorName = article.display_name || article.username || '匿名'
  const dateStr = article.published_at
    ? new Date(article.published_at).toLocaleDateString('zh-TW')
    : new Date(article.created_at).toLocaleDateString('zh-TW')

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
        {article.cover_image ? (
          <Image
            source={{ uri: article.cover_image }}
            style={styles.coverImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.coverImage, styles.coverPlaceholder]}>
            <Text variant="body" color="textMuted">
              {article.category || '文章'}
            </Text>
          </View>
        )}

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
                article.author_avatar
                  ? { uri: article.author_avatar }
                  : undefined
              }
            />
            <View style={styles.authorInfo}>
              <Text variant="body" fontWeight="500">
                {authorName}
              </Text>
              <View style={styles.metaRow}>
                <Calendar size={12} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" color="textMuted">
                  {dateStr}
                </Text>
                {article.view_count > 0 && (
                  <>
                    <Clock size={12} color={SEMANTIC_COLORS.textMuted} />
                    <Text variant="small" color="textMuted">
                      {article.view_count} 次瀏覽
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* 摘要 */}
          {article.excerpt ? (
            <Text variant="body" style={styles.excerptText}>
              {article.excerpt}
            </Text>
          ) : null}

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
              0
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
  coverPlaceholder: {
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
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
  excerptText: {
    lineHeight: 24,
    fontStyle: 'italic',
    color: SEMANTIC_COLORS.textSubtle,
    marginBottom: SPACING.md,
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
