'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search-input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { LoadMoreButton } from '@/components/ui/load-more-button'
import { EmptyState } from '@/components/ui/empty-state'
import VideoGrid from '@/components/videos/video-grid'
import VideoPlayer from '@/components/videos/video-player'
import VideoFilters from '@/components/videos/video-filters'
import ChannelFilter from '@/components/videos/channel-filter'
import type { Video, VideoCategory } from '@/lib/types'

// 輕量版影片資料（僅包含列表所需欄位）
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

interface VideosMeta {
  totalVideos: number
  chunkSize: number
  totalChunks: number
  channels: string[]
}

const VideosPage: React.FC = () => {
  const [videoList, setVideoList] = useState<VideoListItem[]>([])
  const [meta, setMeta] = useState<VideosMeta | null>(null)
  const [loadedChunks, setLoadedChunks] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | 'all'>('all')
  const [selectedChannel, setSelectedChannel] = useState<string>('all')
  const [visibleCount, setVisibleCount] = useState(12)

  // 載入單個 chunk
  const loadChunk = useCallback(async (chunkIndex: number) => {
    if (loadedChunks.has(chunkIndex)) return []

    try {
      const response = await fetch(`/data/videos-chunks/videos-${chunkIndex}.json`)
      if (response.ok) {
        const videos: VideoListItem[] = await response.json()
        setLoadedChunks((prev) => new Set([...prev, chunkIndex]))
        return videos
      }
    } catch (error) {
      console.error(`Error loading chunk ${chunkIndex}:`, error)
    }
    return []
  }, [loadedChunks])

  // 初始載入 metadata 和第一個 chunk
  useEffect(() => {
    const initialize = async () => {
      try {
        // 載入 metadata
        const metaResponse = await fetch('/data/videos-meta.json')
        if (metaResponse.ok) {
          const metaData: VideosMeta = await metaResponse.json()
          setMeta(metaData)
        }

        // 載入第一個 chunk
        const response = await fetch('/data/videos-chunks/videos-0.json')
        if (response.ok) {
          const videos: VideoListItem[] = await response.json()
          setVideoList(videos)
          setLoadedChunks(new Set([0]))
        }
      } catch (error) {
        console.error('Error initializing videos:', error)
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [])

  // 頻道列表從 metadata 取得
  const availableChannels = useMemo(() => {
    return meta?.channels || []
  }, [meta])

  // 篩選和搜尋邏輯
  const filteredVideos = useMemo(() => {
    let filtered = [...videoList]

    // 分類篩選
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((video) => video.category === selectedCategory)
    }

    // 頻道篩選
    if (selectedChannel !== 'all') {
      filtered = filtered.filter((video) => video.channel === selectedChannel)
    }

    // 搜尋篩選
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (video) =>
          video.title.toLowerCase().includes(query) || video.channel.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [videoList, searchQuery, selectedCategory, selectedChannel])

  // 分頁顯示的影片
  const visibleVideos = filteredVideos.slice(0, visibleCount)

  // 轉換為 Video 格式供 VideoGrid 使用
  const displayVideos: Video[] = visibleVideos.map((v) => ({
    id: v.id,
    youtubeId: v.youtubeId,
    title: v.title,
    description: '',
    thumbnailUrl: v.thumbnailUrl,
    channel: v.channel,
    channelId: '',
    publishedAt: '',
    duration: v.duration,
    durationCategory: 'medium' as const,
    viewCount: v.viewCount,
    category: v.category as VideoCategory,
    tags: [],
    featured: false,
  }))

  const handleVideoClick = (video: Video) => {
    // 直接使用已有的資料，避免重新載入 4.8MB 的 videos.json
    // VideoPlayer 已有足夠的資訊來播放影片
    setSelectedVideo(video)
  }

  const handleClosePlayer = () => {
    setSelectedVideo(null)
  }

  const handleLoadMore = async () => {
    // 先增加顯示數量
    const newVisibleCount = visibleCount + 12

    // 計算需要載入的 chunk
    if (meta && videoList.length < meta.totalVideos) {
      const neededChunk = Math.floor(videoList.length / meta.chunkSize)
      if (!loadedChunks.has(neededChunk) && neededChunk < meta.totalChunks) {
        setLoadingMore(true)
        const newVideos = await loadChunk(neededChunk)
        if (newVideos.length > 0) {
          setVideoList((prev) => [...prev, ...newVideos])
        }
        setLoadingMore(false)
      }
    }

    setVisibleCount(newVisibleCount)
  }

  const handleCategoryChange = (category: VideoCategory | 'all') => {
    setSelectedCategory(category)
    setVisibleCount(12)
  }

  const handleChannelChange = (channel: string) => {
    setSelectedChannel(channel)
    setVisibleCount(12)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setVisibleCount(12)
  }

  // 計算是否還有更多影片
  const hasMore =
    visibleVideos.length < filteredVideos.length ||
    (meta && videoList.length < meta.totalVideos && !searchQuery && selectedCategory === 'all' && selectedChannel === 'all')

  return (
    <div className="min-h-screen bg-page-content-bg">
      <PageHeader title="攀岩影片精選" subtitle="探索精彩的攀岩影片" />

      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <LoadingSpinner text="載入影片資料中..." fullPage />
        ) : (
          <>
            {/* 搜尋和篩選 */}
            <div className="mb-8 space-y-6">
              <SearchInput
                value={searchQuery}
                onChange={handleSearch}
                placeholder="搜尋影片標題、頻道..."
              />
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex justify-center md:justify-start">
                  <VideoFilters
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                  />
                </div>
                <ChannelFilter
                  channels={availableChannels}
                  selectedChannel={selectedChannel}
                  onChannelChange={handleChannelChange}
                />
              </div>
            </div>

            {/* 搜尋結果提示 */}
            {searchQuery && (
              <div className="mb-4 text-sm text-neutral-600">
                找到 {filteredVideos.length} 個相關影片
                {meta && videoList.length < meta.totalVideos && ' (已載入部分資料)'}
              </div>
            )}

            {/* 影片網格 */}
            <VideoGrid videos={displayVideos} onVideoClick={handleVideoClick} />

            {/* 載入更多按鈕 */}
            {filteredVideos.length > 0 && (
              <LoadMoreButton
                onClick={handleLoadMore}
                hasMore={hasMore || false}
                text={loadingMore ? '載入中...' : '載入更多影片'}
                noMoreText="已顯示所有影片"
              />
            )}

            {/* 無搜尋結果提示 */}
            {filteredVideos.length === 0 && videoList.length > 0 && (
              <EmptyState
                icon="search"
                title="沒有找到相關影片"
                description="請嘗試其他搜尋關鍵字或篩選條件"
              />
            )}

            {/* 無影片資料提示 */}
            {videoList.length === 0 && (
              <EmptyState icon="video" title="目前沒有影片資料" />
            )}

            {/* 影片播放器彈窗 */}
            {selectedVideo && <VideoPlayer video={selectedVideo} onClose={handleClosePlayer} />}
          </>
        )}
      </div>
    </div>
  )
}

export default VideosPage
