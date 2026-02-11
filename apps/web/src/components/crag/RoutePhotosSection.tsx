'use client'

import { useState, useEffect } from 'react'
import { Camera, Plus, LogIn, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks'
import { useRouteStories } from '@/lib/hooks/useRouteStories'
import { useAscents } from '@/lib/hooks/useAscents'
import { RouteMediaForm } from '@/components/crag/RouteMediaForm'
import type { RouteStory, RouteStoryFormData } from '@/lib/types/route-story'
import type { UserRouteAscent } from '@/lib/types/ascent'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface RoutePhotosSectionProps {
  routeId: string
  routeName: string
  staticPhotos?: string[]
}

interface PhotoItem {
  url: string
  source: 'static' | 'user'
  caption?: string
  username?: string
  displayName?: string
  storyId?: string
}

export function RoutePhotosSection({
  routeId,
  routeName,
  staticPhotos = [],
}: RoutePhotosSectionProps) {
  const { isSignedIn } = useAuth()
  const { getRouteQuickSharePhotos, createStory } = useRouteStories()
  const { getRouteAscents } = useAscents()
  const { toast } = useToast()

  const [userStories, setUserStories] = useState<RouteStory[]>([])
  const [userAscents, setUserAscents] = useState<UserRouteAscent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setIsLoading(true)
      try {
        // 同時獲取 route stories 和 ascents 的照片
        const [storiesRes, ascentsRes] = await Promise.all([
          getRouteQuickSharePhotos(routeId, { limit: 20 }),
          getRouteAscents(routeId, { limit: 50 }),
        ])
        if (isMounted) {
          setUserStories(storiesRes.data)
          // 只保留有照片的攀爬記錄
          setUserAscents(ascentsRes.data.filter((a) => a.photos && a.photos.length > 0))
        }
      } catch (error) {
        console.error('Error loading photos:', error)
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

  // 聚合所有照片
  const allPhotos: PhotoItem[] = [
    // 靜態 JSON 照片
    ...staticPhotos.map((url) => ({
      url,
      source: 'static' as const,
    })),
    // 用戶分享的照片 (route stories)
    ...userStories.flatMap((story) =>
      (story.photos || []).map((url) => ({
        url,
        source: 'user' as const,
        caption: story.content || undefined,
        username: story.username,
        displayName: story.display_name || undefined,
        storyId: story.id,
      }))
    ),
    // 攀爬記錄的照片
    ...userAscents.flatMap((ascent) =>
      (ascent.photos || []).map((url) => ({
        url,
        source: 'user' as const,
        caption: ascent.notes || undefined,
        username: ascent.username,
        displayName: ascent.display_name || undefined,
        storyId: ascent.id,
      }))
    ),
  ]

  const handleSubmit = async (data: RouteStoryFormData) => {
    setIsSubmitting(true)
    try {
      const newStory = await createStory(data)
      setUserStories((prev) => [newStory, ...prev])
      toast({
        title: '分享成功',
        description: '已成功分享照片',
      })
    } catch (error) {
      console.error('Error creating photo share:', error)
      toast({
        title: '分享失敗',
        description: '無法分享照片，請稍後再試',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const goToPrevious = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? allPhotos.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentPhotoIndex((prev) => (prev === allPhotos.length - 1 ? 0 : prev + 1))
  }

  return (
    <>
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
            社群照片
          </h2>
          {isSignedIn ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              分享照片
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
        ) : allPhotos.length === 0 ? (
          <div className="rounded-lg bg-gray-50 py-6 text-center text-gray-500">
            <Camera className="mx-auto mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm">還沒有人分享這條路線的照片</p>
            <p className="mt-1 text-xs text-gray-400">
              分享攀登照片、岩壁特寫、起攀位置或周邊風景
            </p>
            {isSignedIn && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsFormOpen(true)}
                className="mt-2"
              >
                成為第一個分享的人
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {allPhotos.slice(0, 10).map((photo, index) => (
              <button
                key={`${photo.source}-${photo.storyId || index}`}
                onClick={() => openLightbox(index)}
                className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 transition hover:opacity-90"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`照片 ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {/* 顯示更多照片的遮罩 */}
                {index === 9 && allPhotos.length > 10 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-medium text-white">
                    +{allPhotos.length - 10}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 照片 Lightbox */}
      {lightboxOpen && allPhotos.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          {/* 關閉按鈕 */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
            aria-label="關閉"
          >
            <X className="h-6 w-6" />
          </button>

          {/* 上一張 */}
          {allPhotos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToPrevious()
              }}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
              aria-label="上一張"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* 照片 */}
          <div
            className="flex max-h-[90vh] max-w-[90vw] flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={allPhotos[currentPhotoIndex].url}
              alt={`照片 ${currentPhotoIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain"
            />
            {/* 照片資訊 */}
            {allPhotos[currentPhotoIndex].source === 'user' && (
              <div className="mt-4 text-center text-white">
                {allPhotos[currentPhotoIndex].caption && (
                  <p className="text-sm">{allPhotos[currentPhotoIndex].caption}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  by{' '}
                  {allPhotos[currentPhotoIndex].displayName ||
                    allPhotos[currentPhotoIndex].username}
                </p>
              </div>
            )}
            {/* 照片計數 */}
            <p className="mt-2 text-sm text-gray-400">
              {currentPhotoIndex + 1} / {allPhotos.length}
            </p>
          </div>

          {/* 下一張 */}
          {allPhotos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToNext()
              }}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
              aria-label="下一張"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}

      <RouteMediaForm
        routeId={routeId}
        routeName={routeName}
        mediaType="photo"
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </>
  )
}
