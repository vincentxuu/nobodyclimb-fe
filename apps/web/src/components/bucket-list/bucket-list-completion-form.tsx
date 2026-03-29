'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Image as ImageIcon, Instagram, Plus, X, Youtube } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type BucketListCompleteSchema, bucketListCompleteSchema } from '@/lib/schemas/bucket-list'
import type { BucketListItem } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BucketListCompletionFormProps {
  item: BucketListItem
  onSubmit: (data: BucketListCompleteSchema) => void // eslint-disable-line no-unused-vars
  onCancel: () => void
  isLoading?: boolean
  className?: string
}

/**
 * 完成目標表單組件
 * 用於填寫完成故事和心得
 */
export function BucketListCompletionForm({
  item,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: BucketListCompletionFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BucketListCompleteSchema>({
    resolver: zodResolver(bucketListCompleteSchema),
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
  const [newYoutubeUrl, setNewYoutubeUrl] = React.useState('')

  const addYoutubeVideo = () => {
    if (!newYoutubeUrl.trim()) return

    // 從 URL 提取影片 ID
    const videoId = extractYoutubeVideoId(newYoutubeUrl)
    if (!videoId) {
      alert('請輸入有效的 YouTube 影片網址')
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
  }

  const removeYoutubeVideo = (videoId: string) => {
    setValue('completion_media', {
      ...completionMedia,
      youtube_videos: (completionMedia.youtube_videos || []).filter((id) => id !== videoId),
    })
  }

  // Instagram 貼文管理
  const [newInstagramUrl, setNewInstagramUrl] = React.useState('')

  const addInstagramPost = () => {
    if (!newInstagramUrl.trim()) return

    // 從 URL 提取 shortcode
    const shortcode = extractInstagramShortcode(newInstagramUrl)
    if (!shortcode) {
      alert('請輸入有效的 Instagram 貼文網址')
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
  }

  const removeInstagramPost = (shortcode: string) => {
    setValue('completion_media', {
      ...completionMedia,
      instagram_posts: (completionMedia.instagram_posts || []).filter((s) => s !== shortcode),
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 rounded-lg bg-[#FAF40A]/20 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF40A]">
          <Check className="h-6 w-6 text-[#1B1A1A]" />
        </div>
        <div>
          <h3 className="font-medium text-[#1B1A1A]">恭喜完成目標！</h3>
          <p className="text-sm text-gray-600">{item.title}</p>
        </div>
      </div>

      {/* 完成故事 */}
      <div>
        <Label htmlFor="completion_story">
          完成故事
          <span className="ml-1 text-sm font-normal text-gray-500">（選填）</span>
        </Label>
        <p className="mb-2 text-sm text-gray-500">
          分享你完成這個目標的過程和心得，讓其他岩友也能從中學習
        </p>
        <Textarea
          id="completion_story"
          placeholder="例如：終於在這個週末完成了這條期待已久的路線！花了整整三個月準備..."
          {...register('completion_story')}
          className="min-h-[150px]"
        />
        {errors.completion_story && (
          <p className="mt-1 text-sm text-red-500">{errors.completion_story.message}</p>
        )}
      </div>

      {/* 心理層面心得 */}
      <div>
        <Label htmlFor="psychological_insights">
          💭 心理層面
          <span className="ml-1 text-sm font-normal text-gray-500">（選填）</span>
        </Label>
        <p className="mb-2 text-sm text-gray-500">
          在完成這個目標的過程中，你在心理上有什麼感受或成長？
        </p>
        <Textarea
          id="psychological_insights"
          placeholder="例如：前兩次失敗讓我很沮喪，但教練說這是正常的，重要的是從每次嘗試中學習..."
          {...register('psychological_insights')}
          className="min-h-[100px]"
        />
        {errors.psychological_insights && (
          <p className="mt-1 text-sm text-red-500">{errors.psychological_insights.message}</p>
        )}
      </div>

      {/* 技術層面心得 */}
      <div>
        <Label htmlFor="technical_insights">
          🧗 技術層面
          <span className="ml-1 text-sm font-normal text-gray-500">（選填）</span>
        </Label>
        <p className="mb-2 text-sm text-gray-500">
          有什麼技術上的心得可以分享？（如動作技巧、路線解析、裝備選擇等）
        </p>
        <Textarea
          id="technical_insights"
          placeholder="例如：這條路線的 crux 在第三段，需要用側拉配合高舉腳，放保護點要特別注意..."
          {...register('technical_insights')}
          className="min-h-[100px]"
        />
        {errors.technical_insights && (
          <p className="mt-1 text-sm text-red-500">{errors.technical_insights.message}</p>
        )}
      </div>

      {/* 媒體附件 */}
      <div className="space-y-4">
        <Label>相關媒體（選填）</Label>

        {/* YouTube 影片 */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#1B1A1A]">
            <Youtube className="h-4 w-4 text-red-500" />
            YouTube 影片
          </div>

          {/* 已新增的影片 */}
          {(completionMedia.youtube_videos || []).length > 0 && (
            <div className="mt-3 space-y-2">
              {(completionMedia.youtube_videos || []).map((videoId) => (
                <div
                  key={videoId}
                  className="flex items-center justify-between rounded bg-gray-50 px-3 py-2"
                >
                  <span className="text-sm text-gray-600">youtube.com/watch?v={videoId}</span>
                  <button
                    type="button"
                    onClick={() => removeYoutubeVideo(videoId)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 新增影片 */}
          <div className="mt-3 flex gap-2">
            <Input
              value={newYoutubeUrl}
              onChange={(e) => setNewYoutubeUrl(e.target.value)}
              placeholder="貼上 YouTube 影片網址"
              className="flex-1"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addYoutubeVideo}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Instagram 貼文 */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#1B1A1A]">
            <Instagram className="h-4 w-4 text-pink-500" />
            Instagram 貼文
          </div>

          {/* 已新增的貼文 */}
          {(completionMedia.instagram_posts || []).length > 0 && (
            <div className="mt-3 space-y-2">
              {(completionMedia.instagram_posts || []).map((shortcode) => (
                <div
                  key={shortcode}
                  className="flex items-center justify-between rounded bg-gray-50 px-3 py-2"
                >
                  <span className="text-sm text-gray-600">instagram.com/p/{shortcode}</span>
                  <button
                    type="button"
                    onClick={() => removeInstagramPost(shortcode)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 新增貼文 */}
          <div className="mt-3 flex gap-2">
            <Input
              value={newInstagramUrl}
              onChange={(e) => setNewInstagramUrl(e.target.value)}
              placeholder="貼上 Instagram 貼文網址"
              className="flex-1"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addInstagramPost}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 照片上傳提示 */}
        <div className="rounded-lg border border-dashed p-4 text-center text-gray-500">
          <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm">照片上傳功能即將推出</p>
        </div>
      </div>

      {/* 按鈕 */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          稍後再填
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '儲存中...' : '完成並儲存'}
        </Button>
      </div>
    </form>
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
