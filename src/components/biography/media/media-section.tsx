'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Youtube, Plus, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mediaService } from '@/lib/api/services'
import { BiographyVideo } from '@/lib/types'
import { YouTubeVideoCard } from './youtube-embed'
import { AddMediaDialog, MediaItemActions } from './media-dialog'

interface MediaSectionProps {
  biographyId: string
  isOwner?: boolean
  className?: string
}

/**
 * 媒體區塊組件
 * 展示人物誌的 YouTube 影片
 */
export function MediaSection({
  biographyId,
  isOwner = false,
  className,
}: MediaSectionProps) {
  const [videos, setVideos] = useState<BiographyVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllVideos, setShowAllVideos] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const fetchMedia = useCallback(async () => {
    try {
      const videosRes = await mediaService.getBiographyVideos(biographyId)

      if (videosRes.success) {
        setVideos(videosRes.data || [])
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }, [biographyId])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  const displayedVideos = showAllVideos ? videos : videos.slice(0, 3)

  if (loading) {
    return (
      <div className={cn('animate-pulse space-y-4', className)}>
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-video rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  if (videos.length === 0 && !isOwner) {
    return null
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* YouTube Videos Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold">YouTube 影片</h3>
            {videos.length > 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {videos.length}
              </span>
            )}
          </div>
          {isOwner && (
            <button
              onClick={() => setAddDialogOpen(true)}
              className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
            >
              <Plus className="h-4 w-4" />
              新增影片
            </button>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-8 text-gray-500">
            <Youtube className="mb-2 h-8 w-8" />
            <p className="text-sm">尚未新增任何影片</p>
            {isOwner && (
              <button
                onClick={() => setAddDialogOpen(true)}
                className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <Plus className="h-4 w-4" />
                新增第一部影片
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedVideos.map((video) => (
                <div key={video.id} className="group relative">
                  <YouTubeVideoCard
                    videoId={video.video_id}
                    thumbnail="medium"
                  />
                  {/* Relation type badge */}
                  <div className="absolute left-2 top-2 flex items-center gap-1">
                    {video.is_featured && (
                      <span className="rounded bg-yellow-500 px-1.5 py-0.5 text-xs font-medium text-white">
                        精選
                      </span>
                    )}
                    <span className="rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                      {getRelationTypeLabel(video.relation_type)}
                    </span>
                  </div>
                  {/* Actions for owner */}
                  {isOwner && (
                    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <MediaItemActions
                        item={video}
                        type="youtube"
                        onUpdate={fetchMedia}
                        onDelete={fetchMedia}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {videos.length > 3 && (
              <button
                onClick={() => setShowAllVideos(!showAllVideos)}
                className="mt-4 flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                {showAllVideos ? '收起' : `查看全部 ${videos.length} 部影片`}
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform',
                    showAllVideos && 'rotate-90'
                  )}
                />
              </button>
            )}
          </>
        )}
      </div>

      {/* Add Media Dialog */}
      {addDialogOpen && (
        <AddMediaDialog
          type="youtube"
          isOpen={true}
          onClose={() => setAddDialogOpen(false)}
          onSuccess={fetchMedia}
        />
      )}
    </div>
  )
}

/**
 * 精選媒體區塊
 * 只展示精選的 YouTube 影片
 */
interface FeaturedMediaProps {
  biographyId: string
  className?: string
}

export function FeaturedMedia({ biographyId, className }: FeaturedMediaProps) {
  const [videos, setVideos] = useState<BiographyVideo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const videosRes = await mediaService.getBiographyVideos(biographyId, true)

        if (videosRes.success) {
          setVideos(videosRes.data || [])
        }
      } catch {
        // Handle error silently
      } finally {
        setLoading(false)
      }
    }

    fetchFeatured()
  }, [biographyId])

  if (loading || videos.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold">精選影片</h3>

      {/* Featured Video */}
      {videos.length > 0 && (
        <YouTubeVideoCard
          videoId={videos[0].video_id}
          thumbnail="high"
          className="max-w-2xl"
        />
      )}
    </div>
  )
}

// Helper function
function getRelationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    own_content: '自己的內容',
    featured_in: '出現在影片',
    mentioned: '被提及',
    recommended: '推薦',
    completion_proof: '完攀證明',
  }
  return labels[type] || type
}
