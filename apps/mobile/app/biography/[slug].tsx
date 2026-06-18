/**
 * 傳記詳情頁面
 *
 * 對應 apps/web/src/app/biography/profile/[slug]/page.tsx
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, ArrowRight, ChevronLeft, Pencil, Share2, UserPlus } from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
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
import {
  BiographyFootprints,
  BiographyOneLiners,
  EmptyState,
  StoryCard,
} from '@/components/biography/display'
import {
  ChapterAdvice,
  ChapterBucketList,
  ChapterMeaning,
  ChapterMeeting,
  FeaturedStoriesSection,
  HeroSection,
  QuickFactsSection,
} from '@/components/biography/profile'
import { IconButton, Text } from '@/components/ui'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

// 類型定義
interface Biography {
  id: string
  user_id?: string | null
  name: string
  slug: string
  title?: string
  avatar_url?: string | null
  cover_url?: string | null
  cover_image?: string | null
  visibility?: string
  climbing_years?: number | null
  climbing_start_year?: number | string | null
  basic_info_data?: string | null
  favorite_route_type?: string | string[] | null
  frequent_locations?: string[]
  social_links?: Record<string, string> | string | null
  tags_data?: string | null
  stories_data?: string | null
  total_views?: number
  total_likes?: number
  follower_count?: number
  comment_count?: number
}

interface AdjacentBiography {
  id: string
  slug?: string | null
  name: string
  title?: string | null
}

interface AdjacentResponse {
  previous?: AdjacentBiography | null
  next?: AdjacentBiography | null
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

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value == null || value === '') return fallback
  if (typeof value !== 'string') return value as T
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function splitList(value: unknown): string[] | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  if (typeof value !== 'string') return undefined
  const parsed = safeJsonParse<unknown>(value, null)
  if (Array.isArray(parsed)) {
    return parsed.filter((item): item is string => typeof item === 'string')
  }
  const items = value
    .split(/[/,、，]/)
    .map((item) => item.trim())
    .filter(Boolean)
  return items.length > 0 ? items : undefined
}

function normalizeTags(value: unknown): Array<{ tag_id: string; source?: string }> {
  const parsed = safeJsonParse<any>(value, [])
  if (Array.isArray(parsed)) {
    return parsed.filter((item) => typeof item?.tag_id === 'string')
  }
  if (parsed?.tags && Array.isArray(parsed.tags)) {
    return parsed.tags.filter((item: any) => typeof item?.tag_id === 'string')
  }
  if (parsed?.selections && typeof parsed.selections === 'object') {
    return Object.values(parsed.selections)
      .flat()
      .filter((tagId): tagId is string => typeof tagId === 'string')
      .map((tagId) => ({ tag_id: tagId, source: 'system' }))
  }
  return []
}

function toSocialLinksString(value: Biography['social_links']) {
  if (!value) return undefined
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function toProfilePerson(biography: Biography) {
  return {
    ...biography,
    cover_image: biography.cover_image ?? biography.cover_url ?? undefined,
    avatar_url: biography.avatar_url ?? undefined,
    social_links: toSocialLinksString(biography.social_links),
  }
}

function toQuickFactsPerson(biography: Biography) {
  const basicInfo = safeJsonParse<Record<string, any>>(biography.basic_info_data, {})
  const startYearRaw = basicInfo.climbing_start_year ?? biography.climbing_start_year
  const startYear =
    typeof startYearRaw === 'number'
      ? startYearRaw
      : startYearRaw
        ? Number.parseInt(String(startYearRaw), 10)
        : undefined
  const tagsRaw = safeJsonParse<any>(biography.tags_data, {})

  return {
    id: biography.id,
    name: biography.name,
    climbing_start_year: startYear && !Number.isNaN(startYear) ? startYear : undefined,
    frequent_locations: splitList(basicInfo.frequent_locations ?? biography.frequent_locations),
    favorite_route_types: splitList(basicInfo.favorite_route_type ?? biography.favorite_route_type),
    tags: normalizeTags(biography.tags_data),
    custom_tags: Array.isArray(tagsRaw?.custom_tags) ? tagsRaw.custom_tags : undefined,
    custom_dimensions: Array.isArray(tagsRaw?.custom_dimensions)
      ? tagsRaw.custom_dimensions
      : undefined,
    stories: Object.values(
      safeJsonParse<Record<string, Record<string, any>>>(biography.stories_data, {})
    )
      .flatMap((category) =>
        Object.entries(category ?? {}).map(([questionId, item]) => ({
          question_id: questionId,
          content: typeof item === 'string' ? item : (item?.answer ?? item?.content ?? ''),
        }))
      )
      .filter((item) => item.content.trim().length > 0),
  }
}

export default function BiographyDetailScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { user } = useAuthStore()
  const trackedViewRef = useRef<string | null>(null)

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
  // 取得小故事
  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ['stories', biographyId],
    queryFn: async () => {
      const response = await apiClient.get(`/content/biographies/${biographyId}/stories`)
      return response.data?.data ?? response.data ?? []
    },
    enabled: !!biographyId,
  })

  const { data: adjacent } = useQuery<AdjacentResponse>({
    queryKey: ['biography', 'adjacent', biographyId],
    queryFn: async () => {
      const response = await apiClient.get(`/biographies/${biographyId}/adjacent`)
      return response.data?.data ?? response.data
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
  const isOwner = !!user?.id && user.id === biography?.user_id

  // 合併統計資料到 biography
  const enrichedBiography = biography
    ? {
        ...biography,
        total_views: stats?.total_views ?? biography.total_views ?? 0,
        total_likes: stats?.total_likes ?? biography.total_likes ?? 0,
        follower_count: stats?.follower_count ?? biography.follower_count ?? 0,
      }
    : null

  const profilePerson = useMemo(
    () => (enrichedBiography ? toProfilePerson(enrichedBiography) : null),
    [enrichedBiography]
  )
  const quickFactsPerson = useMemo(
    () => (enrichedBiography ? toQuickFactsPerson(enrichedBiography) : null),
    [enrichedBiography]
  )

  useEffect(() => {
    if (!biographyId || trackedViewRef.current === biographyId) return
    trackedViewRef.current = biographyId
    apiClient.put(`/biographies/${biographyId}/view`).catch((error) => {
      console.error('Failed to record biography view:', error)
    })
  }, [biographyId])

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

  const handleOpenStory = useCallback(
    (type: 'one-liners' | 'stories', id: string) => {
      router.push(`/story/${type}/${id}` as never)
    },
    [router]
  )

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
        {isOwner && (
          <IconButton
            icon={<Pencil size={20} color={SEMANTIC_COLORS.textMain} />}
            onPress={() => router.push('/profile' as never)}
            variant="ghost"
          />
        )}
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
        {profilePerson && (
          <HeroSection
            person={profilePerson}
            followerCount={enrichedBiography.follower_count ?? 0}
            isOwner={isOwner}
          />
        )}

        <QuickFactsSection person={quickFactsPerson} />

        {biographyId && <BiographyOneLiners biographyId={biographyId} />}

        {profilePerson && <FeaturedStoriesSection person={profilePerson} />}

        {biographyId && <ChapterMeeting biographyId={biographyId} />}

        {biographyId && (
          <ChapterMeaning biographyId={biographyId} personName={enrichedBiography.name} />
        )}

        <ChapterBucketList person={quickFactsPerson} isOwner={isOwner} />

        {biographyId && (
          <ChapterAdvice
            biographyId={biographyId}
            personName={enrichedBiography.name}
            updatedAt={undefined}
          />
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
                onPress={() => handleOpenStory('stories', story.id)}
              />
            ))}
          </View>
        )}

        <BiographyFootprints biography={quickFactsPerson ?? enrichedBiography} />

        {(adjacent?.previous || adjacent?.next) && (
          <View style={styles.adjacentSection}>
            {adjacent.previous ? (
              <Pressable
                style={styles.adjacentCard}
                onPress={() =>
                  router.push(
                    `/biography/profile/${adjacent.previous?.slug || adjacent.previous?.id}` as never
                  )
                }
              >
                <ArrowLeft size={18} color={SEMANTIC_COLORS.textMain} />
                <View style={styles.adjacentText}>
                  <Text variant="caption" color="textSubtle">
                    上一篇
                  </Text>
                  <Text variant="bodyBold" numberOfLines={1}>
                    {adjacent.previous.name}
                  </Text>
                </View>
              </Pressable>
            ) : (
              <View style={styles.adjacentSpacer} />
            )}
            {adjacent.next ? (
              <Pressable
                style={styles.adjacentCard}
                onPress={() =>
                  router.push(
                    `/biography/profile/${adjacent.next?.slug || adjacent.next?.id}` as never
                  )
                }
              >
                <View style={styles.adjacentText}>
                  <Text variant="caption" color="textSubtle" align="right">
                    下一篇
                  </Text>
                  <Text variant="bodyBold" numberOfLines={1} align="right">
                    {adjacent.next.name}
                  </Text>
                </View>
                <ArrowRight size={18} color={SEMANTIC_COLORS.textMain} />
              </Pressable>
            ) : (
              <View style={styles.adjacentSpacer} />
            )}
          </View>
        )}

        {!user && (
          <View style={styles.guestCta}>
            <UserPlus size={24} color="#FFFFFF" />
            <Text variant="h4" fontWeight="700" style={styles.guestTitle}>
              你也有攀岩故事嗎？
            </Text>
            <Text variant="body" style={styles.guestDescription}>
              來寫寫你的小人物誌吧
            </Text>
            <Pressable
              style={styles.guestButton}
              onPress={() => router.push('/auth/register' as never)}
            >
              <Text variant="bodyBold">立即註冊加入</Text>
            </Pressable>
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
  adjacentSection: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  adjacentCard: {
    flex: 1,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  adjacentText: {
    flex: 1,
    gap: 2,
  },
  adjacentSpacer: {
    flex: 1,
  },
  guestCta: {
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.xl,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  guestTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  guestDescription: {
    color: '#E5E5E5',
    textAlign: 'center',
  },
  guestButton: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  bottomPadding: {
    height: SPACING.xxl,
  },
})
