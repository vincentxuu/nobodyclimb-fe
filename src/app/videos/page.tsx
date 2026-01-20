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
import DurationFilter from '@/components/videos/duration-filter'
import PopularityFilter from '@/components/videos/popularity-filter'
import type { Video, VideoCategory, VideoDuration, VideoPopularity } from '@/lib/types'
import {
  parseDuration,
  parseViewCount,
  getDurationCategory,
  getPopularityCategory,
} from '@/lib/utils/video'

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

interface ChannelIndex {
  [channel: string]: {
    chunks: number[]
    count: number
  }
}

const VideosPage: React.FC = () => {
  const [videoList, setVideoList] = useState<VideoListItem[]>([])
  const [meta, setMeta] = useState<VideosMeta | null>(null)
  const [channelIndex, setChannelIndex] = useState<ChannelIndex | null>(null)
  const [loadedChunks, setLoadedChunks] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | 'all'>('all')
  const [selectedChannel, setSelectedChannel] = useState<string>('all')
  const [selectedDuration, setSelectedDuration] = useState<VideoDuration | 'all'>('all')
  const [selectedPopularity, setSelectedPopularity] = useState<VideoPopularity | 'all'>('all')
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

  // 初始載入 metadata、頻道索引和第一個 chunk
  useEffect(() => {
    const initialize = async () => {
      try {
        // 並行載入 metadata、頻道索引和第一個 chunk
        const [metaResponse, indexResponse, chunkResponse] = await Promise.all([
          fetch('/data/videos-meta.json'),
          fetch('/data/channel-index.json'),
          fetch('/data/videos-chunks/videos-0.json'),
        ])

        if (metaResponse.ok) {
          const metaData: VideosMeta = await metaResponse.json()
          setMeta(metaData)
        }

        if (indexResponse.ok) {
          const indexData: ChannelIndex = await indexResponse.json()
          setChannelIndex(indexData)
        }

        if (chunkResponse.ok) {
          const videos: VideoListItem[] = await chunkResponse.json()
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

  // 載入特定頻道所需的 chunks
  const loadChunksForChannel = useCallback(
    async (channel: string) => {
      if (!channelIndex || !channelIndex[channel]) return

      const neededChunks = channelIndex[channel].chunks.filter(
        (chunkIndex) => !loadedChunks.has(chunkIndex)
      )

      if (neededChunks.length === 0) return

      setLoadingMore(true)
      const newVideos: VideoListItem[] = []
      const newLoadedChunks = new Set(loadedChunks)

      // 並行載入所有需要的 chunks
      const results = await Promise.all(
        neededChunks.map(async (chunkIndex) => {
          try {
            const response = await fetch(`/data/videos-chunks/videos-${chunkIndex}.json`)
            if (response.ok) {
              const videos: VideoListItem[] = await response.json()
              newLoadedChunks.add(chunkIndex)
              return videos
            }
          } catch (error) {
            console.error(`Error loading chunk ${chunkIndex}:`, error)
          }
          return []
        })
      )

      results.forEach((videos) => newVideos.push(...videos))

      if (newVideos.length > 0) {
        setVideoList((prev) => [...prev, ...newVideos])
        setLoadedChunks(newLoadedChunks)
      }

      setLoadingMore(false)
    },
    [channelIndex, loadedChunks]
  )

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

    // 時長篩選
    if (selectedDuration !== 'all') {
      filtered = filtered.filter((video) => {
        const minutes = parseDuration(video.duration)
        return getDurationCategory(minutes) === selectedDuration
      })
    }

    // 熱門程度篩選
    if (selectedPopularity !== 'all') {
      filtered = filtered.filter((video) => {
        const views = parseViewCount(video.viewCount)
        return getPopularityCategory(views) === selectedPopularity
      })
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
  }, [videoList, searchQuery, selectedCategory, selectedChannel, selectedDuration, selectedPopularity])

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
    // 增加顯示數量
    const newVisibleCount = visibleCount + 12
    setVisibleCount(newVisibleCount)

    // 如果選擇了特定頻道，載入該頻道尚未載入的 chunks
    if (selectedChannel !== 'all') {
      await loadChunksForChannel(selectedChannel)
      return
    }

    // 如果沒有篩選條件，按順序載入下一個 chunk
    if (!searchQuery && selectedCategory === 'all' && meta && videoList.length < meta.totalVideos) {
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
  }

  const handleCategoryChange = (category: VideoCategory | 'all') => {
    setSelectedCategory(category)
    setVisibleCount(12)
  }

  const handleChannelChange = async (channel: string) => {
    setSelectedChannel(channel)
    setVisibleCount(12)

    // 如果選擇特定頻道，載入該頻道所需的 chunks
    if (channel !== 'all') {
      await loadChunksForChannel(channel)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setVisibleCount(12)
  }

  const handleDurationChange = (duration: VideoDuration | 'all') => {
    setSelectedDuration(duration)
    setVisibleCount(12)
  }

  const handlePopularityChange = (popularity: VideoPopularity | 'all') => {
    setSelectedPopularity(popularity)
    setVisibleCount(12)
  }

  // 計算是否還有更多影片可以顯示或載入
  const hasMore = useMemo(() => {
    // 如果還有已載入但未顯示的影片
    if (visibleCount < filteredVideos.length) {
      return true
    }

    // 如果選擇了特定頻道，檢查該頻道的所有 chunks 是否都已載入
    if (selectedChannel !== 'all' && channelIndex && channelIndex[selectedChannel]) {
      const channelChunks = channelIndex[selectedChannel].chunks
      const allChunksLoaded = channelChunks.every((chunk) => loadedChunks.has(chunk))
      return !allChunksLoaded
    }

    // 如果沒有篩選條件，檢查是否還有未載入的 chunks
    if (!searchQuery && selectedCategory === 'all' && selectedChannel === 'all') {
      return meta ? videoList.length < meta.totalVideos : false
    }

    return false
  }, [
    visibleCount,
    filteredVideos.length,
    selectedChannel,
    channelIndex,
    loadedChunks,
    searchQuery,
    selectedCategory,
    meta,
    videoList.length,
  ])

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
                <div className="flex flex-wrap justify-center gap-2 md:justify-end">
                  <DurationFilter
                    selectedDuration={selectedDuration}
                    onDurationChange={handleDurationChange}
                  />
                  <PopularityFilter
                    selectedPopularity={selectedPopularity}
                    onPopularityChange={handlePopularityChange}
                  />
                  <ChannelFilter
                    channels={availableChannels}
                    selectedChannel={selectedChannel}
                    onChannelChange={handleChannelChange}
                  />
                </div>
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
                hasMore={hasMore}
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
