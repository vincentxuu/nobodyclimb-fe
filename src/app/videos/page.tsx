'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import VideoGrid from '@/components/videos/video-grid'
import VideoPlayer from '@/components/videos/video-player'
import VideoFilters from '@/components/videos/video-filters'
import ChannelFilter from '@/components/videos/channel-filter'
import type { Video, VideoCategory } from '@/lib/types'

const VideosPage: React.FC = () => {
  const [videoList, setVideoList] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | 'all'>('all')
  const [selectedChannel, setSelectedChannel] = useState<string>('all')
  const [visibleCount, setVisibleCount] = useState(12)

  // 從靜態資源載入影片數據（兼容 Cloudflare Workers）
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch('/data/videos.json')
        if (response.ok) {
          const videos: Video[] = await response.json()
          setVideoList(videos)
        } else {
          console.error('Failed to fetch videos, status:', response.status)
        }
      } catch (error) {
        console.error('Error fetching videos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  // 從影片列表中提取唯一的頻道列表
  const availableChannels = useMemo(() => {
    const channelSet = new Set<string>()
    videoList.forEach((video) => {
      if (video.channel) {
        channelSet.add(video.channel)
      }
    })
    return Array.from(channelSet).sort()
  }, [videoList])

  // 篩選和搜尋邏輯
  const filteredVideos = useMemo(() => {
    let filtered = [...videoList]

    // 分類篩選
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(video => video.category === selectedCategory)
    }

    // 頻道篩選
    if (selectedChannel !== 'all') {
      filtered = filtered.filter(video => video.channel === selectedChannel)
    }

    // 搜尋篩選
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        video =>
          video.title.toLowerCase().includes(query) ||
          video.description.toLowerCase().includes(query) ||
          video.channel.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [videoList, searchQuery, selectedCategory, selectedChannel])

  // 分頁顯示的影片
  const visibleVideos = filteredVideos.slice(0, visibleCount)

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video)
  }

  const handleClosePlayer = () => {
    setSelectedVideo(null)
  }

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 12)
  }

  const handleCategoryChange = (category: VideoCategory | 'all') => {
    setSelectedCategory(category)
    setVisibleCount(12) // 重置顯示數量
  }

  const handleChannelChange = (channel: string) => {
    setSelectedChannel(channel)
    setVisibleCount(12) // 重置顯示數量
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setVisibleCount(12) // 重置顯示數量
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-600 mx-auto"></div>
            <p className="text-neutral-500">載入影片資料中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      {/* 頁面標題 */}
      <div className="mb-8 text-center md:mb-12">
        <h1 className="mb-2 text-3xl font-medium text-neutral-800 md:text-4xl">
          攀岩影片精選
        </h1>
        <p className="text-base text-neutral-500 md:text-lg">
          探索精彩的攀岩影片
        </p>
      </div>

      {/* 搜尋和篩選 */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 md:max-w-md">
            <Input
              type="text"
              placeholder="搜尋影片標題、頻道..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full"
            />
          </div>
          <ChannelFilter
            channels={availableChannels}
            selectedChannel={selectedChannel}
            onChannelChange={handleChannelChange}
          />
        </div>
        <div className="flex justify-center md:justify-end">
          <VideoFilters
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </div>

      {/* 搜尋結果提示 */}
      {searchQuery && (
        <div className="mb-4 text-sm text-neutral-600">
          找到 {filteredVideos.length} 個相關影片
        </div>
      )}

      {/* 影片網格 */}
      <VideoGrid videos={visibleVideos} onVideoClick={handleVideoClick} />

      {/* 載入更多按鈕 */}
      {visibleVideos.length < filteredVideos.length && (
        <div className="mt-8 text-center md:mt-12">
          <Button variant="outline" onClick={handleLoadMore}>
            載入更多影片
          </Button>
        </div>
      )}

      {/* 無搜尋結果提示 */}
      {filteredVideos.length === 0 && videoList.length > 0 && (
        <div className="py-16 text-center">
          <p className="text-neutral-500">沒有找到相關影片</p>
        </div>
      )}

      {/* 無影片資料提示 */}
      {videoList.length === 0 && !loading && (
        <div className="py-16 text-center">
          <p className="text-neutral-500">目前沒有影片資料</p>
        </div>
      )}

      {/* 影片播放器彈窗 */}
      {selectedVideo && (
        <VideoPlayer video={selectedVideo} onClose={handleClosePlayer} />
      )}
    </div>
  )
}

export default VideosPage