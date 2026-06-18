/**
 * 文章詳情頁面
 *
 * 對應 apps/web/src/app/blog/[id]/page.tsx
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  Bookmark,
  Calendar,
  ChevronLeft,
  Clock,
  MessageCircle,
  Mountain,
  Pencil,
  Share2,
} from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArticleHtmlContent, CommentSection } from '@/components/blog'
import { ArticleCoverGenerator } from '@/components/shared'
import { Avatar, Divider, IconButton, Text, useToast } from '@/components/ui'
import { apiClient } from '@/lib/api'
import {
  type Post,
  usePopularPosts,
  usePost,
  usePostBookmarkStatus,
  usePostLikeStatus,
  useRelatedPosts,
  useTogglePostBookmark,
  useTogglePostLike,
} from '@/lib/hooks'
import { useAuthStore } from '@/store/authStore'

interface InteractorUser {
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

function plainText(content?: string | null, maxLength = 120) {
  if (!content) return ''
  const text = content
    .replace(/\\n/g, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function ArticleRecommendationCard({ article, onPress }: { article: Post; onPress: () => void }) {
  const dateStr = article.published_at
    ? new Date(article.published_at).toLocaleDateString('zh-TW')
    : new Date(article.created_at).toLocaleDateString('zh-TW')
  const chipLabel = article.tags?.[0] || article.category || '文章'

  return (
    <Pressable onPress={onPress} style={styles.recommendationCard}>
      {article.cover_image ? (
        <Image
          source={{ uri: article.cover_image }}
          style={styles.recommendationImage}
          contentFit="cover"
        />
      ) : (
        <ArticleCoverGenerator
          category={article.category}
          title={article.title}
          showIcon={false}
          showTitle={false}
          style={styles.recommendationImage}
        />
      )}
      <View style={styles.recommendationContent}>
        <Text variant="body" fontWeight="600" numberOfLines={2}>
          {article.title}
        </Text>
        <View style={styles.recommendationMeta}>
          <View style={styles.smallChip}>
            <Text variant="caption" color="textSubtle">
              {chipLabel}
            </Text>
          </View>
          <Text variant="caption" color="textMuted">
            {dateStr}
          </Text>
        </View>
        <Text variant="small" color="textSubtle" numberOfLines={2}>
          {plainText(article.excerpt || article.content)}
        </Text>
      </View>
    </Pressable>
  )
}

export default function ArticleDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const toast = useToast()
  const { isAuthenticated, user } = useAuthStore()

  const { data: article, isLoading, error, refetch } = usePost(id)
  const { data: likeStatus } = usePostLikeStatus(id, isAuthenticated)
  const { data: bookmarkStatus } = usePostBookmarkStatus(id, isAuthenticated)
  const { data: relatedArticles = [], refetch: refetchRelatedArticles } = useRelatedPosts(id, 3)
  const { data: popularArticles = [], refetch: refetchPopularArticles } = usePopularPosts(4)
  const togglePostLike = useTogglePostLike()
  const togglePostBookmark = useTogglePostBookmark()

  const [refreshing, setRefreshing] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [isLikersOpen, setIsLikersOpen] = useState(false)
  const [likers, setLikers] = useState<InteractorUser[]>([])
  const [isLoadingLikers, setIsLoadingLikers] = useState(false)

  useEffect(() => {
    if (!likeStatus) return
    setIsLiked(likeStatus.liked)
    setLikeCount(likeStatus.likes)
  }, [likeStatus])

  useEffect(() => {
    if (!bookmarkStatus) return
    setIsBookmarked(bookmarkStatus.bookmarked)
    setBookmarkCount(bookmarkStatus.bookmarks)
  }, [bookmarkStatus])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetch(), refetchRelatedArticles(), refetchPopularArticles()])
    setRefreshing(false)
  }, [refetch, refetchPopularArticles, refetchRelatedArticles])

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

  const requireSignIn = () => {
    if (isAuthenticated) return true
    router.push('/auth/login' as never)
    return false
  }

  const handleLike = async () => {
    if (!id || togglePostLike.isPending || !requireSignIn()) return

    const previousLiked = isLiked
    const previousCount = likeCount
    setIsLiked(!previousLiked)
    setLikeCount((prev) => Math.max(0, previousLiked ? prev - 1 : prev + 1))

    try {
      const next = await togglePostLike.mutateAsync(id)
      setIsLiked(next.liked)
      setLikeCount(next.likes)
      setLikers([])
    } catch (err) {
      console.error('Toggle post like failed:', err)
      setIsLiked(previousLiked)
      setLikeCount(previousCount)
      toast.show({ message: '按讚失敗，請稍後再試', variant: 'error' })
    }
  }

  const handleShowLikers = async () => {
    if (!id || likeCount === 0) return

    const nextOpen = !isLikersOpen
    setIsLikersOpen(nextOpen)
    if (!nextOpen || likers.length > 0) return

    setIsLoadingLikers(true)
    try {
      const response = await apiClient.get(`/posts/${id}/likers`)
      setLikers(response.data?.data?.likers ?? [])
    } catch (err) {
      console.error('Failed to fetch post likers:', err)
      toast.show({ message: '載入按讚者失敗，請稍後再試', variant: 'error' })
    } finally {
      setIsLoadingLikers(false)
    }
  }

  const handleBookmark = async () => {
    if (!id || togglePostBookmark.isPending || !requireSignIn()) return

    const previousBookmarked = isBookmarked
    const previousCount = bookmarkCount
    setIsBookmarked(!previousBookmarked)
    setBookmarkCount((prev) => Math.max(0, previousBookmarked ? prev - 1 : prev + 1))

    try {
      const next = await togglePostBookmark.mutateAsync(id)
      setIsBookmarked(next.bookmarked)
      setBookmarkCount(next.bookmarks)
    } catch (err) {
      console.error('Toggle post bookmark failed:', err)
      setIsBookmarked(previousBookmarked)
      setBookmarkCount(previousCount)
      toast.show({ message: '收藏失敗，請稍後再試', variant: 'error' })
    }
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
          <Text color="textSubtle">{error ? '載入文章失敗，請稍後再試' : '找不到此文章'}</Text>
        </View>
      </SafeAreaView>
    )
  }

  const authorName = article.display_name || article.username || '匿名'
  const isAuthor = user?.id === article.author_id
  const dateStr = article.published_at
    ? new Date(article.published_at).toLocaleDateString('zh-TW')
    : new Date(article.created_at).toLocaleDateString('zh-TW')
  const visiblePopularArticles = popularArticles.filter((item) => item.id !== article.id)

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
          {isAuthor ? (
            <IconButton
              icon={<Pencil size={20} color={SEMANTIC_COLORS.textMain} />}
              onPress={() => router.push(`/blog/edit/${article.id}` as never)}
              variant="ghost"
            />
          ) : null}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* 封面圖 */}
        {article.cover_image ? (
          <Image
            source={{ uri: article.cover_image }}
            style={styles.coverImage}
            contentFit="cover"
          />
        ) : (
          <ArticleCoverGenerator
            category={article.category}
            title={article.title}
            style={styles.coverImage}
          />
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
              source={article.author_avatar ? { uri: article.author_avatar } : undefined}
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
          <ArticleHtmlContent html={article.content} />

          {article.tags && article.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {article.tags.map((tag) => (
                <Pressable
                  key={tag}
                  style={styles.tagChip}
                  onPress={() => router.push(`/blog?tag=${encodeURIComponent(tag)}` as never)}
                >
                  <Text variant="small" color="textSubtle">
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Divider style={styles.divider} />

          {/* 互動列 */}
          <View style={styles.interactionRow}>
            <IconButton
              icon={
                <Mountain
                  size={22}
                  color={isLiked ? '#059669' : SEMANTIC_COLORS.textSubtle}
                  fill={isLiked ? '#059669' : 'transparent'}
                />
              }
              onPress={handleLike}
              variant="ghost"
            />
            <Pressable
              onPress={handleShowLikers}
              disabled={likeCount === 0}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text variant="body" color={isLiked ? 'success' : 'textSubtle'}>
                {likeCount}
              </Text>
            </Pressable>

            <View style={styles.interactionSpacer} />

            <IconButton
              icon={
                <Bookmark
                  size={22}
                  color={isBookmarked ? '#D97706' : SEMANTIC_COLORS.textSubtle}
                  fill={isBookmarked ? '#D97706' : 'transparent'}
                />
              }
              onPress={handleBookmark}
              variant="ghost"
            />
            <Text variant="body" color="textSubtle">
              {bookmarkCount}
            </Text>

            <View style={styles.interactionSpacer} />

            <MessageCircle size={22} color={SEMANTIC_COLORS.textSubtle} />
            <Text variant="body" color="textSubtle">
              {commentCount}
            </Text>
          </View>

          {isLikersOpen ? (
            <View style={styles.interactorsPanel}>
              {isLoadingLikers ? (
                <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMuted} />
              ) : likers.length > 0 ? (
                <View style={styles.interactorsList}>
                  {likers.map((liker) => {
                    const displayName = liker.display_name || liker.username
                    return (
                      <Pressable
                        key={liker.user_id}
                        style={styles.interactorChip}
                        onPress={() => router.push(`/biography/profile/${liker.username}` as never)}
                      >
                        <Avatar
                          size="xs"
                          source={liker.avatar_url ? { uri: liker.avatar_url } : undefined}
                          alt={displayName}
                        />
                        <Text variant="caption" color="textSubtle" numberOfLines={1}>
                          {displayName}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              ) : (
                <Text variant="caption" color="textMuted" style={styles.interactorsEmpty}>
                  還沒有人按讚
                </Text>
              )}
            </View>
          ) : null}

          {/* 評論區塊 */}
          <CommentSection
            postId={article.id}
            isLoggedIn={isAuthenticated}
            onCommentCountChange={setCommentCount}
          />
        </View>

        {relatedArticles.length > 0 ? (
          <View style={styles.recommendationSection}>
            <Text variant="h4" fontWeight="600" style={styles.recommendationTitle}>
              相關文章
            </Text>
            <View style={styles.recommendationList}>
              {relatedArticles.map((relatedArticle) => (
                <ArticleRecommendationCard
                  key={relatedArticle.id}
                  article={relatedArticle}
                  onPress={() => router.push(`/blog/${relatedArticle.id}` as never)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {visiblePopularArticles.length > 0 ? (
          <View style={styles.recommendationSection}>
            <Text variant="h4" fontWeight="600" style={styles.recommendationTitle}>
              熱門文章
            </Text>
            <View style={styles.recommendationList}>
              {visiblePopularArticles.map((popularArticle) => (
                <ArticleRecommendationCard
                  key={popularArticle.id}
                  article={popularArticle}
                  onPress={() => router.push(`/blog/${popularArticle.id}` as never)}
                />
              ))}
            </View>
          </View>
        ) : null}

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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  tagChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  interactionSpacer: {
    width: SPACING.md,
  },
  interactorsPanel: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#EBEAEA',
  },
  interactorsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  interactorChip: {
    maxWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  interactorsEmpty: {
    textAlign: 'center',
    paddingVertical: SPACING.xs,
  },
  recommendationSection: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  recommendationTitle: {
    marginBottom: SPACING.sm,
  },
  recommendationList: {
    gap: SPACING.sm,
  },
  recommendationCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  recommendationImage: {
    width: 112,
    minHeight: 112,
  },
  recommendationContent: {
    flex: 1,
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  smallChip: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  bottomPadding: {
    height: SPACING.xxl,
  },
})
