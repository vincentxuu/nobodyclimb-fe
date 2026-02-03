/**
 * CardPersonList 組件
 *
 * 相關文章列表，對應 apps/web/src/components/biography/card-person-list.tsx
 */
import React from 'react'
import { StyleSheet, View, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { ArrowRightCircle } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, Card } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 相關文章資料
const relatedArticles = [
  {
    id: 1,
    title: '冰攀初體驗',
    author: '謝璿',
    date: '2023.02.15',
    description: '第一次體驗冰攀，在冰凍的瀑布上攀登，是一種全新的感受...',
    imageSrc: '/photo/blog-left.jpeg',
  },
  {
    id: 2,
    title: '長程攀登：心得與準備',
    author: '小若',
    date: '2023.01.20',
    description: '準備一次長程攀登需要什麼？分享我的準備清單和心得...',
    imageSrc: '/photo/blog-mid-left.jpeg',
  },
  {
    id: 3,
    title: '攀岩訓練與身體調適',
    author: '一路',
    date: '2023.03.05',
    description: '如何安排訓練計畫，讓身體達到最佳攀岩狀態...',
    imageSrc: '/photo/blog-mid-right.jpeg',
  },
]

interface Article {
  id: number
  title: string
  author: string
  date: string
  description: string
  imageSrc: string
}

interface RelatedArticleCardProps {
  article: Article
  onPress: () => void
  index: number
}

function RelatedArticleCard({ article, onPress, index }: RelatedArticleCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 100)}
      style={styles.cardWrapper}
    >
      <Pressable onPress={onPress}>
        <Card style={styles.card}>
          {/* 圖片區域 */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: `https://nobodyclimb.cc${article.imageSrc}` }}
              style={styles.image}
              contentFit="cover"
              transition={300}
            />
          </View>

          {/* 內容區域 */}
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.titleSection}>
                <Text variant="body" fontWeight="500" numberOfLines={1}>
                  {article.title}
                </Text>
                <Text variant="small" color="textMuted">
                  {article.author} | {article.date}
                </Text>
              </View>
              <ArrowRightCircle size={18} color={SEMANTIC_COLORS.textMuted} />
            </View>

            <Text variant="small" color="textMain" numberOfLines={2}>
              {article.description}
            </Text>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  )
}

interface CardPersonListProps {
  /** 當前文章 ID（用於排除） */
  currentId?: string
  /** 水平滾動模式 */
  horizontal?: boolean
}

export function CardPersonList({
  currentId,
  horizontal = false,
}: CardPersonListProps) {
  const router = useRouter()

  const filteredArticles = currentId
    ? relatedArticles.filter((article) => String(article.id) !== currentId)
    : relatedArticles

  const handlePress = (articleId: number) => {
    router.push(`/blog/${articleId}` as any)
  }

  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {filteredArticles.map((article, index) => (
          <View key={article.id} style={styles.horizontalCard}>
            <RelatedArticleCard
              article={article}
              onPress={() => handlePress(article.id)}
              index={index}
            />
          </View>
        ))}
      </ScrollView>
    )
  }

  return (
    <View style={styles.verticalList}>
      {filteredArticles.map((article, index) => (
        <RelatedArticleCard
          key={article.id}
          article={article}
          onPress={() => handlePress(article.id)}
          index={index}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  verticalList: {
    gap: SPACING.md,
  },
  horizontalList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  horizontalCard: {
    width: 280,
  },
  cardWrapper: {
    overflow: 'hidden',
  },
  card: {
    overflow: 'hidden',
  },
  imageContainer: {
    height: 160,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  titleSection: {
    flex: 1,
    marginRight: SPACING.sm,
  },
})

export default CardPersonList
