'use client'

import { useState, useEffect } from 'react'
import { Youtube, Plus, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks'
import { useRouteStories } from '@/lib/hooks/useRouteStories'
import { useAscents } from '@/lib/hooks/useAscents'
import { RouteMediaForm } from '@/components/crag/RouteMediaForm'
import type { RouteStory, RouteStoryFormData } from '@/lib/types/route-story'
import type { UserRouteAscent } from '@/lib/types/ascent'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface RouteYouTubeSectionProps {
  routeId: string
  routeName: string
  staticVideos?: string[]
}

interface YouTubeItem {
  url: string
  embedUrl: string
  source: 'static' | 'user'
  caption?: string
  username?: string
  displayName?: string
  storyId?: string
}

// 將 YouTube URL 轉換為嵌入 URL
function getYoutubeEmbedUrl(url: string): string {
  if (url.includes('youtube.com/embed/')) {
    return url
  }

  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`
  }

  const standardMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/)
  if (standardMatch) {
    return `https://www.youtube.com/embed/${standardMatch[1]}`
  }

  return url
}

export function RouteYouTubeSection({
  routeId,
  routeName,
  staticVideos = [],
}: RouteYouTubeSectionProps) {
  const { isSignedIn } = useAuth()
  const { getRouteQuickShareYouTube, createStory } = useRouteStories()
  const { getRouteAscents } = useAscents()
  const { toast } = useToast()

  const [userStories, setUserStories] = useState<RouteStory[]>([])
  const [userAscents, setUserAscents] = useState<UserRouteAscent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setIsLoading(true)
      try {
        // 同時獲取 route stories 和 ascents 的 YouTube 影片
        const [storiesRes, ascentsRes] = await Promise.all([
          getRouteQuickShareYouTube(routeId, { limit: 20 }),
          getRouteAscents(routeId, { limit: 50 }),
        ])
        if (isMounted) {
          setUserStories(storiesRes.data)
          // 只保留有 YouTube URL 的攀爬記錄
          setUserAscents(ascentsRes.data.filter((a) => a.youtube_url))
        }
      } catch (error) {
        console.error('Error loading youtube videos:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId])

  // 聚合所有 YouTube 影片
  const allVideos: YouTubeItem[] = [
    // 靜態 JSON 影片
    ...staticVideos.map((url) => ({
      url,
      embedUrl: getYoutubeEmbedUrl(url),
      source: 'static' as const,
    })),
    // 用戶分享的影片 (route stories)
    ...userStories
      .filter((story) => story.youtube_url)
      .map((story) => ({
        url: story.youtube_url!,
        embedUrl: getYoutubeEmbedUrl(story.youtube_url!),
        source: 'user' as const,
        caption: story.content || undefined,
        username: story.username,
        displayName: story.display_name || undefined,
        storyId: story.id,
      })),
    // 攀爬記錄的 YouTube 影片
    ...userAscents
      .filter((ascent) => ascent.youtube_url)
      .map((ascent) => ({
        url: ascent.youtube_url!,
        embedUrl: getYoutubeEmbedUrl(ascent.youtube_url!),
        source: 'user' as const,
        caption: ascent.notes || undefined,
        username: ascent.username,
        displayName: ascent.display_name || undefined,
        storyId: ascent.id,
      })),
  ]

  const handleSubmit = async (data: RouteStoryFormData) => {
    setIsSubmitting(true)
    try {
      const newStory = await createStory(data)
      setUserStories((prev) => [newStory, ...prev])
      toast({
        title: '分享成功',
        description: '已成功分享影片',
      })
    } catch (error) {
      console.error('Error creating youtube share:', error)
      toast({
        title: '分享失敗',
        description: '無法分享影片，請稍後再試',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
            <Youtube className="mr-2 h-5 w-5 text-red-600" />
            攀登影片
          </h2>
          {isSignedIn ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              分享影片
            </Button>
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="gap-1">
                <LogIn className="h-4 w-4" />
                登入分享
              </Button>
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-gray-500">載入中...</div>
        ) : allVideos.length === 0 ? (
          <div className="rounded-lg bg-gray-50 py-6 text-center text-gray-500">
            <Youtube className="mx-auto mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm">還沒有人分享這條路線的攀登影片</p>
            <p className="mt-1 text-xs text-gray-400">
              分享攀登實況、Beta 教學或路線介紹影片
            </p>
            {isSignedIn && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsFormOpen(true)}
                className="mt-2"
              >
                分享攀登影片
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {allVideos.map((video, index) => (
              <div
                key={`${video.source}-${video.storyId || index}`}
                className="aspect-video w-full overflow-hidden rounded-lg"
              >
                <iframe
                  src={video.embedUrl}
                  className="h-full w-full"
                  title={`${routeName} 攀登影片 ${index + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <RouteMediaForm
        routeId={routeId}
        routeName={routeName}
        mediaType="youtube"
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </>
  )
}
