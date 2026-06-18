import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { LogIn, Play, Plus, Youtube } from 'lucide-react-native'
import React from 'react'
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'
import { useRouteAscents } from '@/lib/hooks/useRouteAscents'
import { type RouteStory, useCreateRouteStory, useRouteStories } from '@/lib/hooks/useRouteStories'
import { useAuthStore } from '@/store/authStore'
import { RouteMediaForm, type RouteMediaFormRef } from './RouteMediaForm'

interface StaticLinkedVideo {
  id: string
  title?: string
  youtubeId?: string
  youtube_id?: string
  thumbnailUrl?: string
  thumbnail_url?: string
  channel?: string
}

type StaticVideo = string | StaticLinkedVideo

interface VideoItem {
  url: string
  title?: string
  thumbnailUrl?: string
  channel?: string
  caption?: string
  username?: string
  displayName?: string | null
  source: 'static' | 'user'
  key: string
}

interface RouteYouTubeSectionProps {
  routeId: string
  routeName: string
  staticVideos?: StaticVideo[]
}

function getYoutubeId(url: string) {
  return (
    url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)?.[1] ||
    url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/)?.[1] ||
    url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/)?.[1] ||
    null
  )
}

function getYoutubeThumbnail(url: string) {
  const id = getYoutubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
}

function toStaticVideo(video: StaticVideo, index: number): VideoItem | null {
  if (typeof video === 'string') {
    return {
      url: video,
      thumbnailUrl: getYoutubeThumbnail(video) ?? undefined,
      source: 'static',
      key: `static-url-${index}`,
    }
  }

  const youtubeId = video.youtubeId || video.youtube_id
  if (!youtubeId) return null

  return {
    url: `https://www.youtube.com/watch?v=${youtubeId}`,
    title: video.title,
    thumbnailUrl:
      video.thumbnailUrl ||
      video.thumbnail_url ||
      `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`,
    channel: video.channel,
    source: 'static',
    key: `static-linked-${video.id || youtubeId}-${index}`,
  }
}

function toStoryVideo(story: RouteStory): VideoItem | null {
  if (!story.youtube_url) return null
  return {
    url: story.youtube_url,
    thumbnailUrl: getYoutubeThumbnail(story.youtube_url) ?? undefined,
    caption: story.content,
    username: story.username,
    displayName: story.display_name,
    source: 'user',
    key: `story-${story.id}`,
  }
}

export function RouteYouTubeSection({
  routeId,
  routeName,
  staticVideos = [],
}: RouteYouTubeSectionProps) {
  const router = useRouter()
  const { data: storiesData, isLoading: isStoriesLoading } = useRouteStories(routeId, 20)
  const { ascents, isLoading: isAscentsLoading } = useRouteAscents(routeId, 50)
  const createStory = useCreateRouteStory()
  const formRef = React.useRef<RouteMediaFormRef>(null)
  const { status } = useAuthStore()
  const isLoggedIn = status === 'signIn'

  const staticItems = staticVideos
    .map((video, index) => toStaticVideo(video, index))
    .filter((video): video is VideoItem => !!video)
  const storyItems = (storiesData?.data ?? [])
    .map(toStoryVideo)
    .filter((video): video is VideoItem => !!video)
  const ascentItems: VideoItem[] = ascents
    .filter((ascent) => ascent.youtube_url)
    .map((ascent) => ({
      url: ascent.youtube_url!,
      thumbnailUrl: getYoutubeThumbnail(ascent.youtube_url!) ?? undefined,
      caption: ascent.notes || undefined,
      username: ascent.username,
      displayName: ascent.display_name,
      source: 'user' as const,
      key: `ascent-${ascent.id}`,
    }))
  const videos = [...staticItems, ...storyItems, ...ascentItems]
  const isLoading = isStoriesLoading || isAscentsLoading

  const handleShareVideo = async (data: { content?: string; youtube_url?: string }) => {
    await createStory.mutateAsync({
      route_id: routeId,
      content: data.content || '分享影片',
      youtube_url: data.youtube_url,
      visibility: 'public',
    })
  }

  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionBar} />
            <Youtube size={18} color="#FF0000" />
            <Text variant="body" fontWeight="600">
              YouTube 影片
            </Text>
            {videos.length > 0 ? (
              <Text variant="small" color="textMuted">
                {videos.length} 支
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
        ) : videos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Youtube size={36} color="#D1D5DB" />
            <Text variant="small" color="textMuted">
              目前沒有影片
            </Text>
            <Text variant="caption" color="textMuted">
              成為第一個分享 {routeName} 影片的人
            </Text>
          </View>
        ) : (
          <View style={styles.videoList}>
            {videos.map((video) => (
              <Pressable
                key={video.key}
                style={styles.videoCard}
                onPress={() => Linking.openURL(video.url)}
              >
                <View style={styles.thumbnailContainer}>
                  {video.thumbnailUrl ? (
                    <Image
                      source={{ uri: video.thumbnailUrl }}
                      style={styles.thumbnail}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
                      <Youtube size={32} color="#FF0000" />
                    </View>
                  )}
                  <View style={styles.playIcon}>
                    <Play size={22} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.videoInfo}>
                  <Text variant="body" fontWeight="500" numberOfLines={2}>
                    {video.title || video.caption || `${routeName} 影片`}
                  </Text>
                  {video.channel || video.displayName || video.username ? (
                    <Text variant="small" color="textMuted" numberOfLines={1}>
                      {video.channel || video.displayName || video.username}
                    </Text>
                  ) : null}
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
          mediaType="youtube"
          onSubmit={handleShareVideo}
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
  videoList: {
    gap: SPACING.sm,
  },
  videoCard: {
    flexDirection: 'row',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  thumbnailContainer: {
    width: 132,
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 42,
    height: 42,
    marginTop: -21,
    marginLeft: -21,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.sm,
  },
})
