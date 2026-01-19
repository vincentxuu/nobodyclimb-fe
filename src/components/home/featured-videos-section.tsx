'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Play, Eye, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import VideoPlayer from '@/components/videos/video-player'
import type { Video } from '@/lib/types'

// 大型影片卡片組件
function LargeVideoCard({ video, onClick }: { video: Video; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      {/* 縮圖 */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* 播放按鈕 */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <motion.div
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <Play className="h-8 w-8 text-[#1B1A1A]" fill="#1B1A1A" />
          </motion.div>
        </div>
        {/* 時長標籤 */}
        <div className="absolute bottom-3 right-3 rounded bg-black/80 px-2 py-1 text-sm font-medium text-white">
          {video.duration}
        </div>
        {/* 精選標籤 */}
        {video.featured && (
          <div className="absolute left-3 top-3 rounded bg-[#FFE70C] px-2 py-1 text-xs font-medium text-[#1B1A1A]">
            精選
          </div>
        )}
      </div>

      {/* 影片資訊 */}
      <div className="p-5">
        <h3 className="mb-2 line-clamp-2 text-lg font-medium text-[#1B1A1A] group-hover:text-[#3F3D3D]">
          {video.title}
        </h3>
        <p className="mb-3 text-sm text-[#6D6C6C]">{video.channel}</p>
        <div className="flex items-center gap-4 text-sm text-[#8E8C8C]">
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {video.viewCount}
          </span>
          <span className="rounded bg-[#F5F5F5] px-2 py-0.5 text-xs">{video.category}</span>
        </div>
      </div>
    </motion.div>
  )
}

// 小型影片卡片組件
function SmallVideoCard({
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
      className="group flex cursor-pointer gap-4 rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      {/* 縮圖 */}
      <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded bg-gray-100">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          sizes="160px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* 播放按鈕 */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <Play className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" fill="white" />
        </div>
        {/* 時長標籤 */}
        <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
          {video.duration}
        </div>
      </div>

      {/* 影片資訊 */}
      <div className="flex flex-col justify-center">
        <h3 className="mb-1 line-clamp-2 text-sm font-medium text-[#1B1A1A] group-hover:text-[#3F3D3D]">
          {video.title}
        </h3>
        <p className="mb-1 text-xs text-[#6D6C6C]">{video.channel}</p>
        <span className="flex items-center gap-1 text-xs text-[#8E8C8C]">
          <Eye className="h-3 w-3" />
          {video.viewCount}
        </span>
      </div>
    </motion.div>
  )
}

/**
 * 最新影片區組件
 * 1 大 + 2 小的不對稱佈局
 */
export function FeaturedVideosSection() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // 使用精簡的 featured-videos.json (7KB vs 4.8MB)
        const response = await fetch('/data/featured-videos.json')
        const data: Video[] = await response.json()

        // 取前 3 個精選影片
        setVideos(data.slice(0, 3))
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

  const mainVideo = videos[0]
  const sideVideos = videos.slice(1, 3)

  return (
    <section className="border-t border-[#D2D2D2] py-16 md:py-20">
      <div className="container mx-auto px-4">
        {/* 標題區 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-[40px]">最新影片</h2>
            <p className="mt-2 text-base text-[#6D6C6C]">觀看精選攀岩影片</p>
          </div>
        </div>

        {/* 影片網格 - 1 大 + 2 小 */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* 主影片 */}
          <LargeVideoCard video={mainVideo} onClick={() => setSelectedVideo(mainVideo)} />

          {/* 側邊小影片 */}
          <div className="flex flex-col gap-4">
            {sideVideos.map((video, index) => (
              <SmallVideoCard
                key={video.id}
                video={video}
                onClick={() => setSelectedVideo(video)}
                index={index}
              />
            ))}

            {/* 查看更多連結（桌面版側邊） */}
            <Link
              href="/videos"
              className="mt-auto hidden items-center justify-center gap-2 rounded-lg border border-[#D2D2D2] py-3 text-sm font-medium text-[#6D6C6C] transition-colors hover:bg-[#F5F5F5] lg:flex"
            >
              探索更多影片
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* 查看全部按鈕（手機版） */}
        <div className="mt-8 flex justify-center lg:hidden">
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
