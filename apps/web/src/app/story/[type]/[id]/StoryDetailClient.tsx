'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ContentInteractionBar } from '@/components/biography/display/ContentInteractionBar'
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
  like_count: number
  comment_count: number
  is_liked?: boolean
  biography_id: string
  biography_slug: string
  author_name: string
  author_avatar?: string
  author_title?: string
  created_at?: string
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

export default function StoryDetailClient({ params }: StoryDetailClientProps) {
  const { type, id } = use(params)
  const [story, setStory] = useState<StoryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [commentCount, setCommentCount] = useState(0)

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
          {/* 故事類型標籤 */}
          <p className="mb-4 text-sm text-[#8E8C8C]">{getStoryLabel()}</p>

          {/* 故事內容 */}
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm md:p-8">
            <p className="text-xl font-medium leading-relaxed text-[#1B1A1A] md:text-2xl">
              &ldquo;{getStoryText()}&rdquo;
            </p>
          </div>

          {/* 互動區 */}
          <div className="mb-8 rounded-xl bg-white p-4 shadow-sm md:p-6">
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
          </div>

          {/* 作者資訊區 */}
          <div className="rounded-xl bg-white p-4 shadow-sm md:p-6">
            <div className="flex items-center gap-4">
              {/* 頭像 */}
              <Link href={`/biography/profile/${story.biography_slug}`}>
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
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
                        sizes="56px"
                      />
                    )
                  ) : (
                    <img
                      src={getDefaultAvatarUrl(story.author_name || 'anonymous', 56)}
                      alt={story.author_name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </Link>

              {/* 作者資訊 */}
              <div className="min-w-0 flex-1">
                <Link href={`/biography/profile/${story.biography_slug}`}>
                  <h3 className="text-base font-semibold text-[#1B1A1A] hover:underline">
                    {story.author_name}
                  </h3>
                </Link>
                {story.author_title && (
                  <p className="mt-0.5 text-sm text-[#6D6C6C] line-clamp-1">
                    「{story.author_title}」
                  </p>
                )}
              </div>

              {/* CTA 按鈕 - 桌面版 */}
              <Link href={`/biography/profile/${story.biography_slug}`} className="hidden sm:block flex-shrink-0">
                <Button
                  variant="outline"
                  className="flex items-center gap-1.5 border-[#1B1A1A] text-sm text-[#1B1A1A] hover:bg-[#F5F4F4]"
                >
                  看看 {story.author_name} 的故事
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>

            {/* CTA 按鈕 - 手機版 */}
            <Link href={`/biography/profile/${story.biography_slug}`} className="mt-4 block sm:hidden">
              <Button
                variant="outline"
                className="flex w-full items-center justify-center gap-1.5 border-[#1B1A1A] text-sm text-[#1B1A1A] hover:bg-[#F5F4F4]"
              >
                看看 {story.author_name} 的故事
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
