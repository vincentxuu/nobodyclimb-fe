'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Plus, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks'
import { useRouteStories } from '@/lib/hooks/useRouteStories'
import { RouteStoryCard, RouteStoryForm } from '@/components/route-story'
import type { RouteStory } from '@/lib/types/route-story'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface RouteStoriesSectionProps {
  routeId: string
  routeName: string
  routeGrade?: string
}

export function RouteStoriesSection({
  routeId,
  routeName,
  routeGrade,
}: RouteStoriesSectionProps) {
  const { isSignedIn } = useAuth()
  const { getRouteStories, createStory, toggleLike, toggleHelpful } = useRouteStories()
  const { toast } = useToast()

  const [stories, setStories] = useState<RouteStory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStoryFormOpen, setIsStoryFormOpen] = useState(false)
  const [isStorySubmitting, setIsStorySubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setIsLoading(true)
      try {
        const storiesRes = await getRouteStories(routeId, { limit: 10 })
        if (isMounted) {
          setStories(storiesRes.data)
        }
      } catch (error) {
        console.error('Error loading stories:', error)
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

  return (
    <>
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
            路線故事
          </h2>
          {isSignedIn ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStoryFormOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              分享故事
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
        ) : stories.length === 0 ? (
          <div className="rounded-lg bg-gray-50 py-6 text-center text-gray-500">
            <BookOpen className="mx-auto mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm">還沒有人分享這條路線的故事</p>
            <p className="mt-1 text-xs text-gray-400">分享命名由來、攀登心得、有趣經歷或路線特色</p>
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
