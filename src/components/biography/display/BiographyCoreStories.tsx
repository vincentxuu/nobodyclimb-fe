'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Feather, Loader2 } from 'lucide-react'
import { biographyContentService, type CoreStory } from '@/lib/api/services'
import { ContentLikeButton } from './ContentLikeButton'
import { ContentCommentSheet } from './ContentCommentSheet'

interface BiographyCoreStoriesProps {
  /** 人物誌 ID */
  biographyId: string
  /** 自訂樣式 */
  className?: string
}

// 核心故事問題定義
const CORE_STORY_TITLES: Record<string, { title: string; subtitle: string; emoji: string }> = {
  climbing_origin: {
    title: '你與攀岩的相遇',
    subtitle: '描述第一次接觸攀岩的情景',
    emoji: '🌱',
  },
  climbing_meaning: {
    title: '攀岩對你來說是什麼？',
    subtitle: '攀岩在你生活中扮演什麼角色',
    emoji: '💫',
  },
  advice_to_self: {
    title: '給剛開始攀岩的自己',
    subtitle: '如果能回到起點，你會對自己說什麼',
    emoji: '✨',
  },
}

// 核心故事顯示順序
const CORE_STORY_ORDER = ['climbing_origin', 'climbing_meaning', 'advice_to_self']

/**
 * 核心故事展示組件
 *
 * 顯示用戶填寫的三個核心故事，支援按讚和留言
 */
export function BiographyCoreStories({
  biographyId,
  className,
}: BiographyCoreStoriesProps) {
  const [coreStories, setCoreStories] = useState<CoreStory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 獲取核心故事列表
  const fetchCoreStories = useCallback(async () => {
    try {
      const response = await biographyContentService.getCoreStories(biographyId)
      if (response.success && response.data) {
        // 按照預定順序排序
        const sorted = [...response.data].sort((a, b) => {
          const aIndex = CORE_STORY_ORDER.indexOf(a.question_id)
          const bIndex = CORE_STORY_ORDER.indexOf(b.question_id)
          return aIndex - bIndex
        })
        setCoreStories(sorted)
      }
    } catch (error) {
      console.error('Failed to fetch core stories:', error)
    } finally {
      setIsLoading(false)
    }
  }, [biographyId])

  useEffect(() => {
    fetchCoreStories()
  }, [fetchCoreStories])

  // 按讚切換
  const handleToggleLike = async (storyId: string) => {
    const response = await biographyContentService.toggleCoreStoryLike(storyId)
    if (response.success && response.data) {
      // 更新本地狀態
      setCoreStories((prev) =>
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
    const response = await biographyContentService.getCoreStoryComments(storyId)
    if (response.success && response.data) {
      return response.data
    }
    return []
  }

  // 新增留言
  const handleAddComment = async (storyId: string, content: string) => {
    const response = await biographyContentService.addCoreStoryComment(storyId, { content })
    if (response.success && response.data) {
      // 更新留言數
      setCoreStories((prev) =>
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

  if (coreStories.length === 0) {
    return null
  }

  return (
    <section className={cn('py-8', className)}>
      <div className="flex items-center gap-2 mb-6">
        <Feather size={20} className="text-[#3F3D3D]" />
        <h2 className="text-xl font-bold text-[#1B1A1A]">我的故事</h2>
      </div>

      <div className="space-y-6">
        {coreStories.map((story, index) => {
          const storyMeta = CORE_STORY_TITLES[story.question_id] || {
            title: story.title || story.question_id,
            subtitle: story.subtitle || '',
            emoji: '📖',
          }

          return (
            <motion.article
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl bg-white p-6 shadow-sm border border-[#EBEAEA]"
            >
              {/* 標題區 */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{storyMeta.emoji}</span>
                  <h3 className="text-lg font-semibold text-[#1B1A1A]">
                    {storyMeta.title}
                  </h3>
                </div>
                {storyMeta.subtitle && (
                  <p className="text-sm text-[#9D9B9B] ml-7">
                    {storyMeta.subtitle}
                  </p>
                )}
              </div>

              {/* 內容 */}
              <div className="whitespace-pre-wrap text-[#3F3D3D] leading-relaxed">
                {story.content}
              </div>

              {/* 互動按鈕 */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#EBEAEA]">
                <ContentLikeButton
                  isLiked={story.is_liked || false}
                  likeCount={story.like_count}
                  onToggle={() => handleToggleLike(story.id)}
                  size="md"
                />
                <ContentCommentSheet
                  contentTitle={storyMeta.title}
                  commentCount={story.comment_count}
                  onFetchComments={() => handleFetchComments(story.id)}
                  onAddComment={(content) => handleAddComment(story.id, content)}
                  size="md"
                />
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}

export default BiographyCoreStories
