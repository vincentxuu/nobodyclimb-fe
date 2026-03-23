/**
 * 我的文章頁面
 *
 * 對應 apps/web/src/app/profile/articles/page.tsx
 */
import React, { useCallback } from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  Eye,
  Heart,
  MessageCircle,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, IconButton } from '@/components/ui'
import { ProtectedRoute } from '@/components/shared'
import { useMyPosts, type Post } from '@/lib/hooks'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface ArticleCardProps {
  article: Post
  onPress: () => void
  index: number
}

function ArticleCard({ article, onPress, index }: ArticleCardProps) {
  const isDraft = article.status === 'draft'
  const dateStr = article.published_at
    ? new Date(article.published_at).toLocaleDateString('zh-TW')
    : new Date(article.created_at).toLocaleDateString('zh-TW')

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <Pressable
        style={({ pressed }) => [
          styles.articleCard,
          pressed && styles.articleCardPressed,
        ]}
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
            <Text
              variant="body"
              fontWeight="600"
              numberOfLines={2}
              style={styles.articleTitle}
            >
              {article.title}
            </Text>
            {isDraft && (
              <View style={styles.draftBadge}>
                <Text variant="small" style={styles.draftText}>
                  草稿
                </Text>
              </View>
            )}
          </View>
          {article.excerpt ? (
            <Text
              variant="small"
              color="textMuted"
              numberOfLines={1}
              style={styles.articleExcerpt}
            >
              {article.excerpt}
            </Text>
          ) : null}
          <View style={styles.articleMeta}>
            <Text variant="small" color="textMuted">
              {dateStr}
            </Text>
            {!isDraft && (
              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Eye size={12} color={SEMANTIC_COLORS.textMuted} />
                  <Text variant="small" color="textMuted">
                    {article.view_count}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
        <ChevronRight size={18} color={SEMANTIC_COLORS.textMuted} />
      </Pressable>
    </Animated.View>
  )
}

export default function ArticlesScreen() {
  const router = useRouter()

  const { data, isLoading, error } = useMyPosts()
  const articles = data?.posts ?? []

  const handleBack = () => {
    router.back()
  }

  const handleCreateArticle = () => {
    router.push('/blog/create')
  }

  const handleArticlePress = useCallback(
    (article: Post) => {
      if (article.status === 'draft') {
        // 導航到編輯頁面
        router.push(`/blog/create?id=${article.id}` as any)
      } else {
        router.push(`/blog/${article.id}` as any)
      }
    },
    [router]
  )

  const renderItem = ({ item, index }: { item: Post; index: number }) => (
    <ArticleCard
      article={item}
      onPress={() => handleArticlePress(item)}
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
  articleExcerpt: {
    marginTop: 2,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
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
