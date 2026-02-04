'use client'

import { useState, useEffect, useMemo } from 'react'
import { Mountain, BookOpen, Users, Star, Plus, LogIn, Youtube, Instagram, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks'
import { useAscents } from '@/lib/hooks/useAscents'
import { useRouteStories } from '@/lib/hooks/useRouteStories'
import { AscentCard, AscentForm } from '@/components/ascent'
import { RouteStoryCard, RouteStoryForm } from '@/components/route-story'
import type { UserRouteAscent, RouteAscentSummary } from '@/lib/types/ascent'
import type { RouteStory } from '@/lib/types/route-story'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface RouteCommunityProps {
  routeId: string
  routeName: string
  routeGrade?: string
}

export function RouteCommunitySection({
  routeId,
  routeName,
  routeGrade,
}: RouteCommunityProps) {
  const { isSignedIn } = useAuth()
  const { getRouteAscents, getRouteAscentSummary, createAscent } = useAscents()
  const { getRouteStories, createStory, toggleLike, toggleHelpful } = useRouteStories()
  const { toast } = useToast()

  // States
  const [ascents, setAscents] = useState<UserRouteAscent[]>([])
  const [ascentSummary, setAscentSummary] = useState<RouteAscentSummary | null>(null)
  const [stories, setStories] = useState<RouteStory[]>([])
  const [isAscentFormOpen, setIsAscentFormOpen] = useState(false)
  const [isStoryFormOpen, setIsStoryFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAscentSubmitting, setIsAscentSubmitting] = useState(false)
  const [isStorySubmitting, setIsStorySubmitting] = useState(false)

  // 載入資料 - 只依賴 routeId，避免 hook 函數造成無限迴圈
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setIsLoading(true)
      try {
        const [ascentsRes, summaryRes, storiesRes] = await Promise.all([
          getRouteAscents(routeId, { limit: 5 }),
          getRouteAscentSummary(routeId),
          getRouteStories(routeId, { limit: 10 }),
        ])
        if (isMounted) {
          setAscents(ascentsRes.data)
          setAscentSummary(summaryRes)
          setStories(storiesRes.data)
        }
      } catch (error) {
        console.error('Error loading community data:', error)
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

  // 新增攀爬記錄
  const handleCreateAscent = async (data: Parameters<typeof createAscent>[0]) => {
    setIsAscentSubmitting(true)
    try {
      const newAscent = await createAscent(data)
      setAscents((prev) => [newAscent, ...prev])
      const summaryRes = await getRouteAscentSummary(routeId)
      setAscentSummary(summaryRes)
      toast({
        title: '記錄成功',
        description: '已成功新增攀爬記錄',
      })
    } catch (error) {
      console.error('Error creating ascent:', error)
      toast({
        title: '新增失敗',
        description: '無法新增攀爬記錄，請稍後再試',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsAscentSubmitting(false)
    }
  }

  // 新增故事
  const handleCreateStory = async (data: Parameters<typeof createStory>[0]) => {
    setIsStorySubmitting(true)
    try {
      const newStory = await createStory(data)
      setStories((prev) => [newStory, ...prev])
      toast({
        title: '分享成功',
        description: '已成功分享路線故事',
      })
    } catch (error) {
      console.error('Error creating story:', error)
      toast({
        title: '分享失敗',
        description: '無法分享故事，請稍後再試',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsStorySubmitting(false)
    }
  }

  // 按讚故事 - 使用樂觀更新並在失敗時回滾
  const handleToggleLike = async (storyId: string) => {
    if (!isSignedIn) return

    const story = stories.find((s) => s.id === storyId)
    if (!story) return

    const prevState = { is_liked: story.is_liked, like_count: story.like_count }
    const newIsLiked = !story.is_liked

    setStories((prev) =>
      prev.map((s) =>
        s.id === storyId
          ? {
              ...s,
              is_liked: newIsLiked,
              like_count: newIsLiked ? s.like_count + 1 : s.like_count - 1,
            }
          : s
      )
    )

    try {
      await toggleLike(storyId)
    } catch (error) {
      setStories((prev) =>
        prev.map((s) =>
          s.id === storyId
            ? { ...s, is_liked: prevState.is_liked, like_count: prevState.like_count }
            : s
        )
      )
      console.error('Error toggling like:', error)
      toast({
        title: '操作失敗',
        description: '無法更新按讚狀態，請稍後再試',
        variant: 'destructive',
      })
    }
  }

  // 標記有幫助 - 使用樂觀更新並在失敗時回滾
  const handleToggleHelpful = async (storyId: string) => {
    if (!isSignedIn) return

    const story = stories.find((s) => s.id === storyId)
    if (!story) return

    const prevState = { is_helpful: story.is_helpful, helpful_count: story.helpful_count }
    const newIsHelpful = !story.is_helpful

    setStories((prev) =>
      prev.map((s) =>
        s.id === storyId
          ? {
              ...s,
              is_helpful: newIsHelpful,
              helpful_count: newIsHelpful ? s.helpful_count + 1 : s.helpful_count - 1,
            }
          : s
      )
    )

    try {
      await toggleHelpful(storyId)
    } catch (error) {
      setStories((prev) =>
        prev.map((s) =>
          s.id === storyId
            ? { ...s, is_helpful: prevState.is_helpful, helpful_count: prevState.helpful_count }
            : s
        )
      )
      console.error('Error toggling helpful:', error)
      toast({
        title: '操作失敗',
        description: '無法更新標記狀態，請稍後再試',
        variant: 'destructive',
      })
    }
  }

  // 整合所有使用者分享的媒體內容
  const aggregatedMedia = useMemo(() => {
    const photos: string[] = []
    const youtubeUrls: string[] = []
    const instagramUrls: string[] = []

    // 從路線故事收集
    stories.forEach((story) => {
      if (story.photos) photos.push(...story.photos)
      if (story.youtube_url) youtubeUrls.push(story.youtube_url)
      if (story.instagram_url) instagramUrls.push(story.instagram_url)
    })

    // 從攀爬記錄收集
    ascents.forEach((ascent) => {
      if (ascent.photos) photos.push(...ascent.photos)
      if (ascent.youtube_url) youtubeUrls.push(ascent.youtube_url)
      if (ascent.instagram_url) instagramUrls.push(ascent.instagram_url)
    })

    return {
      photos: [...new Set(photos)], // 去除重複
      youtubeUrls: [...new Set(youtubeUrls)],
      instagramUrls: [...new Set(instagramUrls)],
    }
  }, [stories, ascents])

  const hasMedia = aggregatedMedia.photos.length > 0 ||
                   aggregatedMedia.youtubeUrls.length > 0 ||
                   aggregatedMedia.instagramUrls.length > 0

  // 將 YouTube URL 轉換為嵌入 URL
  const getYoutubeEmbedUrl = (url: string): string => {
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`

    const standardMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/)
    if (standardMatch) return `https://www.youtube.com/embed/${standardMatch[1]}`

    return url
  }

  // 從 Instagram URL 提取貼文 ID
  const getInstagramPostId = (url: string): string | null => {
    const match = url.match(/instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }

  return (
    <>
      {/* 社群媒體區塊 - 整合所有使用者分享的照片和影片 */}
      {!isLoading && hasMedia && (
        <div className="mb-8">
          <h2 className="mb-4 border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
            社群分享
          </h2>

          {/* 照片牆 */}
          {aggregatedMedia.photos.length > 0 && (
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                <ImageIcon className="h-4 w-4" />
                <span>攀爬照片 ({aggregatedMedia.photos.length})</span>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                {aggregatedMedia.photos.slice(0, 12).map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={`社群照片 ${index + 1}`}
                      className="h-full w-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    />
                    {index === 11 && aggregatedMedia.photos.length > 12 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-semibold">
                        +{aggregatedMedia.photos.length - 12}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* YouTube 影片 */}
          {aggregatedMedia.youtubeUrls.length > 0 && (
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                <Youtube className="h-4 w-4 text-red-500" />
                <span>攀爬影片 ({aggregatedMedia.youtubeUrls.length})</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {aggregatedMedia.youtubeUrls.slice(0, 4).map((url, index) => (
                  <div key={index} className="aspect-video w-full">
                    <iframe
                      src={getYoutubeEmbedUrl(url)}
                      className="h-full w-full rounded-lg"
                      title={`社群影片 ${index + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instagram 貼文 */}
          {aggregatedMedia.instagramUrls.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                <Instagram className="h-4 w-4 text-pink-500" />
                <span>Instagram ({aggregatedMedia.instagramUrls.length})</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {aggregatedMedia.instagramUrls.slice(0, 2).map((url, index) => {
                  const postId = getInstagramPostId(url)
                  return (
                    <div
                      key={index}
                      className="overflow-hidden rounded-lg border border-gray-200"
                    >
                      {postId ? (
                        <iframe
                          src={`https://www.instagram.com/p/${postId}/embed`}
                          className="h-[400px] w-full"
                          title={`Instagram 貼文 ${index + 1}`}
                          scrolling="no"
                          allowFullScreen
                        />
                      ) : (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center p-4 text-pink-600 hover:text-pink-700"
                        >
                          <Instagram className="mr-2 h-5 w-5" />
                          查看 Instagram 貼文
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 路線故事區塊 */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
            路線故事
          </h2>
          {isSignedIn && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStoryFormOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              分享故事
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-gray-500">載入中...</div>
        ) : stories.length === 0 ? (
          <div className="rounded-lg bg-gray-50 py-6 text-center text-gray-500">
            <BookOpen className="mx-auto mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm">還沒有人分享這條路線的故事</p>
            <p className="mt-1 text-xs text-gray-400">分享這條路線的命名由來或歷史故事</p>
            {isSignedIn && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsStoryFormOpen(true)}
                className="mt-2"
              >
                成為第一個分享的人
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <RouteStoryCard
                key={story.id}
                story={story}
                onLike={() => handleToggleLike(story.id)}
                onHelpful={() => handleToggleHelpful(story.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 攀爬記錄區塊 */}
      <div className="mt-12 border-t pt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
            攀爬記錄
          </h2>
          {isSignedIn ? (
            <Button size="sm" onClick={() => setIsAscentFormOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" />
              記錄攀爬
            </Button>
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="gap-1">
                <LogIn className="h-4 w-4" />
                登入記錄
              </Button>
            </Link>
          )}
        </div>

        {/* 統計摘要 */}
        {ascentSummary && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                <Users className="h-3 w-3" />
                攀爬人次
              </div>
              <div className="mt-1 text-xl font-bold text-[#1B1A1A]">
                {ascentSummary.total_ascents}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                <Mountain className="h-3 w-3" />
                完攀人數
              </div>
              <div className="mt-1 text-xl font-bold text-[#1B1A1A]">
                {ascentSummary.unique_climbers}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                <Star className="h-3 w-3" />
                平均評分
              </div>
              <div className="mt-1 text-xl font-bold text-[#1B1A1A]">
                {ascentSummary.avg_rating?.toFixed(1) || '-'}
              </div>
            </div>
          </div>
        )}

        {/* 攀爬記錄列表 */}
        {isLoading ? (
          <div className="py-6 text-center text-gray-500">載入中...</div>
        ) : ascents.length === 0 ? (
          <div className="rounded-lg bg-gray-50 py-6 text-center text-gray-500">
            <Mountain className="mx-auto mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm">還沒有人記錄攀爬</p>
            {isSignedIn && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsAscentFormOpen(true)}
                className="mt-2"
              >
                成為第一個記錄的人
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {ascents.map((ascent) => (
              <AscentCard key={ascent.id} ascent={ascent} showRoute={false} />
            ))}
          </div>
        )}
      </div>

      {/* 表單 Modal */}
      <AscentForm
        routeId={routeId}
        routeName={routeName}
        routeGrade={routeGrade}
        open={isAscentFormOpen}
        onOpenChange={setIsAscentFormOpen}
        onSubmit={handleCreateAscent}
        isLoading={isAscentSubmitting}
      />

      <RouteStoryForm
        routeId={routeId}
        routeName={routeName}
        routeGrade={routeGrade}
        open={isStoryFormOpen}
        onOpenChange={setIsStoryFormOpen}
        onSubmit={handleCreateStory}
        isLoading={isStorySubmitting}
      />
    </>
  )
}
