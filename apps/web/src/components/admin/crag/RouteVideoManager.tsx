'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Video,
  Plus,
  X,
  Loader2,
  Search,
  ExternalLink,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { adminCragService, RouteVideoItem } from '@/lib/api/services'

interface RouteVideoManagerProps {
  routeId: string
  cragId: string
}

// Extract YouTube ID from URL or return as-is if already an ID
function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Already a plain ID (11 characters, alphanumeric + dash/underscore)
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed

  // Full URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&?#\s]{11})/,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) return match[1]
  }

  return null
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function RouteVideoManager({
  routeId,
  cragId,
}: RouteVideoManagerProps) {
  const { toast } = useToast()
  const [videos, setVideos] = useState<RouteVideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Add video form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [youtubeInput, setYoutubeInput] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [videoChannel, setVideoChannel] = useState('')

  // Search state
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<RouteVideoItem[]>([])
  const [searching, setSearching] = useState(false)

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminCragService.getRouteVideos(cragId, routeId)
      if (response.success && response.data) {
        setVideos(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch route videos:', error)
    } finally {
      setLoading(false)
    }
  }, [cragId, routeId])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  const handleAddByUrl = async () => {
    const youtubeId = extractYouTubeId(youtubeInput)
    if (!youtubeId) {
      toast({
        variant: 'destructive',
        title: '錯誤',
        description: '請輸入有效的 YouTube 影片網址或 ID',
      })
      return
    }

    setAdding(true)
    try {
      const response = await adminCragService.addRouteVideo(cragId, routeId, {
        youtubeId,
        title: videoTitle || undefined,
        channel: videoChannel || undefined,
        thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      })

      if (response.success) {
        toast({ title: '成功', description: '影片已新增' })
        setYoutubeInput('')
        setVideoTitle('')
        setVideoChannel('')
        setShowAddForm(false)
        fetchVideos()
      }
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : '新增影片失敗'
      toast({ variant: 'destructive', title: '錯誤', description: message || '新增影片失敗' })
    } finally {
      setAdding(false)
    }
  }

  const handleAddFromSearch = async (video: RouteVideoItem) => {
    setAdding(true)
    try {
      const response = await adminCragService.addRouteVideo(cragId, routeId, {
        youtubeId: video.youtubeId || video.id,
        title: video.title,
        channel: video.channel || undefined,
        channelId: video.channelId || undefined,
        thumbnailUrl: video.thumbnailUrl || undefined,
        duration: video.duration || undefined,
        publishedAt: video.publishedAt || undefined,
      })

      if (response.success) {
        toast({ title: '成功', description: '影片已關聯' })
        setShowSearch(false)
        setSearchQuery('')
        setSearchResults([])
        fetchVideos()
      }
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : '關聯影片失敗'
      toast({ variant: 'destructive', title: '錯誤', description: message || '關聯影片失敗' })
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (videoId: string) => {
    setRemovingId(videoId)
    try {
      const response = await adminCragService.removeRouteVideo(
        cragId,
        routeId,
        videoId
      )
      if (response.success) {
        toast({ title: '成功', description: '影片已移除' })
        setVideos((prev) => prev.filter((v) => v.id !== videoId))
      }
    } catch (error) {
      console.error('Failed to remove video:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '移除影片失敗' })
    } finally {
      setRemovingId(null)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const response = await adminCragService.searchVideos(searchQuery, 10)
      if (response.success && response.data) {
        // Filter out videos already linked
        const linkedIds = new Set(videos.map((v) => v.id))
        setSearchResults(response.data.filter((v) => !linkedIds.has(v.id)))
      }
    } catch (error) {
      console.error('Failed to search videos:', error)
    } finally {
      setSearching(false)
    }
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-wb-90 mb-2 flex items-center gap-2">
        <Video className="h-4 w-4" />
        路線影片
        <span className="text-xs text-wb-50 font-normal">
          ({videos.length})
        </span>
      </legend>

      {/* Video list */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-wb-50">
          <Loader2 className="h-4 w-4 animate-spin" />
          載入中...
        </div>
      ) : videos.length === 0 ? (
        <div className="text-sm text-wb-40 py-2">尚無關聯影片</div>
      ) : (
        <div className="space-y-2">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center gap-3 p-2 rounded-lg border border-wb-20 bg-wb-10/30 group"
            >
              {/* Thumbnail */}
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-24 h-14 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-14 rounded bg-wb-20 flex items-center justify-center flex-shrink-0">
                  <Video className="h-5 w-5 text-wb-40" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-wb-100 truncate">
                  {video.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-wb-50 mt-0.5">
                  {video.channel && <span>{video.channel}</span>}
                  {video.duration && (
                    <span>{formatDuration(video.duration)}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {video.youtubeId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded text-wb-50 hover:text-wb-70 hover:bg-wb-10 transition-colors"
                    title="在 YouTube 開啟"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(video.id)}
                  disabled={removingId === video.id}
                  className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="移除影片"
                >
                  {removingId === video.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {!showAddForm && !showSearch && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true)
              setShowSearch(false)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-wb-70 border border-wb-20 rounded-lg hover:bg-wb-10 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            以 YouTube 網址新增
          </button>
          <button
            type="button"
            onClick={() => {
              setShowSearch(true)
              setShowAddForm(false)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-wb-70 border border-wb-20 rounded-lg hover:bg-wb-10 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            搜尋已有影片
          </button>
        </div>
      )}

      {/* Add by URL form */}
      {showAddForm && (
        <div className="p-3 rounded-lg border border-wb-20 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-wb-90">新增 YouTube 影片</h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="p-1 text-wb-50 hover:text-wb-70 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-xs text-wb-70 mb-1">
                YouTube 網址或影片 ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                placeholder="例：https://www.youtube.com/watch?v=xxxxx 或 xxxxx"
                className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-wb-70 mb-1">
                  影片標題
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="選填"
                  className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
              <div>
                <label className="block text-xs text-wb-70 mb-1">
                  頻道名稱
                </label>
                <input
                  type="text"
                  value={videoChannel}
                  onChange={(e) => setVideoChannel(e.target.value)}
                  placeholder="選填"
                  className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
            </div>

            {/* Preview thumbnail */}
            {youtubeInput && extractYouTubeId(youtubeInput) && (
              <div className="mt-2">
                <img
                  src={`https://i.ytimg.com/vi/${extractYouTubeId(youtubeInput)}/hqdefault.jpg`}
                  alt="預覽縮圖"
                  className="w-40 h-auto rounded border border-wb-20"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddByUrl}
              disabled={adding || !youtubeInput.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors disabled:opacity-50"
            >
              {adding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              新增
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setYoutubeInput('')
                setVideoTitle('')
                setVideoChannel('')
              }}
              className="px-3 py-1.5 text-xs text-wb-70 hover:text-wb-100 rounded-lg hover:bg-wb-10 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Search existing videos */}
      {showSearch && (
        <div className="p-3 rounded-lg border border-wb-20 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-wb-90">搜尋已有影片</h4>
            <button
              type="button"
              onClick={() => {
                setShowSearch(false)
                setSearchQuery('')
                setSearchResults([])
              }}
              className="p-1 text-wb-50 hover:text-wb-70 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-wb-50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜尋影片標題、頻道名稱或 YouTube ID..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-3 py-1.5 text-xs bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors disabled:opacity-50"
            >
              {searching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                '搜尋'
              )}
            </button>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {searchResults.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-2 p-2 rounded-lg border border-wb-10 hover:border-wb-30 hover:bg-wb-10/50 cursor-pointer transition-colors"
                  onClick={() => handleAddFromSearch(video)}
                >
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-16 h-9 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-9 rounded bg-wb-20 flex items-center justify-center flex-shrink-0">
                      <Video className="h-3.5 w-3.5 text-wb-40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-wb-100 truncate">
                      {video.title}
                    </p>
                    <p className="text-xs text-wb-50 truncate">
                      {video.channel}
                      {video.duration && ` · ${formatDuration(video.duration)}`}
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-wb-50 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
          {searchResults.length === 0 && searchQuery && !searching && (
            <p className="text-xs text-wb-40 text-center py-2">
              沒有找到符合的影片
            </p>
          )}
        </div>
      )}
    </fieldset>
  )
}
