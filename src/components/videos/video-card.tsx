import React from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import type { Video } from '@/lib/types'
import { Play, Eye } from 'lucide-react'

interface VideoCardProps {
  video: Video
  onClick: (video: Video) => void
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const formatDuration = (duration: string) => {
    return duration
  }

  const formatViewCount = (count: string) => {
    return count
  }


  return (
    <Card 
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
      onClick={() => onClick(video)}
    >
      {/* 縮圖容器 */}
      <div className="relative aspect-video overflow-hidden bg-neutral-100">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* 播放按鈕覆蓋層 */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <div className="transform opacity-0 transition-all group-hover:scale-110 group-hover:opacity-100">
            <Play className="h-12 w-12 text-white drop-shadow-lg" fill="white" />
          </div>
        </div>
        
        {/* 影片時長標籤 */}
        <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatDuration(video.duration)}
        </div>

        {/* 精選標籤 */}
        {video.featured && (
          <div className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white">
            精選
          </div>
        )}
      </div>

      {/* 影片資訊 */}
      <div className="p-3">
        <h3 className="mb-1 line-clamp-2 text-sm font-medium text-neutral-800 group-hover:text-neutral-900">
          {video.title}
        </h3>
        
        <p className="mb-2 text-xs text-neutral-600">
          {video.channel}
        </p>
        
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatViewCount(video.viewCount)}
          </span>
        </div>

        {/* 分類標籤 */}
        <div className="mt-2">
          <span className="inline-block rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
            {video.category}
          </span>
        </div>
      </div>
    </Card>
  )
}

export default VideoCard