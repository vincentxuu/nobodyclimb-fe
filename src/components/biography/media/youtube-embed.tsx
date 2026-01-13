'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface YouTubeEmbedProps {
  videoId: string
  title?: string
  thumbnail?: 'default' | 'medium' | 'high' | 'maxres'
  aspectRatio?: '16/9' | '4/3' | '1/1'
  autoplay?: boolean
  className?: string
}

/**
 * YouTube 影片嵌入組件
 * 使用漸進式載入：先顯示縮圖，點擊後載入 iframe
 */
export function YouTubeEmbed({
  videoId,
  title,
  thumbnail = 'high',
  aspectRatio = '16/9',
  autoplay = true,
  className,
}: YouTubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  const thumbnailUrls = {
    default: `https://i.ytimg.com/vi/${videoId}/default.jpg`,
    medium: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    high: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    maxres: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0`

  const handleClick = () => {
    setIsLoaded(true)
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg bg-gray-900',
        className
      )}
      style={{ aspectRatio }}
    >
      {isLoaded ? (
        <iframe
          src={embedUrl}
          title={title || 'YouTube video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          onClick={handleClick}
          className="group absolute inset-0 flex cursor-pointer items-center justify-center"
          aria-label={`播放影片: ${title || videoId}`}
        >
          <Image
            src={thumbnailUrls[thumbnail]}
            alt={title || `YouTube video ${videoId}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-red-600 transition-transform group-hover:scale-110">
            <Play className="h-8 w-8 text-white" fill="white" />
          </div>
        </button>
      )}
    </div>
  )
}

/**
 * YouTube 影片卡片組件
 * 帶有標題和頻道資訊
 */
interface YouTubeVideoCardProps extends YouTubeEmbedProps {
  channelName?: string
  onRemove?: () => void
  showRemoveButton?: boolean
}

export function YouTubeVideoCard({
  videoId,
  title,
  channelName,
  thumbnail = 'medium',
  onRemove,
  showRemoveButton = false,
  className,
}: YouTubeVideoCardProps) {
  return (
    <div className={cn('group relative', className)}>
      <YouTubeEmbed
        videoId={videoId}
        title={title}
        thumbnail={thumbnail}
        className="rounded-lg"
      />
      {(title || channelName) && (
        <div className="mt-2">
          {title && (
            <h4 className="line-clamp-2 text-sm font-medium text-gray-900">
              {title}
            </h4>
          )}
          {channelName && (
            <p className="mt-0.5 text-xs text-gray-500">{channelName}</p>
          )}
        </div>
      )}
      {showRemoveButton && onRemove && (
        <button
          onClick={onRemove}
          className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity hover:bg-black group-hover:opacity-100"
          aria-label="移除影片"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

/**
 * 從 YouTube URL 中提取 video ID
 */
export function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}
