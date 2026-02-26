'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2, Calendar, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ContentInteractionBar } from '@/components/biography/display/ContentInteractionBar'
import { ShareButton } from '@/components/story/ShareButton'
import { RelatedStories } from '@/components/story/RelatedStories'
import {
  biographyContentService,
  CoreStory,
  OneLiner,
  Story,
  ContentComment,
} from '@/lib/api/services'
import { isSvgUrl, getDefaultAvatarUrl } from '@/lib/utils/image'

// 故事類型定義
type StoryType = 'core-stories' | 'one-liners' | 'stories'

// 故事詳情類型
interface StoryDetail {
  id: string
  content?: string
  answer?: string
  title?: string
  question?: string
  subtitle?: string
  category_name?: string
  category_emoji?: string
  word_count?: number
  like_count: number
  comment_count: number
  is_liked?: boolean
  biography_id: string
  biography_slug: string
  author_name: string
  author_avatar?: string
  author_title?: string
  created_at?: string
  updated_at?: string
}

interface StoryDetailClientProps {
  params: Promise<{
    type: string
    id: string
  }>
}

// 故事類型標籤
const TYPE_LABELS: Record<StoryType, string> = {
  'core-stories': '核心故事',
  'one-liners': '一句話',
  'stories': '小故事',
}

// 驗證故事類型
function isValidStoryType(type: string): type is StoryType {
  return ['core-stories', 'one-liners', 'stories'].includes(type)
}

