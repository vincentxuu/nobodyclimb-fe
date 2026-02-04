'use client'

import { useState, useEffect } from 'react'
import { Mountain, BookOpen, Users, Star, Plus, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const [activeTab, setActiveTab] = useState('ascents')
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

  return (
    <div className="mt-12 border-t pt-8">
      <h2 className="mb-4 border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
        社群內容
      </h2>

      {/* 統計摘要 */}
      {ascentSummary && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              攀爬人次
            </div>
            <div className="mt-1 text-2xl font-bold text-[#1B1A1A]">
              {ascentSummary.total_ascents}
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
              <Mountain className="h-4 w-4" />
              完攀人數
            </div>
            <div className="mt-1 text-2xl font-bold text-[#1B1A1A]">
              {ascentSummary.unique_climbers}
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
              <Star className="h-4 w-4" />
              平均評分
            </div>
            <div className="mt-1 text-2xl font-bold text-[#1B1A1A]">
              {ascentSummary.avg_rating?.toFixed(1) || '-'}
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
              <BookOpen className="h-4 w-4" />
              故事數
            </div>
            <div className="mt-1 text-2xl font-bold text-[#1B1A1A]">{stories.length}</div>
          </div>
        </div>
      )}

      {/* 快速動作按鈕 */}
      <div className="mb-6 flex flex-wrap gap-2">
        {isSignedIn ? (
          <>
            <Button onClick={() => setIsAscentFormOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" />
              記錄攀爬
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsStoryFormOpen(true)}
              className="gap-1"
            >
              <BookOpen className="h-4 w-4" />
              分享故事
            </Button>
          </>
        ) : (
          <Link href="/auth/login">
            <Button variant="outline" className="gap-1">
              <LogIn className="h-4 w-4" />
              登入以記錄攀爬或分享故事
            </Button>
          </Link>
        )}
      </div>

      {/* 分頁內容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ascents" className="gap-1">
            <Mountain className="h-4 w-4" />
            攀爬記錄 ({ascents.length})
          </TabsTrigger>
          <TabsTrigger value="stories" className="gap-1">
            <BookOpen className="h-4 w-4" />
            路線故事 ({stories.length})
          </TabsTrigger>
        </TabsList>

        {/* 攀爬記錄 */}
        <TabsContent value="ascents" className="mt-4">
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">載入中...</div>
          ) : ascents.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Mountain className="mx-auto mb-2 h-12 w-12 text-gray-300" />
              <p>還沒有人記錄攀爬</p>
              {isSignedIn && (
                <Button
                  variant="link"
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
        </TabsContent>

        {/* 路線故事 */}
        <TabsContent value="stories" className="mt-4">
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">載入中...</div>
          ) : stories.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <BookOpen className="mx-auto mb-2 h-12 w-12 text-gray-300" />
              <p>還沒有人分享故事</p>
              <p className="mt-1 text-xs">分享這條路線的命名由來或歷史故事</p>
              {isSignedIn && (
                <Button
                  variant="link"
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
        </TabsContent>
      </Tabs>

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
    </div>
  )
}
