/**
 * 我的文章頁面
 *
 * 對應 apps/web/src/app/profile/articles/page.tsx
 */

import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { ChevronLeft, Edit2, Eye, FileText, Plus, Trash2 } from 'lucide-react-native'
import { useCallback } from 'react'
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ProtectedRoute } from '@/components/shared'
import { Button, IconButton, Text } from '@/components/ui'
import { type Post, useDeletePost, useMyPosts } from '@/lib/hooks'

interface ArticleCardProps {
  article: Post
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
  index: number
}

function ArticleCard({ article, onPress, onEdit, onDelete, isDeleting, index }: ArticleCardProps) {
  const isDraft = article.status === 'draft'
  const isArchived = article.status === 'archived'
  const isPublished = article.status === 'published'
  const primaryTag = article.tags?.[0]
  const dateStr = new Date(article.created_at).toLocaleDateString('zh-TW')

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <Pressable
        style={({ pressed }) => [styles.articleCard, pressed && styles.articleCardPressed]}
        onPress={onPress}
      >
        {article.cover_image ? (
          <Image
            source={{ uri: article.cover_image }}
            style={styles.coverImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <FileText size={24} color={SEMANTIC_COLORS.textMuted} />
          </View>
        )}
        <View style={styles.articleContent}>
          <View style={styles.articleHeader}>
            <Text variant="body" fontWeight="600" numberOfLines={2} style={styles.articleTitle}>
              {article.title}
            </Text>
            {isDraft && (
              <View style={styles.draftBadge}>
                <Text variant="small" style={styles.draftText}>
                  草稿
                </Text>
              </View>
            )}
            {isArchived && (
              <View style={styles.archivedBadge}>
                <Text variant="small" style={styles.archivedText}>
                  已封存
                </Text>
              </View>
            )}
            {isPublished && (
              <View style={styles.publishedBadge}>
                <Text variant="small" style={styles.publishedText}>
                  已發布
                </Text>
              </View>
            )}
          </View>
          {primaryTag ? (
            <Text variant="small" color="textMuted" numberOfLines={1}>
              {primaryTag}
            </Text>
          ) : null}
          {article.excerpt ? (
            <Text variant="small" color="textMuted" numberOfLines={1} style={styles.articleExcerpt}>
              {article.excerpt}
            </Text>
          ) : (
            <Text variant="small" color="textMuted" numberOfLines={1} style={styles.articleExcerpt}>
              尚無摘要
            </Text>
          )}
          <View style={styles.articleMeta}>
            <Text variant="small" color="textMuted">
              {dateStr}
            </Text>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Eye size={12} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" color="textMuted">
                  {article.view_count}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.articleActions}>
            <Button variant="secondary" size="sm" onPress={onEdit} leftIcon={Edit2}>
              編輯
            </Button>
            <Button variant="outline" size="sm" onPress={onPress}>
              查看
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={onDelete}
              leftIcon={Trash2}
              loading={isDeleting}
              style={styles.deleteButton}
            >
              刪除
            </Button>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

export default function ArticlesScreen() {
  const router = useRouter()

  const { data, isLoading, error, refetch, isRefetching } = useMyPosts()
  const deleteMutation = useDeletePost()
  const articles = data?.posts ?? []

  const handleBack = () => {
    router.back()
  }

  const handleCreateArticle = () => {
    router.push('/blog/create')
  }

  const handleArticlePress = useCallback(
    (article: Post) => {
      router.push(`/blog/${article.id}` as any)
    },
    [router]
  )

  const handleEditArticle = useCallback(
    (article: Post) => {
      router.push(`/blog/edit/${article.id}` as any)
    },
    [router]
  )

  const handleDeleteArticle = useCallback(
    (article: Post) => {
      Alert.alert('刪除文章', `確定要刪除「${article.title}」嗎？此操作無法復原。`, [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(article.id, {
              onSuccess: () => {
                Alert.alert('刪除成功', '文章已刪除')
              },
              onError: (deleteError) => {
                const message = deleteError instanceof Error ? deleteError.message : '請稍後再試'
                Alert.alert('刪除失敗', message)
              },
            })
          },
        },
      ])
    },
    [deleteMutation]
  )

  const renderItem = ({ item, index }: { item: Post; index: number }) => (
    <ArticleCard
      article={item}
      onPress={() => handleArticlePress(item)}
      onEdit={() => handleEditArticle(item)}
      onDelete={() => handleDeleteArticle(item)}
      isDeleting={deleteMutation.isPending && deleteMutation.variables === item.id}
      index={index}
    />
  )

  const publishedCount = articles.filter((a) => a.status === 'published').length
  const draftCount = articles.filter((a) => a.status === 'draft').length

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 標題區 */}
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
          <Text variant="h3" fontWeight="600">
            我的文章
          </Text>
          <IconButton
            icon={<Plus size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleCreateArticle}
            variant="ghost"
          />
        </View>

        {/* 統計 */}
        <View style={styles.statsBar}>
          <View style={styles.statBox}>
            <Text variant="h4" fontWeight="700">
              {publishedCount}
            </Text>
            <Text variant="small" color="textMuted">
              已發布
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text variant="h4" fontWeight="700">
              {draftCount}
            </Text>
            <Text variant="small" color="textMuted">
              草稿
            </Text>
          </View>
        </View>

        {/* 文章列表 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Text variant="body" color="textSubtle" style={styles.emptyText}>
              載入文章失敗，請稍後再試
            </Text>
            <Button variant="primary" onPress={() => refetch()} loading={isRefetching}>
              重新載入
            </Button>
          </View>
        ) : articles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={48} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="body" color="textSubtle" style={styles.emptyText}>
              還沒有文章
            </Text>
            <Text variant="small" color="textMuted">
              點擊右上角開始寫作
            </Text>
            <Button variant="primary" onPress={handleCreateArticle} leftIcon={Edit2}>
              寫第一篇文章
            </Button>
          </View>
        ) : (
          <FlatList
            data={articles}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
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
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
  },
  listContent: {
    padding: SPACING.md,
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  articleCardPressed: {
    backgroundColor: '#F5F5F5',
  },
  coverImage: {
    width: 80,
    height: 60,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F5F5F5',
  },
  coverPlaceholder: {
    width: 80,
    height: 60,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleContent: {
    flex: 1,
    gap: 2,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
  },
  articleTitle: {
    flex: 1,
  },
  draftBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  draftText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '600',
  },
  archivedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  archivedText: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '600',
  },
  publishedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  publishedText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '600',
  },
  articleExcerpt: {
    marginTop: 2,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  articleActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  deleteButton: {
    borderColor: '#FCA5A5',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
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
})
