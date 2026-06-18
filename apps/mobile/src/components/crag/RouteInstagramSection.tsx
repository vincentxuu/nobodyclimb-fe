import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { ExternalLink, Instagram, LogIn, Plus } from 'lucide-react-native'
import React from 'react'
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'
import { useRouteAscents } from '@/lib/hooks/useRouteAscents'
import { type RouteStory, useCreateRouteStory, useRouteStories } from '@/lib/hooks/useRouteStories'
import { useAuthStore } from '@/store/authStore'
import { RouteMediaForm, type RouteMediaFormRef } from './RouteMediaForm'

interface InstagramItem {
  url: string
  postId: string | null
  source: 'static' | 'user'
  key: string
}

interface RouteInstagramSectionProps {
  routeId: string
  routeName: string
  staticPosts?: string[]
}

function getInstagramPostId(url: string) {
  const match = url.match(/instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

function toStoryPost(story: RouteStory): InstagramItem | null {
  if (!story.instagram_url) return null
  return {
    url: story.instagram_url,
    postId: getInstagramPostId(story.instagram_url),
    source: 'user',
    key: `story-${story.id}`,
  }
}

export function RouteInstagramSection({
  routeId,
  routeName,
  staticPosts = [],
}: RouteInstagramSectionProps) {
  const router = useRouter()
  const { data: storiesData, isLoading: isStoriesLoading } = useRouteStories(routeId, 20)
  const { ascents, isLoading: isAscentsLoading } = useRouteAscents(routeId, 50)
  const createStory = useCreateRouteStory()
  const formRef = React.useRef<RouteMediaFormRef>(null)
  const { status } = useAuthStore()
  const isLoggedIn = status === 'signIn'

  const staticItems = staticPosts.map((url, index) => ({
    url,
    postId: getInstagramPostId(url),
    source: 'static' as const,
    key: `static-${index}`,
  }))
  const storyItems = (storiesData?.data ?? [])
    .map(toStoryPost)
    .filter((post): post is InstagramItem => !!post)
  const ascentItems = ascents
    .filter((ascent) => ascent.instagram_url)
    .map((ascent) => ({
      url: ascent.instagram_url!,
      postId: getInstagramPostId(ascent.instagram_url!),
      source: 'user' as const,
      key: `ascent-${ascent.id}`,
    }))
  const posts = [...staticItems, ...storyItems, ...ascentItems]
  const isLoading = isStoriesLoading || isAscentsLoading

  const handleShareInstagram = async (data: { content?: string; instagram_url?: string }) => {
    await createStory.mutateAsync({
      route_id: routeId,
      content: data.content || '分享貼文',
      instagram_url: data.instagram_url,
      visibility: 'public',
    })
  }

  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionBar} />
            <Instagram size={18} color="#E4405F" />
            <Text variant="body" fontWeight="600">
              Instagram 貼文
            </Text>
            {posts.length > 0 ? (
              <Text variant="small" color="textMuted">
                {posts.length} 則
              </Text>
            ) : null}
          </View>
          {isLoggedIn ? (
            <Pressable style={styles.addButton} onPress={() => formRef.current?.open()}>
              <Plus size={16} color="#2563EB" />
              <Text variant="caption" style={styles.addButtonText}>
                分享
              </Text>
            </Pressable>
          ) : (
            <Pressable style={styles.addButton} onPress={() => router.push('/auth/login' as any)}>
              <LogIn size={16} color="#2563EB" />
              <Text variant="caption" style={styles.addButtonText}>
                登入分享
              </Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMuted} />
            <Text variant="small" color="textMuted">
              載入中...
            </Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Instagram size={36} color="#D1D5DB" />
            <Text variant="small" color="textMuted">
              目前沒有 Instagram 貼文
            </Text>
            <Text variant="caption" color="textMuted">
              成為第一個分享 {routeName} 貼文的人
            </Text>
          </View>
        ) : (
          <View style={styles.postGrid}>
            {posts.map((post) => (
              <Pressable
                key={post.key}
                style={styles.postCard}
                onPress={() => Linking.openURL(post.url)}
              >
                <Instagram size={32} color="#E4405F" />
                <Text variant="small" fontWeight="600" numberOfLines={1}>
                  {post.postId ? `@ ${post.postId}` : 'Instagram 貼文'}
                </Text>
                <View style={styles.openIcon}>
                  <ExternalLink size={14} color="#FFFFFF" />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {isLoggedIn ? (
        <RouteMediaForm
          ref={formRef}
          routeId={routeId}
          routeName={routeName}
          mediaType="instagram"
          onSubmit={handleShareInstagram}
          isLoading={createStory.isPending}
        />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sectionBar: {
    width: 4,
    height: 20,
    backgroundColor: '#FFE70C',
    borderRadius: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  addButtonText: {
    color: '#2563EB',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.lg,
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
  },
  postGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  postCard: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.md,
    backgroundColor: '#F9FAFB',
    position: 'relative',
    padding: SPACING.sm,
  },
  openIcon: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
