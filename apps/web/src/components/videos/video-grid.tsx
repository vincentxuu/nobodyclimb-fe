import React from 'react'
import VideoCard from './video-card'
import type { Video } from '@/lib/types'

interface VideoGridProps {
  videos: Video[]
  // eslint-disable-next-line no-unused-vars
  onVideoClick: (_video: Video) => void
}

const VideoGrid: React.FC<VideoGridProps> = ({ videos, onVideoClick }) => {
  if (videos.length === 0) {
    return null
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onClick={onVideoClick}
        />
      ))}
    </div>
  )
}

export default VideoGrid