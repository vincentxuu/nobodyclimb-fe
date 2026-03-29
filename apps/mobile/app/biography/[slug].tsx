/**
 * 傳記詳情頁面
 *
 * 對應 apps/web/src/app/biography/profile/[slug]/page.tsx
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft, Share2 } from 'lucide-react-native'
import React, { useCallback } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BiographyHero, EmptyState, StoryCard } from '@/components/biography/display'
import { IconButton, Text } from '@/components/ui'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

// 類型定義
interface Biography {
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
}

interface OneLiner {
  id: string
  question_id: string
  question_text?: string
  answer: string
  like_count?: number
  comment_count?: number
}

interface Story {
  id: string
  question_id?: string
  question_text?: string
  title?: string
  content?: string
  cover_url?: string
  category_id?: string
  like_count?: number
  comment_count?: number
}

export default function BiographyDetailScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { user } = useAuthStore()

  // 取得人物誌基本資料
  const {
    data: biography,
    isLoading: bioLoading,
    error: bioError,
  } = useQuery<Biography>({
    queryKey: ['biography', 'slug', slug],
    queryFn: async () => {
      const response = await apiClient.get(`/biographies/slug/${slug}`)
      const data = response.data?.data ?? response.data
      return data
    },
    enabled: !!slug,
  })

  const biographyId = biography?.id

  // 取得一句話
  const { data: oneLiners = [] } = useQuery<OneLiner[]>({
    queryKey: ['one-liners', biographyId],
    queryFn: async () => {
      const response = await apiClient.get(`/content/biographies/${biographyId}/one-liners`)
      return response.data?.data ?? response.data ?? []
    },
    enabled: !!biographyId,
  })

  // 取得小故事
  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ['stories', biographyId],
    queryFn: async () => {
      const response = await apiClient.get(`/content/biographies/${biographyId}/stories`)
      return response.data?.data ?? response.data ?? []
    },
    enabled: !!biographyId,
  })

  // 取得統計資料
  const { data: stats } = useQuery({
    queryKey: ['biography-stats', biographyId],
    queryFn: async () => {
      const response = await apiClient.get(`/biographies/${biographyId}/stats`)
      return response.data?.data ?? response.data
    },
    enabled: !!biographyId,
  })

  // 是否為擁有者
  const isOwner = user?.id === biography?.id

  // 合併統計資料到 biography
  const enrichedBiography = biography
    ? {
        ...biography,
        total_views: stats?.total_views ?? biography.total_views ?? 0,
        total_likes: stats?.total_likes ?? biography.total_likes ?? 0,
        follower_count: stats?.follower_count ?? biography.follower_count ?? 0,
      }
    : null

  // 刷新
  const [refreshing, setRefreshing] = React.useState(false)
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['biography', 'slug', slug] })
    await queryClient.invalidateQueries({ queryKey: ['one-liners', biographyId] })
    await queryClient.invalidateQueries({ queryKey: ['stories', biographyId] })
    await queryClient.invalidateQueries({ queryKey: ['biography-stats', biographyId] })
    setRefreshing(false)
  }, [queryClient, slug, biographyId])

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
  if (bioLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
        </View>
      </SafeAreaView>
    )
  }

  // 錯誤
  if (bioError || !enrichedBiography) {
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
            description={
              bioError instanceof Error ? bioError.message : '該人物誌可能不存在或已被刪除'
            }
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Hero 區塊 */}
        <BiographyHero
          biography={enrichedBiography}
          isOwner={isOwner}
          showActions={true}
          onShare={handleShare}
        />

        {/* One-liners 區塊 */}
        {oneLiners.length > 0 && (
          <View style={styles.section}>
            <Text variant="h4" fontWeight="600" style={styles.sectionTitle}>
              一句話
            </Text>
            {oneLiners.map((item) => (
              <View key={item.id} style={styles.oneLiner}>
                <Text variant="small" color="textMuted">
                  {item.question_text || ''}
                </Text>
                <Text variant="body" style={styles.oneLinerAnswer}>
                  「{item.answer}」
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 故事區塊 */}
        {stories.length > 0 && (
          <View style={styles.section}>
            <Text variant="h4" fontWeight="600" style={styles.sectionTitle}>
              我的故事
            </Text>
            {stories.map((story, index) => (
              <StoryCard
                key={story.id}
                story={{
                  ...story,
                  title: story.title || story.question_text || '',
                }}
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
