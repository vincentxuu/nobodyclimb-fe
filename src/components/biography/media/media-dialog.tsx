'use client'

import React, { useState, useCallback } from 'react'
import { Youtube, Instagram, Plus, Loader2, X, Star, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mediaService } from '@/lib/api/services'
import { BiographyVideo, BiographyInstagram, BiographyVideoRelationType, BiographyInstagramRelationType } from '@/lib/types'
import { extractYoutubeVideoId } from './youtube-embed'
import { extractInstagramShortcode } from './instagram-embed'

interface AddMediaDialogProps {
  type: 'youtube' | 'instagram'
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * 新增媒體對話框
 */
export function AddMediaDialog({
  type,
  isOpen,
  onClose,
  onSuccess,
}: AddMediaDialogProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{
    title?: string
    thumbnail?: string
    channelName?: string
    videoId?: string
    shortcode?: string
  } | null>(null)
  const [relationType, setRelationType] = useState<string>(
    type === 'youtube' ? 'own_content' : 'own_post'
  )
  const [isFeatured, setIsFeatured] = useState(false)

  const resetForm = useCallback(() => {
    setUrl('')
    setError(null)
    setPreview(null)
    setRelationType(type === 'youtube' ? 'own_content' : 'own_post')
    setIsFeatured(false)
  }, [type])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const handleFetchInfo = async () => {
    setError(null)
    setPreview(null)

    if (type === 'youtube') {
      const videoId = extractYoutubeVideoId(url)
      if (!videoId) {
        setError('請輸入有效的 YouTube 網址')
        return
      }

      setLoading(true)
      try {
        const response = await mediaService.fetchYoutubeInfo(url)
        if (response.success && response.data) {
          setPreview({
            videoId: response.data.video_id,
            title: response.data.title,
            thumbnail: response.data.thumbnails.high,
            channelName: response.data.channel_name,
          })
        }
      } catch {
        setError('無法取得影片資訊，請確認網址是否正確')
      } finally {
        setLoading(false)
      }
    } else {
      const shortcode = extractInstagramShortcode(url)
      if (!shortcode) {
        setError('請輸入有效的 Instagram 網址')
        return
      }

      setLoading(true)
      try {
        const response = await mediaService.fetchInstagramInfo(url)
        if (response.success && response.data) {
          setPreview({
            shortcode: response.data.shortcode,
            thumbnail: response.data.thumbnail_url || undefined,
          })
        }
      } catch {
        setError('無法取得貼文資訊，請確認網址是否正確')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSubmit = async () => {
    if (!preview) return

    setLoading(true)
    setError(null)

    try {
      if (type === 'youtube' && preview.videoId) {
        await mediaService.addVideo({
          video_id: preview.videoId,
          relation_type: relationType as BiographyVideoRelationType,
          is_featured: isFeatured,
        })
      } else if (type === 'instagram' && preview.shortcode) {
        await mediaService.addInstagram({
          instagram_url: url,
          instagram_shortcode: preview.shortcode,
          relation_type: relationType as BiographyInstagramRelationType,
          is_featured: isFeatured,
        })
      }

      onSuccess()
      handleClose()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      if (error.response?.data?.message?.includes('already')) {
        setError('此媒體已新增過')
      } else {
        setError('新增失敗，請稍後再試')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const relationTypeOptions =
    type === 'youtube'
      ? [
          { value: 'own_content', label: '自己的內容' },
          { value: 'featured_in', label: '出現在此影片' },
          { value: 'mentioned', label: '被提及' },
          { value: 'recommended', label: '推薦' },
          { value: 'completion_proof', label: '完攀證明' },
        ]
      : [
          { value: 'own_post', label: '自己的貼文' },
          { value: 'tagged', label: '被標記' },
          { value: 'mentioned', label: '被提及' },
          { value: 'completion_proof', label: '完攀證明' },
        ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {type === 'youtube' ? (
              <Youtube className="h-5 w-5 text-red-600" />
            ) : (
              <Instagram className="h-5 w-5 text-pink-600" />
            )}
            <h3 className="text-lg font-semibold">
              新增 {type === 'youtube' ? 'YouTube 影片' : 'Instagram 貼文'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* URL Input */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {type === 'youtube' ? 'YouTube 網址' : 'Instagram 網址'}
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                type === 'youtube'
                  ? 'https://www.youtube.com/watch?v=...'
                  : 'https://www.instagram.com/p/...'
              }
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleFetchInfo}
              disabled={!url || loading}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                '預覽'
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="mb-4 rounded-lg border border-gray-200 p-3">
            <div className="flex gap-3">
              {preview.thumbnail && (
                <img
                  src={preview.thumbnail}
                  alt="Preview"
                  className="h-20 w-32 rounded object-cover"
                />
              )}
              <div className="flex-1">
                {preview.title && (
                  <p className="line-clamp-2 text-sm font-medium">
                    {preview.title}
                  </p>
                )}
                {preview.channelName && (
                  <p className="mt-1 text-xs text-gray-500">
                    {preview.channelName}
                  </p>
                )}
                {!preview.title && preview.shortcode && (
                  <p className="text-sm text-gray-600">
                    Instagram 貼文: {preview.shortcode}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Options */}
        {preview && (
          <>
            {/* Relation Type */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                關聯類型
              </label>
              <select
                value={relationType}
                onChange={(e) => setRelationType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {relationTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured */}
            <div className="mb-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">設為精選</span>
              </label>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!preview || loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              '新增'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * 媒體項目操作選單
 */
interface MediaItemActionsProps {
  item: BiographyVideo | BiographyInstagram
  type: 'youtube' | 'instagram'
  onUpdate: () => void
  onDelete: () => void
}

export function MediaItemActions({
  item,
  type,
  onUpdate,
  onDelete,
}: MediaItemActionsProps) {
  const [loading, setLoading] = useState(false)

  const handleToggleFeatured = async () => {
    setLoading(true)
    try {
      if (type === 'youtube') {
        await mediaService.updateVideo(item.id, {
          is_featured: !item.is_featured,
        })
      } else {
        await mediaService.updateInstagram(item.id, {
          is_featured: !item.is_featured,
        })
      }
      onUpdate()
    } catch {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('確定要移除此媒體嗎？')) return

    setLoading(true)
    try {
      if (type === 'youtube') {
        await mediaService.deleteVideo(item.id)
      } else {
        await mediaService.deleteInstagram(item.id)
      }
      onDelete()
    } catch {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleToggleFeatured}
        disabled={loading}
        className={cn(
          'rounded p-1.5 transition-colors',
          item.is_featured
            ? 'bg-yellow-100 text-yellow-600'
            : 'text-gray-400 hover:bg-gray-100 hover:text-yellow-600'
        )}
        title={item.is_featured ? '取消精選' : '設為精選'}
      >
        <Star
          className="h-4 w-4"
          fill={item.is_featured ? 'currentColor' : 'none'}
        />
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
        title="移除"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
