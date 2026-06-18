/**
 * 故事詳情頁
 *
 * 支援 core-stories / one-liners / stories 三種類型
 */

import {
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SEMANTIC_COLORS,
  SPACING,
  WB_COLORS,
} from '@nobodyclimb/constants'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { ContentInteractionBar } from '@/components/biography/display/ContentInteractionBar'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { MarkdownText } from '@/components/ui/MarkdownText'
import { Text } from '@/components/ui/Text'
import { apiClient } from '@/lib/api'
import type { StoryType } from '@/lib/hooks/useStoryDetail'
import { isValidStoryType, useStoryDetail } from '@/lib/hooks/useStoryDetail'

const TYPE_LABELS: Record<StoryType, string> = {
  'core-stories': '核心故事',
  'one-liners': '一句話',
  stories: '小故事',
}

interface RelatedStory {
  id: string
  type: StoryType
  title: string
  preview?: string
  category?: string
}

function formatDate(dateString?: string): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return '今天'
  if (diffInDays === 1) return '昨天'
  if (diffInDays < 7) return `${diffInDays} 天前`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} 週前`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} 個月前`

  return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function StoryDetailScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>()
  const router = useRouter()
  const storyType = isValidStoryType(type as string) ? (type as StoryType) : null
  const storyId = id as string
  const { data, isLoading } = useStoryDetail(storyType, storyId)
  const [relatedStories, setRelatedStories] = useState<RelatedStory[]>([])

  const title = data
    ? storyType === 'core-stories'
      ? data.title || '核心故事'
      : storyType === 'one-liners'
        ? data.question || '一句話'
        : data.title || data.category_name || '小故事'
    : ''
  const author = data?.author
  const authorName = data?.author_name || author?.name
  const authorTitle = data?.author_title || author?.title
  const authorAvatar = data?.author_avatar || author?.avatar_url
  const biographyId = data?.biography_id || author?.biography_id
  const biographySlug = data?.biography_slug || author?.biography_slug || biographyId
  const publishedAt = formatDate(data?.created_at)

  useEffect(() => {
    if (!storyType) {
      router.replace('/(tabs)')
    }
  }, [storyType, router])

  useEffect(() => {
    if (!biographyId || !storyType) {
      setRelatedStories([])
      return
    }

    const loadRelatedStories = async () => {
      try {
        const requests: Array<Promise<{ type: StoryType; items: any[] }>> = []

        if (storyType !== 'core-stories') {
          requests.push(
            apiClient.get(`/content/biographies/${biographyId}/core-stories`).then((response) => ({
              type: 'core-stories' as const,
              items: response.data?.data ?? response.data ?? [],
            }))
          )
        }
        if (storyType !== 'one-liners') {
          requests.push(
            apiClient.get(`/content/biographies/${biographyId}/one-liners`).then((response) => ({
              type: 'one-liners' as const,
              items: response.data?.data ?? response.data ?? [],
            }))
          )
        }
        if (storyType !== 'stories') {
          requests.push(
            apiClient.get(`/content/biographies/${biographyId}/stories`).then((response) => ({
              type: 'stories' as const,
              items: response.data?.data ?? response.data ?? [],
            }))
          )
        }

        const results = await Promise.all(requests)
        const related = results
          .flatMap(({ type: relatedType, items }) =>
            items
              .filter((item) => item.id !== storyId)
              .slice(0, 2)
              .map((item) => ({
                id: item.id,
                type: relatedType,
                title:
                  relatedType === 'one-liners'
                    ? item.question || '一句話'
                    : item.title || item.category_name || '故事',
                preview: relatedType === 'one-liners' ? item.answer : item.content,
                category: item.category_name,
              }))
          )
          .slice(0, 3)

        setRelatedStories(related)
      } catch (error) {
        console.error('Failed to load related stories:', error)
      }
    }

    loadRelatedStories()
  }, [biographyId, storyId, storyType])

  const handleToggleLike = async () => {
    const { data: res } = await apiClient.post(`/content/${storyType}/${storyId}/like`)
    return { liked: res.data.liked, like_count: res.data.like_count }
  }

  const handleFetchComments = async () => {
    const { data: res } = await apiClient.get(`/content/${storyType}/${storyId}/comments`)
    return res.data
  }

  const handleAddComment = async (content: string) => {
    const { data: res } = await apiClient.post(`/content/${storyType}/${storyId}/comments`, {
      content,
    })
    return res.data
  }

  const handleDeleteComment = async (commentId: string) => {
    if (storyType !== 'core-stories') return
    await apiClient.delete(`/content/core-story-comments/${commentId}`)
  }

  if (!storyType) {
    return null
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator testID="loading-spinner" size="large" color={SEMANTIC_COLORS.accent} />
      </View>
    )
  }

  if (!data) {
    return null
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Pressable
        style={styles.backButton}
        onPress={() => router.push('/biography?tab=stories' as never)}
      >
        <ArrowLeft size={16} color={SEMANTIC_COLORS.textMain} />
        <Text style={styles.backButtonText}>返回故事列表</Text>
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <Badge variant="default" size="sm">
          {TYPE_LABELS[storyType]}
        </Badge>

        {data.category_name && (
          <Badge variant="info" size="sm">
            {data.category_name}
          </Badge>
        )}

        {publishedAt && (
          <View style={styles.metaItem}>
            <Calendar size={12} color={SEMANTIC_COLORS.textMuted} />
            <Text color="textMuted" style={styles.metaText}>
              {publishedAt}
            </Text>
          </View>
        )}

        {storyType === 'stories' && data.word_count ? (
          <Text color="textMuted" style={styles.metaText}>
            {data.word_count} 字
          </Text>
        ) : null}
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Content */}
      {storyType === 'one-liners' ? (
        <View style={styles.answerContainer}>
          <Text style={styles.answer}>{data.answer}</Text>
        </View>
      ) : data.content ? (
        <View style={styles.contentBody}>
          <MarkdownText>{data.content}</MarkdownText>
        </View>
      ) : null}

      {/* Interaction bar */}
      <ContentInteractionBar
        contentType={storyType}
        contentId={storyId}
        isLiked={data.is_liked ?? false}
        likeCount={data.like_count ?? 0}
        commentCount={data.comment_count ?? 0}
        onToggleLike={handleToggleLike}
        onFetchComments={handleFetchComments}
        onAddComment={handleAddComment}
        onDeleteComment={storyType === 'core-stories' ? handleDeleteComment : undefined}
        shareUrl={`https://nobodyclimb.cc/story/${storyType}/${storyId}`}
        shareTitle={title}
      />

      {authorName && (
        <View style={styles.authorCard}>
          <Avatar size="lg" source={authorAvatar ? { uri: authorAvatar } : undefined} />
          <View style={styles.authorCardContent}>
            <Text style={styles.authorCardTitle}>{authorName}</Text>
            {authorTitle && (
              <Text color="textSubtle" style={styles.authorCardSubtitle} numberOfLines={2}>
                {authorTitle}
              </Text>
            )}
          </View>
          {biographySlug && (
            <Pressable
              style={styles.authorCardLink}
              onPress={() => router.push(`/biography/profile/${biographySlug}` as never)}
            >
              <Text style={styles.authorCardLinkText}>查看更多</Text>
              <ArrowRight size={14} color={SEMANTIC_COLORS.textMain} />
            </Pressable>
          )}
        </View>
      )}

      {relatedStories.length > 0 && (
        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>更多 {authorName || '作者'} 的故事</Text>
          {relatedStories.map((story) => (
            <Pressable
              key={`${story.type}-${story.id}`}
              style={styles.relatedCard}
              onPress={() => router.push(`/story/${story.type}/${story.id}` as never)}
            >
              <View style={styles.relatedHeader}>
                <Badge variant="default" size="sm">
                  {TYPE_LABELS[story.type]}
                </Badge>
                {story.category && (
                  <Text color="textMuted" style={styles.relatedCategory}>
                    {story.category}
                  </Text>
                )}
              </View>
              <Text style={styles.relatedStoryTitle}>{story.title}</Text>
              {story.preview && (
                <Text color="textSubtle" style={styles.relatedPreview} numberOfLines={2}>
                  {story.preview}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WB_COLORS[100],
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: WB_COLORS[10],
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.md,
  },
  backButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: SEMANTIC_COLORS.textMain,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[100],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FONT_SIZE.xs,
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: SEMANTIC_COLORS.textMain,
    marginBottom: SPACING.sm,
    lineHeight: 32,
  },
  answerContainer: {
    backgroundColor: WB_COLORS[10],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  answer: {
    fontSize: FONT_SIZE.base,
    color: SEMANTIC_COLORS.textMain,
    lineHeight: 24,
  },
  contentBody: {
    marginBottom: SPACING.md,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: WB_COLORS[10],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  authorCardContent: {
    flex: 1,
  },
  authorCardTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: SEMANTIC_COLORS.textMain,
  },
  authorCardSubtitle: {
    marginTop: 2,
    fontSize: FONT_SIZE.sm,
  },
  authorCardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: SEMANTIC_COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  authorCardLinkText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: SEMANTIC_COLORS.textMain,
  },
  relatedSection: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  relatedTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: SEMANTIC_COLORS.textMain,
  },
  relatedCard: {
    backgroundColor: WB_COLORS[10],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  relatedCategory: {
    fontSize: FONT_SIZE.xs,
  },
  relatedStoryTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: SEMANTIC_COLORS.textMain,
  },
  relatedPreview: {
    lineHeight: 20,
  },
})
