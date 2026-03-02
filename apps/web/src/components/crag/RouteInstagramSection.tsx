'use client'

import { useState, useEffect } from 'react'
import { Instagram, Plus, LogIn, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks'
import { useRouteStories } from '@/lib/hooks/useRouteStories'
import { useAscents } from '@/lib/hooks/useAscents'
import { RouteMediaForm } from '@/components/crag/RouteMediaForm'
import type { RouteStory, RouteStoryFormData } from '@/lib/types/route-story'
import type { UserRouteAscent } from '@/lib/types/ascent'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface RouteInstagramSectionProps {
  routeId: string
  routeName: string
  staticPosts?: string[]
}

interface InstagramItem {
  url: string
  postId: string | null
  source: 'static' | 'user'
  storyId?: string
}

// 從 Instagram URL 提取貼文 ID
function getInstagramPostId(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

export function RouteInstagramSection({
  routeId,
  routeName,
  staticPosts = [],
}: RouteInstagramSectionProps) {
  const { isSignedIn } = useAuth()
  const { getRouteQuickShareInstagram, createStory } = useRouteStories()
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
        // 同時獲取 route stories 和 ascents 的 Instagram 貼文
        const [storiesRes, ascentsRes] = await Promise.all([
          getRouteQuickShareInstagram(routeId, { limit: 20 }),
          getRouteAscents(routeId, { limit: 50 }),
        ])
        if (isMounted) {
          setUserStories(storiesRes.data)
          // 只保留有 Instagram URL 的攀爬記錄
          setUserAscents(ascentsRes.data.filter((a) => a.instagram_url))
        }
      } catch (error) {
        console.error('Error loading instagram posts:', error)
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

  // 聚合所有 Instagram 貼文
  const allPosts: InstagramItem[] = [
    // 靜態 JSON 貼文
    ...staticPosts.map((url) => ({
      url,
      postId: getInstagramPostId(url),
      source: 'static' as const,
    })),
    // 用戶分享的貼文 (route stories)
    ...userStories
      .filter((story) => story.instagram_url)
      .map((story) => ({
        url: story.instagram_url!,
        postId: getInstagramPostId(story.instagram_url!),
        source: 'user' as const,
        storyId: story.id,
      })),
    // 攀爬記錄的 Instagram 貼文
    ...userAscents
      .filter((ascent) => ascent.instagram_url)
      .map((ascent) => ({
        url: ascent.instagram_url!,
        postId: getInstagramPostId(ascent.instagram_url!),
        source: 'user' as const,
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
        description: '已成功連結 Instagram 貼文',
      })
    } catch (error) {
      console.error('Error creating instagram share:', error)
      toast({
        title: '分享失敗',
        description: '無法連結貼文，請稍後再試',
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
            <Instagram className="mr-2 h-5 w-5 text-pink-600" />
            Instagram 分享
          </h2>
          {isSignedIn ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              連結貼文
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
        ) : allPosts.length === 0 ? (
          <div className="rounded-lg bg-gray-50 py-6 text-center text-gray-500">
            <Instagram className="mx-auto mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm">還沒有人分享這條路線的 Instagram 貼文</p>
            <p className="mt-1 text-xs text-gray-400">連結攀登紀錄、路線分享或打卡貼文</p>
            {isSignedIn && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsFormOpen(true)}
                className="mt-2"
              >
                連結 Instagram 貼文
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {allPosts.map((post, index) => (
              <div
                key={`${post.source}-${post.storyId || index}`}
                className="overflow-hidden rounded-lg border border-gray-200"
              >
                {post.postId ? (
                  <iframe
                    src={`https://www.instagram.com/p/${post.postId}/embed`}
                    className="h-[500px] w-full"
                    title={`${routeName} Instagram 貼文 ${index + 1}`}
                    scrolling="no"
                    allowFullScreen
                  />
                ) : (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-4 text-pink-600 hover:text-pink-700"
                  >
                    <Instagram className="mr-2 h-5 w-5" />
                    查看 Instagram 貼文
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <RouteMediaForm
        routeId={routeId}
        routeName={routeName}
        mediaType="instagram"
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </>
  )
}
