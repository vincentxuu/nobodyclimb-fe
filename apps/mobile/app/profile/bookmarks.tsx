/**
 * 收藏頁面
 *
 * 對應 apps/web/src/app/profile/bookmarks/page.tsx
 * 使用 GET /posts/liked 取得用戶按讚/收藏的文章
 */

import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Bookmark, ChevronLeft, ChevronRight, FileText } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ProtectedRoute } from '@/components/shared'
import { Button, IconButton, Text } from '@/components/ui'
import { type BookmarkedPost, useBookmarks, useRemoveBookmark } from '@/lib/hooks'

const ITEMS_PER_PAGE = 10

interface BookmarkCardProps {
  item: BookmarkedPost
  onPress: () => void
  onRemove: () => void
  isRemoving: boolean
  index: number
}

function BookmarkCard({ item, onPress, onRemove, isRemoving, index }: BookmarkCardProps) {
  const formattedDate =
    item.published_at || item.created_at
      ? new Date(item.published_at || item.created_at).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null
  const authorName = item.display_name || item.username || '匿名'
  const excerpt = item.excerpt || item.content?.slice(0, 100)
  const category = item.tags?.[0] || item.category || '未分類'

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <Pressable
        style={({ pressed }) => [styles.bookmarkItem, pressed && styles.bookmarkItemPressed]}
        onPress={onPress}
      >
        {item.cover_image ? (
          <Image
            source={{ uri: item.cover_image }}
            style={styles.bookmarkImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.bookmarkIconContainer}>
            <FileText size={24} color={SEMANTIC_COLORS.textSubtle} />
          </View>
        )}
        <View style={styles.bookmarkContent}>
          <Text variant="body" fontWeight="500" numberOfLines={2}>
            {item.title}
          </Text>
          <Text variant="small" color="textMuted">
            {authorName}
          </Text>
          {excerpt && (
            <Text variant="small" color="textSubtle" numberOfLines={2} style={styles.excerpt}>
              {excerpt}
            </Text>
          )}
          {formattedDate && (
            <Text variant="small" color="textMuted">
              {formattedDate}
            </Text>
          )}
          <View style={styles.cardActions}>
            <Button variant="secondary" size="sm" onPress={onRemove} loading={isRemoving}>
              移除收藏
            </Button>
          </View>
        </View>
        <View style={styles.typeBadge}>
          <Text variant="small" color="textMuted">
            {category}
          </Text>
        </View>
        <ChevronRight size={18} color={SEMANTIC_COLORS.textMuted} />
      </Pressable>
    </Animated.View>
  )
}

export default function BookmarksScreen() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([])
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  const { data, isLoading, isFetching, isError, refetch } = useBookmarks(page, ITEMS_PER_PAGE)
  const removeMutation = useRemoveBookmark()
  const pagination = data?.pagination
  const totalCount = pagination?.total ?? bookmarks.length
  const hasMore = page < (pagination?.total_pages ?? 1)

  const handleBack = () => {
    router.back()
  }

  const handleBrowseBlog = () => {
    router.push('/blog')
  }

  useEffect(() => {
    if (!data?.posts) return

    setBookmarks((prev) => {
      if (page === 1) return data.posts

      const existingIds = new Set(prev.map((post) => post.id))
      const nextPosts = data.posts.filter((post) => !existingIds.has(post.id))
      return [...prev, ...nextPosts]
    })
  }, [data?.posts, page])

  const handleBookmarkPress = useCallback(
    (item: BookmarkedPost) => {
      router.push(`/blog/${item.slug || item.id}` as any)
    },
    [router]
  )

  const handleRetry = useCallback(() => {
    setPage(1)
    setBookmarks([])
    refetch()
  }, [refetch])

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isFetching) return
    setPage((current) => current + 1)
  }, [hasMore, isFetching])

  const handleRemoveBookmark = useCallback(
    (item: BookmarkedPost) => {
      Alert.alert('移除收藏', `確定要從收藏移除「${item.title}」嗎？`, [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: () => {
            setRemovingIds((current) => new Set(current).add(item.id))
            removeMutation.mutate(item.id, {
              onSuccess: () => {
                setBookmarks((current) => current.filter((post) => post.id !== item.id))
              },
              onError: (error) => {
                const message = error instanceof Error ? error.message : '請稍後再試'
                Alert.alert('移除失敗', message)
              },
              onSettled: () => {
                setRemovingIds((current) => {
                  const next = new Set(current)
                  next.delete(item.id)
                  return next
                })
              },
            })
          },
        },
      ])
    },
    [removeMutation]
  )

  const renderItem = ({ item, index }: { item: BookmarkedPost; index: number }) => (
    <BookmarkCard
      item={item}
      onPress={() => handleBookmarkPress(item)}
      onRemove={() => handleRemoveBookmark(item)}
      isRemoving={removingIds.has(item.id)}
      index={index}
    />
  )

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 導航列 */}
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
          <Text variant="h3" fontWeight="600">
            {totalCount > 0 ? `我的收藏 (${totalCount})` : '我的收藏'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* 列表 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
          </View>
        ) : isError ? (
          <View style={styles.emptyContainer}>
            <Bookmark size={48} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="body" color="textSubtle" style={styles.emptyText}>
              載入失敗，請重試
            </Text>
            <Pressable onPress={handleRetry}>
              <Text variant="body" color="textMain" fontWeight="600">
                重試
              </Text>
            </Pressable>
          </View>
        ) : bookmarks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bookmark size={48} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="body" color="textSubtle" style={styles.emptyText}>
              還沒有收藏
            </Text>
            <Button variant="primary" onPress={handleBrowseBlog}>
              瀏覽文章
            </Button>
          </View>
        ) : (
          <FlatList
            data={bookmarks}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListFooterComponent={
              hasMore ? (
                <View style={styles.loadMoreContainer}>
                  <Text variant="small" color="textMuted">
                    已顯示 {bookmarks.length} / {totalCount} 篇
                  </Text>
                  <Button
                    variant="secondary"
                    size="md"
                    onPress={handleLoadMore}
                    loading={isFetching && !isLoading}
                    style={styles.loadMoreButton}
                  >
                    載入更多
                  </Button>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </ProtectedRoute>
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
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: SPACING.md,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  bookmarkItemPressed: {
    backgroundColor: '#F5F5F5',
  },
  bookmarkImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  bookmarkIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkContent: {
    flex: 1,
    gap: 4,
  },
  excerpt: {
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  typeBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    marginTop: SPACING.sm,
  },
  loadMoreContainer: {
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  loadMoreButton: {
    minWidth: 160,
  },
})
