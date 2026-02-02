/**
 * BucketListCompletionForm 組件
 *
 * 心願完成表單，用於填寫完成故事和心得
 * 對應 apps/web/src/components/bucket-list/bucket-list-completion-form.tsx
 */
import React, { useState, useCallback } from 'react'
import { StyleSheet, View, ScrollView, Pressable } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, X, Plus, Youtube, Image as ImageIcon } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'
import { completeBucketListSchema, type CompleteBucketListInput } from '@nobodyclimb/schemas'
import type { BucketListItem } from '@nobodyclimb/types'
import { Text } from '../ui/Text'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { TextArea } from '../ui/TextArea'
import { Label } from '../ui/Label'

export interface BucketListCompletionFormProps {
  /** 要完成的目標 */
  item: BucketListItem
  /** 提交回調 */
  onSubmit: (data: CompleteBucketListInput) => void
  /** 取消回調 */
  onCancel: () => void
  /** 載入中狀態 */
  isLoading?: boolean
}

/**
 * 心願完成表單
 */
export function BucketListCompletionForm({
  item,
  onSubmit,
  onCancel,
  isLoading = false,
}: BucketListCompletionFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompleteBucketListInput>({
    resolver: zodResolver(completeBucketListSchema),
    defaultValues: {
      completion_story: item.completion_story || '',
      psychological_insights: item.psychological_insights || '',
      technical_insights: item.technical_insights || '',
      completion_media: item.completion_media || {
        youtube_videos: [],
        instagram_posts: [],
        photos: [],
      },
    },
  })

  const completionMedia = watch('completion_media') || {
    youtube_videos: [],
    instagram_posts: [],
    photos: [],
  }

  // YouTube 影片管理
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('')

  const addYoutubeVideo = useCallback(() => {
    if (!newYoutubeUrl.trim()) return

    const videoId = extractYoutubeVideoId(newYoutubeUrl)
    if (!videoId) {
      // TODO: 顯示錯誤提示
      return
    }

    const currentVideos = completionMedia.youtube_videos || []
    if (!currentVideos.includes(videoId)) {
      setValue('completion_media', {
        ...completionMedia,
        youtube_videos: [...currentVideos, videoId],
      })
    }
    setNewYoutubeUrl('')
  }, [newYoutubeUrl, completionMedia, setValue])

  const removeYoutubeVideo = useCallback(
    (videoId: string) => {
      setValue('completion_media', {
        ...completionMedia,
        youtube_videos: (completionMedia.youtube_videos || []).filter(
          (id) => id !== videoId
        ),
      })
    },
    [completionMedia, setValue]
  )

  // Instagram 貼文管理
  const [newInstagramUrl, setNewInstagramUrl] = useState('')

  const addInstagramPost = useCallback(() => {
    if (!newInstagramUrl.trim()) return

    const shortcode = extractInstagramShortcode(newInstagramUrl)
    if (!shortcode) {
      // TODO: 顯示錯誤提示
      return
    }

    const currentPosts = completionMedia.instagram_posts || []
    if (!currentPosts.includes(shortcode)) {
      setValue('completion_media', {
        ...completionMedia,
        instagram_posts: [...currentPosts, shortcode],
      })
    }
    setNewInstagramUrl('')
  }, [newInstagramUrl, completionMedia, setValue])

  const removeInstagramPost = useCallback(
    (shortcode: string) => {
      setValue('completion_media', {
        ...completionMedia,
        instagram_posts: (completionMedia.instagram_posts || []).filter(
          (s) => s !== shortcode
        ),
      })
    },
    [completionMedia, setValue]
  )

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Check size={24} color={SEMANTIC_COLORS.textMain} />
        </View>
        <View style={styles.headerContent}>
          <Text variant="h4">恭喜完成目標！</Text>
          <Text variant="body" color="textSubtle">
            {item.title}
          </Text>
        </View>
      </View>

      {/* 完成故事 */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Label>完成故事</Label>
          <Text variant="caption" color="textSubtle">
            （選填）
          </Text>
        </View>
        <Text variant="caption" color="textSubtle" style={styles.hint}>
          分享你完成這個目標的過程和心得，讓其他岩友也能從中學習
        </Text>
        <Controller
          control={control}
          name="completion_story"
          render={({ field: { onChange, value } }) => (
            <TextArea
              value={value || ''}
              onChangeText={onChange}
              placeholder="例如：終於在這個週末完成了這條期待已久的路線！花了整整三個月準備..."
              minRows={5}
              error={!!errors.completion_story}
            />
          )}
        />
        {errors.completion_story && (
          <Text variant="caption" style={styles.errorText}>
            {errors.completion_story.message}
          </Text>
        )}
      </View>

      {/* 心理層面心得 */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Label>心理層面</Label>
          <Text variant="caption" color="textSubtle">
            （選填）
          </Text>
        </View>
        <Text variant="caption" color="textSubtle" style={styles.hint}>
          在完成這個目標的過程中，你在心理上有什麼感受或成長？
        </Text>
        <Controller
          control={control}
          name="psychological_insights"
          render={({ field: { onChange, value } }) => (
            <TextArea
              value={value || ''}
              onChangeText={onChange}
              placeholder="例如：前兩次失敗讓我很沮喪，但教練說這是正常的，重要的是從每次嘗試中學習..."
              minRows={3}
              error={!!errors.psychological_insights}
            />
          )}
        />
        {errors.psychological_insights && (
          <Text variant="caption" style={styles.errorText}>
            {errors.psychological_insights.message}
          </Text>
        )}
      </View>

      {/* 技術層面心得 */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Label>技術層面</Label>
          <Text variant="caption" color="textSubtle">
            （選填）
          </Text>
        </View>
        <Text variant="caption" color="textSubtle" style={styles.hint}>
          有什麼技術上的心得可以分享？（如動作技巧、路線解析、裝備選擇等）
        </Text>
        <Controller
          control={control}
          name="technical_insights"
          render={({ field: { onChange, value } }) => (
            <TextArea
              value={value || ''}
              onChangeText={onChange}
              placeholder="例如：這條路線的 crux 在第三段，需要用側拉配合高舉腳，放保護點要特別注意..."
              minRows={3}
              error={!!errors.technical_insights}
            />
          )}
        />
        {errors.technical_insights && (
          <Text variant="caption" style={styles.errorText}>
            {errors.technical_insights.message}
          </Text>
        )}
      </View>

      {/* 媒體附件 */}
      <View style={styles.section}>
        <Label>相關媒體（選填）</Label>

        {/* YouTube 影片 */}
        <View style={styles.mediaSection}>
          <View style={styles.mediaHeader}>
            <Youtube size={16} color="#FF0000" />
            <Text variant="bodyBold">YouTube 影片</Text>
          </View>

          {/* 已新增的影片 */}
          {(completionMedia.youtube_videos || []).length > 0 && (
            <View style={styles.mediaList}>
              {(completionMedia.youtube_videos || []).map((videoId) => (
                <View key={videoId} style={styles.mediaItem}>
                  <Text variant="body" color="textSubtle" style={styles.mediaUrl}>
                    youtube.com/watch?v={videoId}
                  </Text>
                  <Pressable onPress={() => removeYoutubeVideo(videoId)}>
                    <X size={16} color={SEMANTIC_COLORS.textSubtle} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* 新增影片 */}
          <View style={styles.addMediaRow}>
            <Input
              value={newYoutubeUrl}
              onChangeText={setNewYoutubeUrl}
              placeholder="貼上 YouTube 影片網址"
              containerStyle={styles.mediaInput}
            />
            <Button
              variant="secondary"
              size="sm"
              onPress={addYoutubeVideo}
            >
              <Plus size={16} color={SEMANTIC_COLORS.textMain} />
            </Button>
          </View>
        </View>

        {/* Instagram 貼文 */}
        <View style={styles.mediaSection}>
          <View style={styles.mediaHeader}>
            <View style={styles.instagramIcon} />
            <Text variant="bodyBold">Instagram 貼文</Text>
          </View>

          {/* 已新增的貼文 */}
          {(completionMedia.instagram_posts || []).length > 0 && (
            <View style={styles.mediaList}>
              {(completionMedia.instagram_posts || []).map((shortcode) => (
                <View key={shortcode} style={styles.mediaItem}>
                  <Text variant="body" color="textSubtle" style={styles.mediaUrl}>
                    instagram.com/p/{shortcode}
                  </Text>
                  <Pressable onPress={() => removeInstagramPost(shortcode)}>
                    <X size={16} color={SEMANTIC_COLORS.textSubtle} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* 新增貼文 */}
          <View style={styles.addMediaRow}>
            <Input
              value={newInstagramUrl}
              onChangeText={setNewInstagramUrl}
              placeholder="貼上 Instagram 貼文網址"
              containerStyle={styles.mediaInput}
            />
            <Button
              variant="secondary"
              size="sm"
              onPress={addInstagramPost}
            >
              <Plus size={16} color={SEMANTIC_COLORS.textMain} />
            </Button>
          </View>
        </View>

        {/* 照片上傳提示 */}
        <View style={styles.photoPlaceholder}>
          <ImageIcon size={32} color={SEMANTIC_COLORS.textMuted} />
          <Text variant="body" color="textSubtle" style={styles.photoPlaceholderText}>
            照片上傳功能即將推出
          </Text>
        </View>
      </View>

      {/* 按鈕 */}
      <View style={styles.buttons}>
        <Button variant="ghost" onPress={onCancel} disabled={isLoading}>
          稍後再填
        </Button>
        <Button
          variant="primary"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
        >
          完成並儲存
        </Button>
      </View>
    </ScrollView>
  )
}

/**
 * 從 YouTube URL 提取影片 ID
 */
function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

/**
 * 從 Instagram URL 提取 shortcode
 */
function extractInstagramShortcode(url: string): string | null {
  const patterns = [
    /instagram\.com\/p\/([a-zA-Z0-9_-]+)/,
    /instagram\.com\/reel\/([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[4],
    backgroundColor: `${SEMANTIC_COLORS.brand}33`,
    gap: SPACING[3],
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SEMANTIC_COLORS.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  section: {
    padding: SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: '#EBEAEA',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  hint: {
    marginTop: SPACING[1],
    marginBottom: SPACING[2],
  },
  errorText: {
    color: '#DC2626',
    marginTop: SPACING[1],
  },
  mediaSection: {
    marginTop: SPACING[4],
    padding: SPACING[3],
    borderWidth: 1,
    borderColor: '#EBEAEA',
    borderRadius: RADIUS.md,
  },
  mediaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  instagramIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#E1306C',
  },
  mediaList: {
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.sm,
  },
  mediaUrl: {
    flex: 1,
    marginRight: SPACING[2],
  },
  addMediaRow: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  mediaInput: {
    flex: 1,
  },
  photoPlaceholder: {
    marginTop: SPACING[4],
    padding: SPACING[4],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D3D3D3',
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    marginTop: SPACING[2],
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING[4],
    gap: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: '#EBEAEA',
  },
})
