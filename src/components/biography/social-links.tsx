'use client'

import React from 'react'
import { Instagram, Youtube, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BiographySocialLinks } from '@/lib/types'

interface SocialLinksSectionProps {
  socialLinks: BiographySocialLinks | null
  className?: string
}

/**
 * 社群連結區塊
 * 顯示使用者的 Instagram 和 YouTube 連結
 */
export function SocialLinksSection({ socialLinks, className }: SocialLinksSectionProps) {
  if (!socialLinks) return null

  const { instagram, youtube_channel } = socialLinks
  // 兼容新欄位名稱 youtube
  const youtube = youtube_channel || (socialLinks as { youtube?: string }).youtube

  // 如果沒有任何社群連結，不顯示
  if (!instagram && !youtube) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {instagram && (
        <a
          href={`https://instagram.com/${instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Instagram className="h-4 w-4" />
          <span>@{instagram}</span>
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
      )}

      {youtube && (
        <a
          href={getYouTubeChannelUrl(youtube)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Youtube className="h-4 w-4" />
          <span>{formatYouTubeHandle(youtube)}</span>
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
      )}
    </div>
  )
}

/**
 * 緊湊版社群連結（用於卡片或小空間）
 */
interface CompactSocialLinksProps {
  socialLinks: BiographySocialLinks | null
  className?: string
}

export function CompactSocialLinks({ socialLinks, className }: CompactSocialLinksProps) {
  if (!socialLinks) return null

  const { instagram, youtube_channel } = socialLinks
  // 兼容新欄位名稱 youtube
  const youtube = youtube_channel || (socialLinks as { youtube?: string }).youtube

  if (!instagram && !youtube) return null

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {instagram && (
        <a
          href={`https://instagram.com/${instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-2 text-white transition-opacity hover:opacity-90"
          title={`@${instagram}`}
        >
          <Instagram className="h-4 w-4" />
        </a>
      )}

      {youtube && (
        <a
          href={getYouTubeChannelUrl(youtube)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-red-600 p-2 text-white transition-opacity hover:opacity-90"
          title={formatYouTubeHandle(youtube)}
        >
          <Youtube className="h-4 w-4" />
        </a>
      )}
    </div>
  )
}

// Helper functions
function getYouTubeChannelUrl(channel: string): string {
  // 如果是 @ handle 格式
  if (channel.startsWith('@')) {
    return `https://youtube.com/${channel}`
  }
  // 如果是 channel ID (UC 開頭)
  if (channel.startsWith('UC')) {
    return `https://youtube.com/channel/${channel}`
  }
  // 否則當作 handle 處理
  return `https://youtube.com/@${channel}`
}

function formatYouTubeHandle(channel: string): string {
  // 如果已經是 @ 格式，直接返回
  if (channel.startsWith('@')) {
    return channel
  }
  // 如果是 channel ID，顯示前幾個字元
  if (channel.startsWith('UC')) {
    return 'YouTube'
  }
  // 否則加上 @
  return `@${channel}`
}
