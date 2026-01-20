'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Play, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import VideoPlayer from '@/components/videos/video-player'
import type { Video } from '@/lib/types'

// 輕量版影片資料介面
interface VideoListItem {
  id: string
  youtubeId: string
  title: string
  thumbnailUrl: string
  channel: string
  duration: string
  viewCount: string
  category: string
}

// 解析時長字串為分鐘數
const parseDuration = (duration: string): number => {
  const parts = duration.split(':').map(Number)
  if (parts.length === 2) {
    return parts[0] // MM:SS -> 返回分鐘數
  } else if (parts.length === 3) {
    return parts[0] * 60 + parts[1] // HH:MM:SS -> 轉為分鐘
  }
  return 0
}

// 解析觀看次數字串為數字
const parseViewCount = (viewCount: string): number => {
  const value = viewCount.replace(/,/g, '')
  if (value.endsWith('M')) {
    return parseFloat(value.slice(0, -1)) * 1000000
  }
  if (value.endsWith('K')) {
    return parseFloat(value.slice(0, -1)) * 1000
  }
  return parseInt(value, 10) || 0
}

// 影片卡片組件
function VideoCard({
  video,
  onClick,
  index,
}: {
  video: Video
  onClick: () => void
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      {/* 縮圖 */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading={index === 0 ? 'eager' : 'lazy'}
        />
        {/* 播放按鈕 */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <motion.div
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <Play className="h-6 w-6 text-[#1B1A1A]" fill="#1B1A1A" />
          </motion.div>
        </div>
        {/* 時長標籤 */}
        <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs font-medium text-white">
          {video.duration}
        </div>
      </div>

      {/* 影片資訊 */}
      <div className="p-4">
        <h3 className="mb-2 line-clamp-2 text-sm font-medium text-[#1B1A1A] group-hover:text-[#3F3D3D]">
          {video.title}
        </h3>
        <p className="mb-2 text-xs text-[#6D6C6C]">{video.channel}</p>
        <div className="flex items-center gap-2 text-xs text-[#8E8C8C]">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {video.viewCount}
          </span>
          <span className="rounded bg-[#F5F5F5] px-1.5 py-0.5 text-[10px]">{video.category}</span>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * 精選影片區組件
 * 顯示 4 個長片，按瀏覽次數排序
 */
export function FeaturedVideosSection() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // 載入前幾個 chunks 來獲取足夠的長片
        const chunksToLoad = [0, 1, 2, 3]
        const allVideos: VideoListItem[] = []

        await Promise.all(
          chunksToLoad.map(async (chunkIndex) => {
            const response = await fetch(`/data/videos-chunks/videos-${chunkIndex}.json`)
            if (response.ok) {
              const data: VideoListItem[] = await response.json()
              allVideos.push(...data)
            }
          })
        )

        // 篩選長片 (>20分鐘) 並按瀏覽次數排序
        const longVideos = allVideos
          .filter((video) => parseDuration(video.duration) >= 20)
          .sort((a, b) => parseViewCount(b.viewCount) - parseViewCount(a.viewCount))
          .slice(0, 4)

        // 轉換為 Video 格式
        const formattedVideos: Video[] = longVideos.map((v) => ({
          id: v.id,
          youtubeId: v.youtubeId,
          title: v.title,
          description: '',
          thumbnailUrl: v.thumbnailUrl,
          channel: v.channel,
          channelId: '',
          publishedAt: '',
          duration: v.duration,
          durationCategory: 'long' as const,
          viewCount: v.viewCount,
          category: v.category as Video['category'],
          tags: [],
          featured: true,
        }))

        setVideos(formattedVideos)
      } catch (err) {
        console.error('Failed to fetch videos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  if (loading) {
    return (
      <section className="border-t border-[#D2D2D2] py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
          </div>
        </div>
      </section>
    )
  }

  if (videos.length === 0) {
    return null
  }

  return (
    <section className="border-t border-[#D2D2D2] py-16 md:py-20">
      <div className="container mx-auto px-4">
        {/* 標題區 */}
        <div className="mb-8 text-center">
          <h2 className="font-['Noto_Sans_TC'] text-[40px] font-medium text-[#1B1A1A]">精選影片</h2>
          <p className="mt-4 font-['Noto_Sans_CJK_TC'] text-base font-normal tracking-[0.01em] text-[#6D6C6C]">
            觀看熱門攀岩長片
          </p>
        </div>

        {/* 影片網格 - 4 欄 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {videos.map((video, index) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => setSelectedVideo(video)}
              index={index}
            />
          ))}
        </div>

        {/* 查看更多按鈕 */}
        <div className="mt-10 flex justify-center">
          <Link href="/videos">
            <Button
              variant="outline"
              className="h-11 border border-[#1B1A1A] px-8 text-base text-[#1B1A1A] hover:bg-[#DBD8D8]"
            >
              查看更多影片
            </Button>
          </Link>
        </div>
      </div>

      {/* 影片播放器彈窗 */}
      {selectedVideo && (
        <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </section>
  )
}
