/**
 * 部落格列表頁面
 *
 * 對應 apps/web/src/app/blog/page.tsx
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Calendar, ChevronLeft, Plus, User } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Card, IconButton, SearchInput, Text } from '@/components/ui'
import { type Post, usePosts } from '@/lib/hooks'
import { useAuthStore } from '@/store/authStore'

interface ArticleCardProps {
  article: Post
  onPress: () => void
  index: number
}

function ArticleCard({ article, onPress, index }: ArticleCardProps) {
  const authorName = article.display_name || article.username || '匿名'
  const dateStr = article.published_at
    ? new Date(article.published_at).toLocaleDateString('zh-TW')
    : new Date(article.created_at).toLocaleDateString('zh-TW')

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 100)}>
      <Pressable onPress={onPress}>
        <Card style={styles.articleCard}>
          {article.cover_image ? (
            <Image
              source={{ uri: article.cover_image }}
              style={styles.coverImage}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <Text variant="small" color="textMuted">
                {article.category || '文章'}
              </Text>
            </View>
          )}
          <View style={styles.articleContent}>
            <Text variant="body" fontWeight="600" numberOfLines={2}>
              {article.title}
            </Text>
            {article.excerpt ? (
              <Text variant="small" color="textSubtle" numberOfLines={2} style={styles.excerpt}>
                {article.excerpt}
              </Text>
            ) : null}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <User size={12} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" color="textMuted">
                  {authorName}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Calendar size={12} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" color="textMuted">
                  {dateStr}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  )
}

export default function BlogListScreen() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading, error } = usePosts(1, 50)
  const articles = data?.posts ?? []

  const handleBack = () => {
    router.back()
  }

  const handleArticlePress = useCallback(
    (id: string) => {
      router.push(`/blog/${id}` as any)
    },
    [router]
  )

  const handleCreate = () => {
    router.push('/blog/create' as any)
  }

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.display_name || article.username || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  )

  const renderItem = ({ item, index }: { item: Post; index: number }) => (
    <ArticleCard article={item} onPress={() => handleArticlePress(item.id)} index={index} />
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 標題區 */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
          <Text variant="h3" fontWeight="600">
            文章
          </Text>
          {isAuthenticated ? (
            <IconButton
              icon={<Plus size={24} color={SEMANTIC_COLORS.textMain} />}
              onPress={handleCreate}
              variant="ghost"
            />
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        <SearchInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="搜尋文章..."
          style={styles.searchInput}
        />
      </View>

      {/* 列表 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text color="textSubtle">載入文章失敗，請稍後再試</Text>
        </View>
      ) : (
        <FlatList
          data={filteredArticles}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text color="textSubtle">
                {searchTerm ? `找不到符合「${searchTerm}」的文章` : '暫無文章'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  header: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  placeholder: {
    width: 40,
  },
  searchInput: {
    marginHorizontal: SPACING.xs,
  },
  listContent: {
    padding: SPACING.md,
  },
  separator: {
    height: SPACING.md,
  },
  articleCard: {
    overflow: 'hidden',
    padding: 0,
  },
  coverImage: {
    width: '100%',
    height: 160,
  },
  coverPlaceholder: {
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleContent: {
    padding: SPACING.md,
  },
  excerpt: {
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    paddingVertical: SPACING.xxl,
  },
})
