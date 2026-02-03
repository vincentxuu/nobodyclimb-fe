/**
 * VideoPlayer 組件
 *
 * 影片播放器 Modal，對應 apps/web/src/components/videos/video-player.tsx
 * 使用 WebView 播放 YouTube 內嵌影片
 *
 * 注意：需要安裝 react-native-webview
 * pnpm add react-native-webview
 */
import React from 'react'
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  ScrollView,
  Linking,
  Dimensions,
  Image,
} from 'react-native'
import { X, ExternalLink, Play } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS } from '@nobodyclimb/constants'
import { Text } from '@/components/ui/Text'
import { IconButton } from '@/components/ui/IconButton'
import { Button } from '@/components/ui/Button'
import type { Video } from './types'

// 嘗試導入 WebView，如果未安裝則使用備用方案
let WebView: any = null
try {
  WebView = require('react-native-webview').WebView
} catch (e) {
  // WebView 未安裝，使用備用方案
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export interface VideoPlayerProps {
  /** 影片資料 */
  video: Video
  /** 關閉回調 */
  onClose: () => void
  /** 是否顯示 */
  visible: boolean
}

/**
 * 影片播放器
 *
 * @example
 * ```tsx
 * <VideoPlayer
 *   video={selectedVideo}
 *   visible={!!selectedVideo}
 *   onClose={() => setSelectedVideo(null)}
 * />
 * ```
 */
export function VideoPlayer({ video, onClose, visible }: VideoPlayerProps) {
  const insets = useSafeAreaInsets()

  const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`
  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&playsinline=1`

  const handleOpenYouTube = async () => {
    try {
      await Linking.openURL(youtubeUrl)
    } catch (error) {
      console.error('Failed to open YouTube:', error)
    }
  }

  // 計算影片區域高度 (16:9 比例)
  const videoWidth = SCREEN_WIDTH
  const videoHeight = videoWidth * (9 / 16)

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 頂部操作欄 */}
        <View style={styles.header}>
          <IconButton
            icon={X}
            variant="ghost"
            size="md"
            onPress={onClose}
            accessibilityLabel="關閉影片"
          />
        </View>

        {/* 影片區域 */}
        <View style={[styles.videoContainer, { height: videoHeight }]}>
          {WebView ? (
            <WebView
              source={{ uri: embedUrl }}
              style={styles.webview}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
            />
          ) : (
            // WebView 未安裝時的備用方案：顯示縮圖和播放按鈕
            <Pressable style={styles.fallbackContainer} onPress={handleOpenYouTube}>
              <Image
                source={{ uri: video.thumbnailUrl }}
                style={styles.fallbackThumbnail}
                resizeMode="cover"
              />
              <View style={styles.fallbackOverlay}>
                <View style={styles.fallbackPlayButton}>
                  <Play size={48} color="#FFFFFF" fill="#FFFFFF" />
                </View>
                <Text variant="body" style={styles.fallbackText}>
                  點擊在 YouTube 上觀看
                </Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* 影片資訊 */}
        <ScrollView
          style={styles.infoContainer}
          contentContainerStyle={[
            styles.infoContent,
            { paddingBottom: insets.bottom + SPACING[4] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="h4" style={styles.title}>
            {video.title}
          </Text>

          <View style={styles.meta}>
            <Text variant="body" color="textSubtle">
              {video.channel}
            </Text>
            <Text variant="body" color="textMuted">
              •
            </Text>
            <Text variant="body" color="textMuted">
              {video.viewCount} 觀看次數
            </Text>
            <Text variant="body" color="textMuted">
              •
            </Text>
            <Text variant="body" color="textMuted">
              {video.publishedAt}
            </Text>
          </View>

          {/* 在 YouTube 上觀看按鈕 */}
          <Pressable style={styles.youtubeButton} onPress={handleOpenYouTube}>
            <ExternalLink size={16} color={SEMANTIC_COLORS.textSubtle} />
            <Text variant="body" color="textSubtle" style={styles.youtubeText}>
              在 YouTube 上觀看
            </Text>
          </Pressable>

          {/* 影片描述 */}
          {video.description && (
            <View style={styles.descriptionContainer}>
              <Text variant="body" color="textSubtle">
                {video.description}
              </Text>
            </View>
          )}

          {/* 標籤 */}
          {video.tags && video.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {video.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text variant="small" color="textSubtle">
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[2],
  },
  videoContainer: {
    width: '100%',
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  infoContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  infoContent: {
    padding: SPACING[4],
  },
  title: {
    color: '#FFFFFF',
    marginBottom: SPACING[2],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  youtubeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    paddingVertical: SPACING[2],
  },
  youtubeText: {
    textDecorationLine: 'underline',
  },
  descriptionContainer: {
    marginTop: SPACING[4],
    paddingTop: SPACING[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
    marginTop: SPACING[4],
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
  },
  // WebView 未安裝時的備用樣式
  fallbackContainer: {
    flex: 1,
    position: 'relative',
  },
  fallbackThumbnail: {
    width: '100%',
    height: '100%',
  },
  fallbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  fallbackText: {
    color: '#FFFFFF',
  },
})

export default VideoPlayer
