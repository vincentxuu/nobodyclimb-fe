'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { BookOpen, Loader2 } from 'lucide-react'
import { biographyContentService, type Story } from '@/lib/api/services'
import { ContentLikeButton } from './ContentLikeButton'
import { ContentCommentSheet } from './ContentCommentSheet'

interface BiographyStoriesProps {
  /** 人物誌 ID */
  biographyId: string
  /** 自訂樣式 */
  className?: string
}

// 分類顏色映射 - 使用品牌色系
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  growth: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  psychology: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  community: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  practical: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  dreams: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  life: { bg: 'bg-brand-light', text: 'text-brand-dark' },
}

/**
 * 故事列表展示組件
 *
 * 顯示用戶填寫的所有故事，使用橫向滾動卡片，支援按讚和留言
 */
export function BiographyStories({
  biographyId,
  className,
}: BiographyStoriesProps) {
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 獲取故事列表
  const fetchStories = useCallback(async () => {
    try {
      const response = await biographyContentService.getStories(biographyId)
      if (response.success && response.data) {
        setStories(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error)
    } finally {
      setIsLoading(false)
    }
  }, [biographyId])

  useEffect(() => {
    fetchStories()
  }, [fetchStories])

  // 按讚切換
  const handleToggleLike = async (storyId: string) => {
    const response = await biographyContentService.toggleStoryLike(storyId)
    if (response.success && response.data) {
      // 更新本地狀態
      setStories((prev) =>
        prev.map((item) =>
          item.id === storyId
            ? { ...item, is_liked: response.data!.liked, like_count: response.data!.like_count }
            : item
        )
      )
      return response.data
    }
    throw new Error('Failed to toggle like')
  }

  // 獲取留言
  const handleFetchComments = async (storyId: string) => {
    const response = await biographyContentService.getStoryComments(storyId)
    if (response.success && response.data) {
      return response.data
    }
    return []
  }

  // 新增留言
  const handleAddComment = async (storyId: string, content: string) => {
    const response = await biographyContentService.addStoryComment(storyId, { content })
    if (response.success && response.data) {
      // 更新留言數
      setStories((prev) =>
        prev.map((item) =>
          item.id === storyId
            ? { ...item, comment_count: item.comment_count + 1 }
            : item
        )
      )
      return response.data
    }
    throw new Error('Failed to add comment')
  }

  if (isLoading) {
    return (
      <section className={cn('py-8', className)}>
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </section>
    )
  }

  if (stories.length === 0) {
    return null
  }

  return (
    <section className={cn('py-8', className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-[#3F3D3D]" />
          <h2 className="text-xl font-bold text-[#1B1A1A]">小故事</h2>
        </div>
        <span className="text-sm text-[#6D6C6C]">
          已分享 {stories.length} 則故事
        </span>
      </div>

      {/* 故事橫向滾動 */}
      <div className="flex gap-6 overflow-x-auto pb-4 snap-x -mx-4 px-4">
        {stories.map((story, index) => {
          const categoryId = story.category_id || 'growth'
          const colors = CATEGORY_COLORS[categoryId] || { bg: 'bg-gray-100', text: 'text-gray-700' }
          const title = story.title || story.question_text || story.question_id
          const categoryName = story.category_name || '故事'

          return (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.05 }}
              className="w-80 flex-shrink-0 snap-start rounded-xl bg-white p-6 shadow-sm border border-[#EBEAEA] flex flex-col"
            >
              {/* 分類標籤 */}
              <div className={cn(
                'mb-3 inline-block rounded px-2 py-1 text-xs font-medium self-start',
                colors.bg,
                colors.text
              )}>
                {story.category_emoji && `${story.category_emoji} `}{categoryName}
              </div>

              {/* 標題 */}
              <h3 className="mb-3 font-semibold text-[#1B1A1A]">
                {title}
              </h3>

              {/* 完整內容 */}
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#6D6C6C] flex-1">
                {story.content}
              </p>

              {/* 互動按鈕 */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#EBEAEA]">
                <ContentLikeButton
                  isLiked={story.is_liked || false}
                  likeCount={story.like_count}
                  onToggle={() => handleToggleLike(story.id)}
                />
                <ContentCommentSheet
                  contentTitle={title}
                  commentCount={story.comment_count}
                  onFetchComments={() => handleFetchComments(story.id)}
                  onAddComment={(content) => handleAddComment(story.id, content)}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

export default BiographyStories
