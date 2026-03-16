/**
 * 故事詳情頁
 *
 * 支援 core-stories / one-liners / stories 三種類型
 */
import React, { useEffect } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import {
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SEMANTIC_COLORS,
  SPACING,
  WB_COLORS,
} from '@nobodyclimb/constants'
import { Text } from '@/components/ui/Text'
import { MarkdownText } from '@/components/ui/MarkdownText'
import { Badge } from '@/components/ui/Badge'
import { ContentInteractionBar } from '@/components/biography/display/ContentInteractionBar'
import { useStoryDetail } from '@/lib/hooks/useStoryDetail'
import { apiClient } from '@/lib/api'
import type { StoryType } from '@/lib/hooks/useStoryDetail'

const VALID_STORY_TYPES: StoryType[] = ['core-stories', 'one-liners', 'stories']

function isValidStoryType(type: string): type is StoryType {
  return VALID_STORY_TYPES.includes(type as StoryType)
}

const TYPE_LABELS: Record<StoryType, string> = {
  'core-stories': '核心故事',
  'one-liners': '一句話',
  stories: '攀岩故事',
}

export default function StoryDetailScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>()
  const router = useRouter()
  const { data, isLoading } = useStoryDetail(type as StoryType, id as string)

  useEffect(() => {
    if (!isValidStoryType(type as string)) {
      router.replace('/(tabs)')
    }
  }, [type, router])

  if (!isValidStoryType(type as string)) {
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

  const title = type === 'one-liners' ? data.question : data.title
  const author = data.author

  const handleToggleLike = async () => {
    const { data: res } = await apiClient.post(`/content/${type}/${id}/like`)
    return { liked: res.data.liked, like_count: res.data.like_count }
  }

  const handleFetchComments = async () => {
    const { data: res } = await apiClient.get(`/content/${type}/${id}/comments`)
    return res.data
  }

  const handleAddComment = async (content: string) => {
    const { data: res } = await apiClient.post(`/content/${type}/${id}/comments`, { content })
    return res.data
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Badge variant="default" size="sm">
          {TYPE_LABELS[type as StoryType]}
        </Badge>

        {data.category_name && (
          <Badge variant="info" size="sm" style={styles.categoryBadge}>
            {data.category_name}
          </Badge>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Author */}
      {author && (
        <View style={styles.authorRow}>
          <Text style={styles.authorName}>{author.name}</Text>
          {author.biography_id && (
            <Link href={`/biography/${author.biography_id}`}>
              <Text style={styles.biographyLink}>查看更多</Text>
            </Link>
          )}
        </View>
      )}

      {/* Content */}
      {type === 'one-liners' ? (
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
        contentType={type as StoryType}
        contentId={id as string}
        isLiked={data.is_liked ?? false}
        likeCount={data.like_count ?? 0}
        commentCount={data.comment_count ?? 0}
        onToggleLike={handleToggleLike}
        onFetchComments={handleFetchComments}
        onAddComment={handleAddComment}
      />
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
  },
  categoryBadge: {
    marginLeft: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: SEMANTIC_COLORS.textPrimary,
    marginBottom: SPACING.sm,
    lineHeight: 32,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  authorName: {
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textSubtle,
    fontWeight: FONT_WEIGHT.medium,
  },
  biographyLink: {
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.accent,
    fontWeight: FONT_WEIGHT.medium,
  },
  answerContainer: {
    backgroundColor: WB_COLORS[10],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  answer: {
    fontSize: FONT_SIZE.md,
    color: SEMANTIC_COLORS.textPrimary,
    lineHeight: 24,
  },
  contentBody: {
    marginBottom: SPACING.md,
  },
})
