'use client'

import React from 'react'
import { Youtube, ExternalLink } from 'lucide-react'

interface YouTubeLiveCardProps {
  videoId: string
  title?: string
}

export const YouTubeLiveCard: React.FC<YouTubeLiveCardProps> = ({
  videoId,
  title = '即時影像',
}) => {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center text-xl font-bold">
          <Youtube size={20} className="mr-2 text-red-600" />
          {title}
        </h3>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          在 YouTube 觀看
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-900">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>

      <p className="mt-3 text-sm text-gray-500">
        龍洞岩場周邊即時影像，可了解當地天氣與海況
      </p>
    </div>
  )
}
