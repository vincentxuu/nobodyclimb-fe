'use client'

import { ExternalLink, Youtube } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React from 'react'

interface YouTubeLiveCardProps {
  videoId: string
  title?: string
  description?: string
}

export const YouTubeLiveCard: React.FC<YouTubeLiveCardProps> = ({
  videoId,
  title,
  description,
}) => {
  const t = useTranslations('CragPage')
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`
  const displayTitle = title ?? t('youtubeLiveWatchOn')

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center text-xl font-bold">
          <Youtube size={20} className="mr-2 text-red-600" />
          {displayTitle}
        </h3>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          {t('youtubeLiveWatchOn')}
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-900">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1`}
          title={displayTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>

      {description && <p className="mt-3 text-sm text-gray-500">{description}</p>}
    </div>
  )
}
