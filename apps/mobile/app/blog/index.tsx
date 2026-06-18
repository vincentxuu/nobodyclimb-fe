/**
 * 部落格列表頁面
 *
 * 對應 apps/web/src/app/blog/page.tsx
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import type { PostCategory } from '@nobodyclimb/types'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Calendar, ChevronLeft, Plus, Tag, User, X } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Card, IconButton, SearchInput, Text } from '@/components/ui'
import { type Post, usePosts } from '@/lib/hooks'
import { POST_CATEGORIES } from '@/lib/hooks/usePosts'
import { useAuthStore } from '@/store/authStore'

const PAGE_SIZE = 9

function getCategoryLabel(value: string | null | undefined): string {
  if (!value) return '未分類'
  return POST_CATEGORIES.find((category) => category.value === value)?.label || value
}

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
  const { tag, category } = useLocalSearchParams<{ tag?: string; category?: string }>()
  const { isAuthenticated } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | null>(
    (typeof category === 'string' ? (category as PostCategory) : null) ?? null
  )
  const [page, setPage] = useState(1)
  const [articles, setArticles] = useState<Post[]>([])

  const { data, isLoading, isFetching, error } = usePosts(page, PAGE_SIZE)
  const pagination = data?.pagination
  const hasMore = pagination ? pagination.page < pagination.total_pages : false

  useEffect(() => {
    if (typeof category === 'string') {
      setSelectedCategory(category as PostCategory)
    } else {
      setSelectedCategory(null)
    }
  }, [category])

  useEffect(() => {
    if (!data?.posts) return
    if (page === 1) {
      setArticles(data.posts)
      return
    }
    setArticles((prev) => {
      const existingIds = new Set(prev.map((article) => article.id))
      const nextArticles = data.posts.filter((article) => !existingIds.has(article.id))
      return [...prev, ...nextArticles]
    })
  }, [data?.posts, page])

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

  const activeTag = typeof tag === 'string' ? decodeURIComponent(tag) : ''
  const activeCategory = selectedCategory ?? null

  const handleCategoryChange = (nextCategory: PostCategory | null) => {
    setSelectedCategory(nextCategory)
    setPage(1)
    setArticles([])
    router.setParams({ category: nextCategory ?? undefined, tag: undefined })
  }

  const handleClearFilters = () => {
    setSelectedCategory(null)
    setPage(1)
    setArticles([])
    router.setParams({ tag: undefined, category: undefined })
  }

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.display_name || article.username || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    const matchesTag = activeTag ? article.tags?.includes(activeTag) : true
    const matchesCategory = activeCategory ? article.category === activeCategory : true
    return matchesSearch && matchesTag && matchesCategory
  })

  const handleLoadMore = () => {
    if (!isFetching && hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  const renderItem = ({ item, index }: { item: Post; index: number }) => (
    <ArticleCard article={item} onPress={() => handleArticlePress(item.id)} index={index} />
  )

  const categoryButtons: Array<{ value: PostCategory | null; label: string }> = [
    { value: null, label: '所有文章' },
    ...POST_CATEGORIES,
  ]

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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categoryButtons.map((item) => {
            const selected = selectedCategory === item.value
            return (
              <Pressable
                key={item.value ?? 'all'}
                style={[styles.categoryChip, selected && styles.categoryChipActive]}
                onPress={() => handleCategoryChange(item.value)}
              >
                <Text
                  variant="small"
                  fontWeight="600"
                  style={selected ? styles.categoryChipTextActive : styles.categoryChipText}
                >
                  {item.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {activeTag || activeCategory ? (
          <View style={styles.activeFilters}>
            <View style={styles.filterChip}>
              <Tag size={14} color={SEMANTIC_COLORS.textSubtle} />
              <Text variant="small" color="textSubtle">
                {activeTag || getCategoryLabel(activeCategory)}
              </Text>
            </View>
            <Pressable onPress={handleClearFilters} style={styles.clearFilterButton}>
              <X size={14} color={SEMANTIC_COLORS.textMuted} />
              <Text variant="small" color="textMuted">
                清除
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* 列表 */}
      {isLoading && page === 1 ? (
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
          ListFooterComponent={
            filteredArticles.length > 0 ? (
              <View style={styles.loadMoreContainer}>
                {hasMore ? (
                  <Button variant="outline" onPress={handleLoadMore} loading={isFetching}>
                    載入更多
                  </Button>
                ) : (
                  <Text variant="small" color="textMuted">
                    已顯示全部文章
                  </Text>
                )}
              </View>
            ) : null
          }
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
  categoryList: {
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingTop: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D3D3D3',
    backgroundColor: '#FFFFFF',
  },
  categoryChipActive: {
    borderColor: SEMANTIC_COLORS.textMain,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  categoryChipText: {
    color: SEMANTIC_COLORS.textSubtle,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  activeFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.xs,
    marginTop: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
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
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
})
