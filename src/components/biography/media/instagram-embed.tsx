'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Instagram, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BiographyInstagram, InstagramMediaType } from '@/lib/types'

interface InstagramEmbedProps {
  shortcode: string
  caption?: string | null
  thumbnailUrl?: string | null
  mediaType?: InstagramMediaType | null
  className?: string
}

/**
 * Instagram 貼文嵌入組件
 * 使用 Instagram embed 或顯示連結卡片
 */
export function InstagramEmbed({
  shortcode,
  className,
}: InstagramEmbedProps) {
  const [embedLoaded, setEmbedLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const instagramUrl = `https://www.instagram.com/p/${shortcode}/`

  useEffect(() => {
    // Load Instagram embed script if not already loaded
    if (typeof window !== 'undefined' && !(window as unknown as { instgrm?: { Embeds?: { process: () => void } } }).instgrm) {
      const script = document.createElement('script')
      script.src = 'https://www.instagram.com/embed.js'
      script.async = true
      script.onload = () => {
        setEmbedLoaded(true)
        ;(window as unknown as { instgrm?: { Embeds?: { process: () => void } } }).instgrm?.Embeds?.process()
      }
      document.body.appendChild(script)
    } else {
      setEmbedLoaded(true)
      ;(window as unknown as { instgrm?: { Embeds?: { process: () => void } } }).instgrm?.Embeds?.process()
    }
  }, [])

  useEffect(() => {
    if (embedLoaded && containerRef.current) {
      ;(window as unknown as { instgrm?: { Embeds?: { process: () => void } } }).instgrm?.Embeds?.process()
    }
  }, [embedLoaded, shortcode])

  return (
    <div
      ref={containerRef}
      className={cn('instagram-embed-container', className)}
    >
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={instagramUrl}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          borderRadius: '3px',
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
          margin: '1px',
          maxWidth: '540px',
          minWidth: '326px',
          padding: 0,
          width: '100%',
        }}
      >
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 text-center"
        >
          在 Instagram 上查看此貼文
        </a>
      </blockquote>
    </div>
  )
}

/**
 * Instagram 貼文卡片組件
 * 簡潔的卡片式展示
 */
interface InstagramCardProps {
  shortcode: string
  caption?: string | null
  thumbnailUrl?: string | null
  mediaType?: InstagramMediaType | null
  onRemove?: () => void
  showRemoveButton?: boolean
  className?: string
}

export function InstagramCard({
  shortcode,
  caption,
  thumbnailUrl,
  mediaType,
  onRemove,
  showRemoveButton = false,
  className,
}: InstagramCardProps) {
  const instagramUrl = `https://www.instagram.com/p/${shortcode}/`

  const getMediaTypeLabel = (type: InstagramMediaType | null | undefined) => {
    switch (type) {
      case 'VIDEO':
        return '影片'
      case 'REEL':
        return 'Reel'
      case 'CAROUSEL':
        return '多圖貼文'
      case 'IMAGE':
      default:
        return '圖片'
    }
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-gray-200 bg-white',
        className
      )}
    >
      {/* Thumbnail or Placeholder */}
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-square"
      >
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={caption || 'Instagram post'}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
            <Instagram className="h-12 w-12 text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />

        {/* Media type badge */}
        {mediaType && (
          <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
            {getMediaTypeLabel(mediaType)}
          </span>
        )}

        {/* External link icon */}
        <div className="absolute bottom-2 right-2 rounded-full bg-black/70 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <ExternalLink className="h-4 w-4 text-white" />
        </div>
      </a>

      {/* Caption */}
      {caption && (
        <div className="p-3">
          <p className="line-clamp-2 text-sm text-gray-600">{caption}</p>
        </div>
      )}

      {/* Remove button */}
      {showRemoveButton && onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault()
            onRemove()
          }}
          className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity hover:bg-black group-hover:opacity-100"
          aria-label="移除貼文"
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
 * 從 Instagram URL 中提取 shortcode
 */
export function extractInstagramShortcode(url: string): string | null {
  const patterns = [
    /instagram\.com\/p\/([^/?]+)/,
    /instagram\.com\/reel\/([^/?]+)/,
    /instagram\.com\/tv\/([^/?]+)/,
    /^([a-zA-Z0-9_-]+)$/, // Direct shortcode
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Instagram 貼文列表組件
 */
interface InstagramPostListProps {
  posts: BiographyInstagram[]
  onRemove?: (id: string) => void
  editable?: boolean
  className?: string
}

export function InstagramPostList({
  posts,
  onRemove,
  editable = false,
  className,
}: InstagramPostListProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <Instagram className="mb-2 h-8 w-8" />
        <p className="text-sm">尚未新增 Instagram 貼文</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4',
        className
      )}
    >
      {posts.map((post) => (
        <InstagramCard
          key={post.id}
          shortcode={post.instagram_shortcode}
          caption={post.caption}
          thumbnailUrl={post.thumbnail_url}
          mediaType={post.media_type}
          showRemoveButton={editable}
          onRemove={() => onRemove?.(post.id)}
        />
      ))}
    </div>
  )
}
