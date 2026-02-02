/**
 * 部落格列表頁面
 *
 * 對應 apps/web/src/app/blog/page.tsx
 */
import React, { useState, useCallback } from 'react'
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
import { ChevronLeft, Calendar, User, ChevronRight, Plus } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, SearchInput, IconButton, Card, Button } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 模擬資料
const MOCK_ARTICLES = [
  {
    id: '1',
    title: '攀岩入門指南：從零開始的完整攻略',
    excerpt: '想開始攀岩但不知從何下手？這篇文章將帶你了解攀岩的基本知識...',
    author: '攀岩小編',
    publishedAt: '2024-01-20',
    coverImage: 'https://picsum.photos/400/200?random=30',
    readTime: '8 分鐘',
  },
  {
    id: '2',
    title: '龍洞岩場完整攻略',
    excerpt: '龍洞是台灣最著名的戶外岩場，這篇文章整理了所有你需要知道的資訊...',
    author: '老岩友',
    publishedAt: '2024-01-15',
    coverImage: 'https://picsum.photos/400/200?random=31',
    readTime: '12 分鐘',
  },
  {
    id: '3',
    title: '抱石技巧進階：如何突破瓶頸',
    excerpt: '當你爬到一個程度後，進步變得困難？這些技巧可以幫助你突破...',
    author: '攀岩教練',
    publishedAt: '2024-01-10',
    coverImage: 'https://picsum.photos/400/200?random=32',
    readTime: '10 分鐘',
  },
]

interface Article {
  id: string
  title: string
  excerpt: string
  author: string
  publishedAt: string
  coverImage: string
  readTime: string
}

interface ArticleCardProps {
  article: Article
  onPress: () => void
  index: number
}

function ArticleCard({ article, onPress, index }: ArticleCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 100)}>
      <Pressable onPress={onPress}>
        <Card style={styles.articleCard}>
          <Image
            source={{ uri: article.coverImage }}
            style={styles.coverImage}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.articleContent}>
            <Text variant="body" fontWeight="600" numberOfLines={2}>
              {article.title}
            </Text>
            <Text
              variant="small"
              color="textSubtle"
              numberOfLines={2}
              style={styles.excerpt}
            >
              {article.excerpt}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <User size={12} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" color="textMuted">
                  {article.author}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Calendar size={12} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" color="textMuted">
                  {article.publishedAt}
                </Text>
              </View>
              <Text variant="small" color="textMuted">
                {article.readTime}
              </Text>
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
  const [articles] = useState<Article[]>(MOCK_ARTICLES)
  const [isLoading] = useState(false)

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
      article.author.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderItem = ({ item, index }: { item: Article; index: number }) => (
    <ArticleCard
      article={item}
      onPress={() => handleArticlePress(item.id)}
      index={index}
    />
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
                {searchTerm
                  ? `找不到符合「${searchTerm}」的文章`
                  : '暫無文章'}
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
