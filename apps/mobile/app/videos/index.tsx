/**
 * 影片頁面
 *
 * 對應 apps/web/src/app/videos/page.tsx
 * 支援分類、頻道、時長、熱門程度篩選
 * 使用分塊載入優化效能
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'

import {
  Text,
  SearchInput,
  IconButton,
  EmptyState,
  LoadMoreButton,
} from '@/components/ui'
import {
  VideoGrid,
  VideoFilters,
  ChannelFilter,
  DurationFilter,
  PopularityFilter,
  VideoPlayer,
  type Video,
  type VideoCategory,
  type VideoDuration,
  type VideoPopularity,
} from '@/components/videos'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

// 資料來源 URL (Web 版本的靜態資料)
const DATA_BASE_URL = 'https://nobodyclimb.cc/data'

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

/**
 * 解析時長字串為分鐘數
 */
const parseDuration = (duration: string): number => {
  const parts = duration.split(':').map(Number)
  if (parts.length === 2) {
    return parts[0] // MM:SS -> 返回分鐘數
  } else if (parts.length === 3) {
    return parts[0] * 60 + parts[1] // HH:MM:SS -> 轉為分鐘
  }
  return 0
}

/**
 * 根據分鐘數取得時長分類
 */
const getDurationCategory = (minutes: number): VideoDuration => {
  if (minutes < 5) return 'short'
  if (minutes < 20) return 'medium'
  return 'long'
}

/**
 * 解析觀看次數字串為數字
 */
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

/**
 * 根據觀看次數取得熱門程度分類
 */
const getPopularityCategory = (views: number): VideoPopularity => {
  if (views >= 1000000) return 'viral'
  if (views >= 100000) return 'popular'
  if (views >= 10000) return 'normal'
  return 'niche'
}

