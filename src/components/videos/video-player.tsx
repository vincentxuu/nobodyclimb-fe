import React, { useEffect } from 'react'
import type { Video } from '@/lib/types'
import { X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoPlayerProps {
  video: Video
  onClose: () => void
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose }) => {
  // 防止背景滾動
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // 處理ESC鍵關閉
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`
  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-6xl">
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-neutral-300 transition-colors"
          aria-label="關閉影片"
        >
          <X className="h-8 w-8" />
        </button>

        {/* 影片容器 */}
        <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
          <div className="relative aspect-video">
            <iframe
              src={embedUrl}
              title={video.title}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* 影片資訊 */}
        <div className="mt-4 space-y-2 text-white">
          <h2 className="text-xl font-medium">{video.title}</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-neutral-300">
              <span>{video.channel}</span>
              <span>•</span>
              <span>{video.viewCount} 觀看次數</span>
              <span>•</span>
              <span>{video.publishedAt}</span>
            </div>
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-neutral-300 hover:text-white transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              在 YouTube 上觀看
            </a>
          </div>
          {video.description && (
            <p className="text-sm text-neutral-300 line-clamp-2">
              {video.description}
            </p>
          )}
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {video.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs text-neutral-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer