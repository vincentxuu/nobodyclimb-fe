/**
 * 路線故事區塊
 *
 * 對應 apps/web/src/components/crag/RouteStoriesSection.tsx
 * 顯示路線相關的攀岩故事列表，支援按讚與有幫助互動
 */

import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Image } from 'expo-image'
import {
  BookOpen,
  CheckCircle,
  Heart,
  Instagram,
  MessageSquare,
  Plus,
  Star,
  ThumbsUp,
  Youtube,
} from 'lucide-react-native'
import React from 'react'
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'
import type { RouteStory } from '@/lib/hooks/useRouteStories'
import {
  useCreateRouteStory,
  useRouteStories,
  useToggleStoryHelpful,
  useToggleStoryLike,
} from '@/lib/hooks/useRouteStories'
import { useAuthStore } from '@/store/authStore'
import { RouteStoryForm, type RouteStoryFormRef } from './RouteStoryForm'

// ── Helpers ────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

function getInitial(story: RouteStory): string {
  const name = story.display_name || story.username || 'U'
  return name.charAt(0).toUpperCase()
}

// ── StoryCard ──────────────────────────────────────────

interface StoryCardProps {
  story: RouteStory
  routeId: string
}

function StoryCard({ story, routeId }: StoryCardProps) {
  const { status } = useAuthStore()
  const isLoggedIn = status === 'signIn'

  const toggleLike = useToggleStoryLike()
  const toggleHelpful = useToggleStoryHelpful()

  const handleLike = () => {
    if (!isLoggedIn) return
    toggleLike.mutate({ storyId: story.id, routeId })
  }

  const handleHelpful = () => {
    if (!isLoggedIn) return
    toggleHelpful.mutate({ storyId: story.id, routeId })
  }

  return (
    <View style={styles.storyCard}>
      {/* Header: 使用者資訊 */}
      <View style={styles.storyHeader}>
        {story.avatar_url ? (
          <Image source={{ uri: story.avatar_url }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text variant="small" fontWeight="600" color="textSubtle">
              {getInitial(story)}
            </Text>
          </View>
        )}
        <View style={styles.storyAuthorInfo}>
          <View style={styles.authorNameRow}>
            <Text variant="body" fontWeight="500">
              {story.display_name || story.username}
            </Text>
            {story.is_verified && <CheckCircle size={14} color="#3B82F6" />}
          </View>
          <Text variant="caption" color="textMuted">
            {formatDate(story.created_at)}
          </Text>
        </View>
      </View>

      {/* 精選標籤 */}
      {story.is_featured && (
        <View style={styles.featuredBadge}>
          <Star size={12} color="#B45309" />
          <Text variant="caption" style={styles.featuredText}>
            精選
          </Text>
        </View>
      )}

      {/* 標題 */}
      {story.title && (
        <Text variant="body" fontWeight="600" style={styles.storyTitle}>
          {story.title}
        </Text>
      )}

      {/* 內容 */}
      <Text variant="body" color="textSubtle" style={styles.storyContent}>
        {story.content}
      </Text>

      {/* 照片 */}
      {story.photos && story.photos.length > 0 && (
        <View style={styles.photoGrid}>
          {story.photos.slice(0, 3).map((photo, index) => (
            <View key={index} style={styles.photoItem}>
              <Image source={{ uri: photo }} style={styles.photoImage} contentFit="cover" />
              {index === 2 && story.photos.length > 3 && (
                <View style={styles.photoOverlay}>
                  <Text variant="body" fontWeight="600" style={styles.photoOverlayText}>
                    +{story.photos.length - 3}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* 媒體連結 */}
      {(story.youtube_url || story.instagram_url) && (
        <View style={styles.mediaLinks}>
          {story.youtube_url && (
            <Pressable style={styles.mediaLink} onPress={() => Linking.openURL(story.youtube_url!)}>
              <Youtube size={14} color="#EF4444" />
              <Text variant="caption" style={styles.mediaLinkYoutube}>
                影片
              </Text>
            </Pressable>
          )}
          {story.instagram_url && (
            <Pressable
              style={styles.mediaLink}
              onPress={() => Linking.openURL(story.instagram_url!)}
            >
              <Instagram size={14} color="#EC4899" />
              <Text variant="caption" style={styles.mediaLinkInstagram}>
                貼文
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* 互動列 */}
      <View style={styles.interactionBar}>
        {/* 按讚 */}
        <Pressable style={styles.interactionButton} onPress={handleLike} hitSlop={8}>
          <Heart
            size={16}
            color={story.is_liked ? '#059669' : SEMANTIC_COLORS.textMuted}
            fill={story.is_liked ? '#059669' : 'none'}
          />
          {(story.like_count || 0) > 0 && (
            <Text
              variant="caption"
              style={[styles.interactionCount, story.is_liked && styles.interactionCountActive]}
            >
              {story.like_count}
            </Text>
          )}
        </Pressable>

        {/* 有幫助 */}
        <Pressable style={styles.interactionButton} onPress={handleHelpful} hitSlop={8}>
          <ThumbsUp
            size={16}
            color={story.is_helpful ? '#2563EB' : SEMANTIC_COLORS.textMuted}
            fill={story.is_helpful ? '#2563EB' : 'none'}
          />
          {(story.helpful_count || 0) > 0 && (
            <Text
              variant="caption"
              style={[styles.interactionCount, story.is_helpful && styles.interactionCountHelpful]}
            >
              {story.helpful_count}
            </Text>
          )}
          <Text variant="caption" color="textMuted">
            有幫助
          </Text>
        </Pressable>

        {/* 留言數（僅顯示） */}
        {story.comment_count > 0 && (
          <View style={styles.interactionButton}>
            <MessageSquare size={16} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="caption" color="textMuted">
              {story.comment_count}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

// ── RouteStoriesSection ────────────────────────────────

interface RouteStoriesSectionProps {
  cragId: string
  routeId: string
  routeName?: string
  routeGrade?: string
}

export function RouteStoriesSection({
  cragId,
  routeId,
  routeName,
  routeGrade,
}: RouteStoriesSectionProps) {
  const { data, isLoading } = useRouteStories(routeId)
  const stories = data?.data ?? []

  const storyFormRef = React.useRef<RouteStoryFormRef>(null)
  const createStory = useCreateRouteStory()
  const { status } = useAuthStore()
  const isLoggedIn = status === 'signIn'

  const handleCreateStory = async (data: { title?: string; content: string }) => {
    await createStory.mutateAsync({
      route_id: routeId,
      title: data.title,
      content: data.content,
      visibility: 'public',
    })
  }

  return (
    <>
      <View style={styles.section}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flex: 1 }}>
            <View style={styles.sectionBar} />
            <BookOpen size={18} color={SEMANTIC_COLORS.textMain} />
            <Text variant="body" fontWeight="600">
              攀岩故事
            </Text>
          </View>
          {isLoggedIn && (
            <Pressable style={styles.addButton} onPress={() => storyFormRef.current?.open()}>
              <Plus size={16} color="#2563EB" />
              <Text variant="caption" style={{ color: '#2563EB' }}>
                分享
              </Text>
            </Pressable>
          )}
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMuted} />
            <Text variant="caption" color="textMuted" style={styles.loadingText}>
              載入中...
            </Text>
          </View>
        ) : stories.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen size={36} color="#D1D5DB" />
            <Text variant="body" color="textMuted" style={styles.emptyText}>
              還沒有人分享故事
            </Text>
            <Text variant="caption" color="textMuted">
              成為第一個分享攀登體驗的人吧！
            </Text>
          </View>
        ) : (
          <View style={styles.storiesList}>
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} routeId={routeId} />
            ))}
          </View>
        )}
      </View>
      {isLoggedIn && (
        <RouteStoryForm
          ref={storyFormRef}
          routeId={routeId}
          routeName={routeName || ''}
          routeGrade={routeGrade || ''}
          onSubmit={handleCreateStory}
          isLoading={createStory.isPending}
        />
      )}
    </>
  )
}

// ── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionBar: {
    width: 4,
    height: 18,
    backgroundColor: '#FFE70C',
    borderRadius: 2,
  },

  // Loading
  loadingContainer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  loadingText: {
    marginTop: 4,
  },

  // Empty state
  emptyState: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
  },
  emptyText: {
    marginTop: SPACING.sm,
    marginBottom: 4,
  },

  // Stories list
  storiesList: {
    gap: SPACING.md,
  },

  // Story card
  storyCard: {
    borderWidth: 1,
    borderColor: '#EBEAEA',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAuthorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Featured badge
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  featuredText: {
    color: '#B45309',
  },

  // Story content
  storyTitle: {
    marginTop: SPACING.sm,
  },
  storyContent: {
    marginTop: SPACING.xs,
    lineHeight: 22,
  },

  // Photos
  photoGrid: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  photoItem: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlayText: {
    color: '#FFFFFF',
  },

  // Media links
  mediaLinks: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  mediaLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mediaLinkYoutube: {
    color: '#EF4444',
  },
  mediaLinkInstagram: {
    color: '#EC4899',
  },

  // Interaction bar
  interactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  interactionCount: {
    color: SEMANTIC_COLORS.textMuted,
  },
  interactionCountActive: {
    color: '#059669',
  },
  interactionCountHelpful: {
    color: '#2563EB',
  },

  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
})