// 格式化日期
function formatDate(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return '今天'
  if (diffInDays === 1) return '昨天'
  if (diffInDays < 7) return `${diffInDays} 天前`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} 週前`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} 個月前`

  return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function StoryDetailClient({ params }: StoryDetailClientProps) {
  const { type, id } = use(params)
  const [story, setStory] = useState<StoryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [relatedStories, setRelatedStories] = useState<any[]>([])

  // 載入故事資料
  useEffect(() => {
    const loadStory = async () => {
      if (!isValidStoryType(type)) {
        setError('無效的故事類型')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        let response
        switch (type) {
          case 'core-stories':
            response = await biographyContentService.getCoreStoryById(id)
            break
          case 'one-liners':
            response = await biographyContentService.getOneLinerById(id)
            break
          case 'stories':
            response = await biographyContentService.getStoryById(id)
            break
        }

        if (response.success && response.data) {
          const data = response.data as StoryDetail
          setStory(data)
          setLikeCount(data.like_count || 0)
          setIsLiked(data.is_liked || false)
          setCommentCount(data.comment_count || 0)

          // 載入相關故事
          loadRelatedStories(data.biography_id, type)
        } else {
          setError('找不到這則故事')
        }
      } catch (err) {
        console.error('Failed to load story:', err)
        setError('載入故事時發生錯誤')
      } finally {
        setLoading(false)
      }
    }

    loadStory()
  }, [type, id])

  // 載入相關故事（同作者的其他故事）
  const loadRelatedStories = async (biographyId: string, currentType: string) => {
    try {
      const allRelated: any[] = []

      // 根據當前故事類型，載入其他類型的故事
      if (currentType !== 'core-stories') {
        const coreStoriesResponse = await biographyContentService.getCoreStories(biographyId)
        if (coreStoriesResponse.success && coreStoriesResponse.data) {
          allRelated.push(
            ...coreStoriesResponse.data.slice(0, 2).map((s: CoreStory) => ({
              id: s.id,
              type: 'core-stories' as const,
              title: s.title || '核心故事',
              preview: s.content,
              category: undefined,
              categoryEmoji: undefined,
            }))
          )
        }
      }

      if (currentType !== 'one-liners') {
        const oneLinersResponse = await biographyContentService.getOneLiners(biographyId)
        if (oneLinersResponse.success && oneLinersResponse.data) {
          allRelated.push(
            ...oneLinersResponse.data.slice(0, 2).map((s: OneLiner) => ({
              id: s.id,
              type: 'one-liners' as const,
              title: s.question || '一句話',
              preview: s.answer,
              category: undefined,
              categoryEmoji: undefined,
            }))
          )
        }
      }

      if (currentType !== 'stories') {
        const storiesResponse = await biographyContentService.getStories(biographyId)
        if (storiesResponse.success && storiesResponse.data) {
          allRelated.push(
            ...storiesResponse.data.slice(0, 2).map((s: Story) => ({
              id: s.id,
              type: 'stories' as const,
              title: s.title || s.category_name || '小故事',
              preview: s.content,
              category: s.category_name,
              categoryEmoji: s.category_emoji,
            }))
          )
        }
      }

      // 隨機選取最多 3 個相關故事
      const shuffled = allRelated.sort(() => 0.5 - Math.random())
      setRelatedStories(shuffled.slice(0, 3))
    } catch (err) {
      console.error('Failed to load related stories:', err)
    }
  }

  // 取得故事內容文字
  const getStoryText = () => {
    if (!story) return ''
    if (type === 'one-liners') {
      return story.answer || ''
    }
    return story.content || ''
  }

  // 取得故事標籤
  const getStoryLabel = () => {
    if (!story) return ''
    if (type === 'core-stories') {
      return story.title || '核心故事'
    }
    if (type === 'one-liners') {
      return story.question || '一句話'
    }
    return story.title || story.category_name || '小故事'
  }

  // 互動處理函數
  const handleToggleLike = async () => {
    if (!isValidStoryType(type)) throw new Error('無效的故事類型')

    let response
    switch (type) {
      case 'core-stories':
        response = await biographyContentService.toggleCoreStoryLike(id)
        break
      case 'one-liners':
        response = await biographyContentService.toggleOneLinerLike(id)
        break
      case 'stories':
        response = await biographyContentService.toggleStoryLike(id)
        break
    }

    if (response.success && response.data) {
      setIsLiked(response.data.liked)
      setLikeCount(response.data.like_count)
      return response.data
    }
    throw new Error('按讚失敗')
  }

  const handleFetchComments = async (): Promise<ContentComment[]> => {
    if (!isValidStoryType(type)) return []

    let response
    switch (type) {
      case 'core-stories':
        response = await biographyContentService.getCoreStoryComments(id)
        break
      case 'one-liners':
        response = await biographyContentService.getOneLinerComments(id)
        break
      case 'stories':
        response = await biographyContentService.getStoryComments(id)
        break
    }

    if (response.success && response.data) {
      return response.data
    }
    return []
  }

  const handleAddComment = async (content: string): Promise<ContentComment> => {
    if (!isValidStoryType(type)) throw new Error('無效的故事類型')

    let response
    switch (type) {
      case 'core-stories':
        response = await biographyContentService.addCoreStoryComment(id, { content })
        break
      case 'one-liners':
        response = await biographyContentService.addOneLinerComment(id, { content })
        break
      case 'stories':
        response = await biographyContentService.addStoryComment(id, { content })
        break
    }

    if (response.success && response.data) {
      setCommentCount((prev) => prev + 1)
      return response.data
    }
    throw new Error('新增留言失敗')
  }

  const handleDeleteComment = async (commentId: string): Promise<void> => {
    if (!isValidStoryType(type)) throw new Error('無效的故事類型')

    let response
    switch (type) {
      case 'core-stories':
        response = await biographyContentService.deleteCoreStoryComment(commentId)
        break
      default:
        throw new Error('此類型不支援刪除留言')
    }

    if (response.success) {
      setCommentCount((prev) => Math.max(0, prev - 1))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page-content-bg">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-page-content-bg">
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-lg text-[#6D6C6C]">{error || '找不到這則故事'}</p>
          <Link href="/biography?tab=stories">
            <Button variant="outline" className="mt-4">
              瀏覽更多故事
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const storyType = type as StoryType

  return (
    <div className="min-h-screen bg-page-content-bg">
      {/* 頂部導航區 */}
      <div className="container relative mx-auto px-4 pb-4 pt-4 md:pt-8">
        {/* 麵包屑導航 */}
        <div className="mb-4 md:mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '故事', href: '/biography?tab=stories' },
              { label: TYPE_LABELS[storyType] || '故事' },
            ]}
            hideOnMobile
          />
        </div>

        {/* 返回按鈕 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link href="/biography?tab=stories">
            <Button
              variant="ghost"
              className="flex items-center gap-2 bg-white shadow-sm hover:bg-[#dbd8d8]"
            >
              <ArrowLeft size={16} />
              <span>返回故事列表</span>
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* 故事內容區 */}
      <div className="container mx-auto max-w-3xl px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* 標題區 */}
          <div className="mb-8">
            {/* 標題 */}
            <h1 className="mb-4 text-3xl font-bold leading-tight text-[#1B1A1A] md:text-4xl">
              {getStoryLabel()}
            </h1>

            {/* 元資訊標籤 */}
            <div className="flex flex-wrap items-center gap-2">
              {/* 類型標籤 */}
              <span className="inline-flex items-center rounded-full bg-[#1B1A1A] px-3 py-1 text-xs font-medium text-white">
                {TYPE_LABELS[storyType]}
              </span>

              {/* 分類標籤（僅小故事） */}
              {storyType === 'stories' && story.category_name && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {story.category_emoji && <span>{story.category_emoji}</span>}
                  <span>{story.category_name}</span>
                </span>
              )}

              {/* 發布時間 */}
              {story.created_at && (
                <span className="inline-flex items-center gap-1 text-xs text-[#8E8C8C]">
                  <Calendar size={12} />
                  <span>{formatDate(story.created_at)}</span>
                </span>
              )}

              {/* 字數（僅小故事） */}
              {storyType === 'stories' && story.word_count && (
                <span className="text-xs text-[#8E8C8C]">{story.word_count} 字</span>
              )}
            </div>
          </div>

          {/* 故事內容卡片 */}
          <div className="relative mb-8 overflow-hidden rounded-2xl border-l-4 border-brand-yellow-100 bg-white shadow-sm">
            {/* 內容區 */}
            <div className="px-6 py-8 md:px-10 md:py-12">
              {/* 故事文字 */}
              <blockquote className="text-xl leading-relaxed text-[#2D2C2C] md:text-2xl md:leading-[1.6]">
                {getStoryText()}
              </blockquote>
            </div>
          </div>

          {/* 互動區 */}
          <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm md:p-6">
            {/* 快速反應和按讚留言 */}
            <ContentInteractionBar
              contentType={storyType}
              contentId={id}
              isLiked={isLiked}
              likeCount={likeCount}
              commentCount={commentCount}
              onToggleLike={handleToggleLike}
              onFetchComments={handleFetchComments}
              onAddComment={handleAddComment}
              onDeleteComment={storyType === 'core-stories' ? handleDeleteComment : undefined}
              size="md"
              showBorder={false}
            />

            {/* 分隔線與分享 */}
            <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4">
              <span className="text-sm text-[#8E8C8C]">喜歡這則故事？</span>
              <ShareButton
                title={getStoryLabel()}
                url={typeof window !== 'undefined' ? window.location.href : ''}
              />
            </div>
          </div>

          {/* 作者資訊區 */}
          <div className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            {/* 標題 */}
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#8E8C8C]">作者</h2>

            <div className="flex items-center gap-4">
              {/* 頭像 */}
              <Link href={`/biography/profile/${story.biography_slug}`}>
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 ring-2 ring-transparent transition-all hover:ring-gray-300 md:h-20 md:w-20">
                  {story.author_avatar ? (
                    isSvgUrl(story.author_avatar) ? (
                      <img
                        src={story.author_avatar}
                        alt={story.author_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={story.author_avatar}
                        alt={story.author_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 64px, 80px"
                      />
                    )
                  ) : (
                    <img
                      src={getDefaultAvatarUrl(story.author_name || 'anonymous', 80)}
                      alt={story.author_name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </Link>

              {/* 作者資訊 */}
              <div className="min-w-0 flex-1">
                <Link href={`/biography/profile/${story.biography_slug}`}>
                  <h3 className="text-lg font-bold text-[#1B1A1A] transition-colors hover:text-[#6D6C6C]">
                    {story.author_name}
                  </h3>
                </Link>
                {story.author_title && (
                  <p className="mt-1 text-sm text-[#6D6C6C] line-clamp-2">
                    {story.author_title}
                  </p>
                )}
              </div>

              {/* CTA 按鈕 - 桌面版 */}
              <Link href={`/biography/profile/${story.biography_slug}`} className="hidden sm:block flex-shrink-0">
                <Button
                  className="flex items-center gap-2 bg-brand-yellow-100 text-sm font-semibold text-[#1B1A1A] transition-all hover:bg-brand-yellow-200"
                >
                  <span>查看故事</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>

            {/* CTA 按鈕 - 手機版 */}
            <Link href={`/biography/profile/${story.biography_slug}`} className="mt-4 block sm:hidden">
              <Button
                className="flex w-full items-center justify-center gap-2 bg-brand-yellow-100 text-sm font-semibold text-[#1B1A1A] transition-all hover:bg-brand-yellow-200"
              >
                <span>查看 {story.author_name} 的完整故事</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          {/* 相關推薦故事 */}
          {relatedStories.length > 0 && (
            <RelatedStories
              stories={relatedStories}
              authorName={story.author_name}
              authorSlug={story.biography_slug}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}