export default function VideosScreen() {
  const router = useRouter()

  // 資料狀態
  const [videoList, setVideoList] = useState<VideoListItem[]>([])
  const [meta, setMeta] = useState<VideosMeta | null>(null)
  const [channelIndex, setChannelIndex] = useState<ChannelIndex | null>(null)
  const [loadedChunks, setLoadedChunks] = useState<Set<number>>(new Set())

  // UI 狀態
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  // 篩選狀態
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | 'all'>('all')
  const [selectedChannel, setSelectedChannel] = useState<string>('all')
  const [selectedDuration, setSelectedDuration] = useState<VideoDuration | 'all'>('all')
  const [selectedPopularity, setSelectedPopularity] = useState<VideoPopularity | 'all'>('all')
  const [visibleCount, setVisibleCount] = useState(20)

  // 載入單個 chunk
  const loadChunk = useCallback(async (chunkIndex: number) => {
    if (loadedChunks.has(chunkIndex)) return []

    try {
      const response = await fetch(`${DATA_BASE_URL}/videos-chunks/videos-${chunkIndex}.json`)
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
  const initialize = useCallback(async () => {
    try {
      setLoading(true)

      // 並行載入 metadata、頻道索引和第一個 chunk
      const [metaResponse, indexResponse, chunkResponse] = await Promise.all([
        fetch(`${DATA_BASE_URL}/videos-meta.json`),
        fetch(`${DATA_BASE_URL}/channel-index.json`),
        fetch(`${DATA_BASE_URL}/videos-chunks/videos-0.json`),
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
  }, [])

  useEffect(() => {
    initialize()
  }, [initialize])

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
            const response = await fetch(`${DATA_BASE_URL}/videos-chunks/videos-${chunkIndex}.json`)
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
    durationCategory: getDurationCategory(parseDuration(v.duration)),
    viewCount: v.viewCount,
    category: v.category as VideoCategory,
    tags: [],
    featured: false,
  }))

  const handleBack = () => {
    router.back()
  }

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video)
  }

  const handleClosePlayer = () => {
    setSelectedVideo(null)
  }

  const handleLoadMore = async () => {
    // 增加顯示數量
    const newVisibleCount = visibleCount + 20
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
    setVisibleCount(20)
  }

  const handleChannelChange = async (channel: string) => {
    setSelectedChannel(channel)
    setVisibleCount(20)

    // 如果選擇特定頻道，載入該頻道所需的 chunks
    if (channel !== 'all') {
      await loadChunksForChannel(channel)
    }
  }

  const handleSearch = (text: string) => {
    setSearchQuery(text)
    setVisibleCount(20)
  }

  const handleDurationChange = (duration: VideoDuration | 'all') => {
    setSelectedDuration(duration)
    setVisibleCount(20)
  }

  const handlePopularityChange = (popularity: VideoPopularity | 'all') => {
    setSelectedPopularity(popularity)
    setVisibleCount(20)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setLoadedChunks(new Set())
    setVideoList([])
    setVisibleCount(20)
    await initialize()
    setRefreshing(false)
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

  // 列表頭部組件
  const ListHeaderComponent = useMemo(() => (
    <View style={styles.filtersContainer}>
      {/* 搜尋結果提示 */}
      {searchQuery && (
        <View style={styles.searchResultHint}>
          <Text variant="caption" color="textSubtle">
            找到 {filteredVideos.length} 個相關影片
            {meta && videoList.length < meta.totalVideos && ' (已載入部分資料)'}
          </Text>
        </View>
      )}
    </View>
  ), [searchQuery, filteredVideos.length, meta, videoList.length])

  // 列表底部組件
  const ListFooterComponent = useMemo(() => (
    <View style={styles.footer}>
      {loadingMore && (
        <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMain} />
      )}
      {filteredVideos.length > 0 && !loadingMore && (
        <LoadMoreButton
          onPress={handleLoadMore}
          hasMore={hasMore}
          text="載入更多影片"
          noMoreText="已顯示所有影片"
        />
      )}
    </View>
  ), [loadingMore, filteredVideos.length, hasMore])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 標題區 */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
          <Text variant="h3" fontWeight="600">
            攀岩影片精選
          </Text>
          <View style={styles.placeholder} />
        </View>

        <SearchInput
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="搜尋影片標題、頻道..."
          style={styles.searchInput}
        />
      </View>

      {/* 分類篩選 */}
      <View style={styles.categoryFilters}>
        <VideoFilters
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      </View>

      {/* 進階篩選 */}
      <View style={styles.advancedFilters}>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <DurationFilter
              selectedDuration={selectedDuration}
              onDurationChange={handleDurationChange}
            />
          </View>
          <View style={styles.filterItem}>
            <PopularityFilter
              selectedPopularity={selectedPopularity}
              onPopularityChange={handlePopularityChange}
            />
          </View>
        </View>
        <View style={styles.channelFilter}>
          <ChannelFilter
            channels={availableChannels}
            selectedChannel={selectedChannel}
            onChannelChange={handleChannelChange}
          />
        </View>
      </View>

      {/* 影片列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
          <Text variant="body" color="textSubtle" style={styles.loadingText}>
            載入影片資料中...
          </Text>
        </View>
      ) : (
        <VideoGrid
          videos={displayVideos}
          onVideoClick={handleVideoClick}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
          ListEmptyComponent={
            videoList.length > 0 ? (
              <EmptyState
                icon="search"
                title="沒有找到相關影片"
                description="請嘗試其他搜尋關鍵字或篩選條件"
              />
            ) : (
              <EmptyState
                icon="video"
                title="目前沒有影片資料"
              />
            )
          }
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* 影片播放器彈窗 */}
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          visible={!!selectedVideo}
          onClose={handleClosePlayer}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  header: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  placeholder: {
    width: 40,
  },
  searchInput: {
    marginHorizontal: SPACING.xs,
  },
  categoryFilters: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  advancedFilters: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  filterItem: {
    flex: 1,
  },
  channelFilter: {
    width: '100%',
  },
  filtersContainer: {
    marginBottom: SPACING.sm,
  },
  searchResultHint: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    marginTop: SPACING.sm,
  },
  footer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
})
