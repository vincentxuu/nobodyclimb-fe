/**
 * 傳記詳情頁面
 *
 * 對應 apps/web/src/app/biography/profile/[slug]/page.tsx
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
import { ChevronLeft, Share2 } from 'lucide-react-native'

import { Text, IconButton } from '@/components/ui'
import { ScrollLayout } from '@/components/layout'
import {
  BiographyHero,
  EmptyState,
  StoryCard,
} from '@/components/biography/display'
import { useAuthStore } from '@/store/authStore'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

// 模擬類型
interface BiographyV2 {
  id: string
  name: string
  slug: string
  title?: string
  avatar_url?: string | null
  cover_url?: string | null
  visibility?: string
  climbing_years?: number | null
  frequent_locations?: string[]
  social_links?: Record<string, string>
  total_views?: number
  total_likes?: number
  follower_count?: number
  comment_count?: number
  one_liners?: Array<{ id: string; question: string; answer: string }>
  stories?: Array<{ id: string; title: string; content?: string; cover_url?: string }>
}

export default function BiographyDetailScreen() {
  const router = useRouter()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { user } = useAuthStore()

  const [biography, setBiography] = useState<BiographyV2 | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // 是否為擁有者
  const isOwner = user?.id === biography?.id

  // 載入資料
  const loadBiography = useCallback(async () => {
    if (!slug) return

    setIsLoading(true)
    setError(null)

    try {
      // TODO: 整合 biographyService
      // const response = await biographyService.getBiographyBySlug(slug)
      // setBiography(response.data)

      // 模擬資料
      await new Promise((resolve) => setTimeout(resolve, 500))
      setBiography({
        id: '1',
        name: '測試用戶',
        slug: slug,
        title: '熱愛攀岩的人',
        climbing_years: 5,
        frequent_locations: ['龍洞', '大砲岩'],
        total_views: 100,
        total_likes: 10,
        follower_count: 5,
        comment_count: 3,
        one_liners: [
          { id: 'q1', question: '攀岩對你來說是什麼？', answer: '是一種生活方式，讓我更了解自己' },
        ],
        stories: [
          { id: 's1', title: '第一次攀岩的經驗', content: '那是一個陽光明媚的下午...' },
        ],
      })
    } catch (err) {
      console.error('Failed to load biography:', err)
      setError('無法載入人物誌')
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  // 初始載入
  useEffect(() => {
    loadBiography()
  }, [loadBiography])

  // 刷新
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadBiography()
    setRefreshing(false)
  }, [loadBiography])

  // 分享
  const handleShare = useCallback(async () => {
    if (!biography) return

    try {
      await Share.share({
        title: `${biography.name} 的攀岩人物誌 - NobodyClimb`,
        message: `來看看 ${biography.name} 的攀岩故事！\nhttps://nobodyclimb.cc/biography/profile/${biography.slug}`,
      })
    } catch (error) {
      console.error('Share failed:', error)
    }
  }, [biography])

  // 返回
  const handleBack = () => {
    router.back()
  }

  // 載入中
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
        </View>
      </SafeAreaView>
    )
  }

  // 錯誤
  if (error || !biography) {
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
          <EmptyState
            title="找不到此人物誌"
            description={error || '該人物誌可能不存在或已被刪除'}
          />
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
        <IconButton
          icon={<Share2 size={20} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleShare}
          variant="ghost"
        />
      </View>

      {/* 內容 */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Hero 區塊 */}
        <BiographyHero
          biography={biography}
          isOwner={isOwner}
          showActions={true}
          onShare={handleShare}
        />

        {/* One-liners 區塊 */}
        {biography.one_liners && biography.one_liners.length > 0 && (
          <View style={styles.section}>
            <Text variant="h4" fontWeight="600" style={styles.sectionTitle}>
              一句話
            </Text>
            {biography.one_liners.map((item) => (
              <View key={item.id} style={styles.oneLiner}>
                <Text variant="small" color="textMuted">
                  {item.question}
                </Text>
                <Text variant="body" style={styles.oneLinerAnswer}>
                  「{item.answer}」
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 故事區塊 */}
        {biography.stories && biography.stories.length > 0 && (
          <View style={styles.section}>
            <Text variant="h4" fontWeight="600" style={styles.sectionTitle}>
              我的故事
            </Text>
            {biography.stories.map((story, index) => (
              <StoryCard
                key={story.id}
                story={story}
                index={index}
                onPress={() => {
                  // TODO: 導航到故事詳情
                }}
              />
            ))}
          </View>
        )}

        {/* 底部留白 */}
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
  },
  section: {
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  oneLiner: {
    marginBottom: SPACING.md,
  },
  oneLinerAnswer: {
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: SPACING.xxl,
  },
})
