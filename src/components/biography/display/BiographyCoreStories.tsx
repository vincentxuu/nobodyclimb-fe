'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Feather, Loader2 } from 'lucide-react'
import { biographyContentService, type ContentComment } from '@/lib/api/services'
import { useCoreStories, useCoreStoryLikeMutation, useCoreStoryCommentMutation } from '@/lib/hooks/useCoreStories'
import { ContentLikeButton } from './ContentLikeButton'
import { ContentCommentSheet } from './ContentCommentSheet'

interface BiographyCoreStoriesProps {
  /** 人物誌 ID */
  biographyId: string
  /** 自訂樣式 */
  className?: string
}

// 核心故事顯示順序
const CORE_STORY_ORDER = ['climbing_origin', 'climbing_meaning', 'advice_to_self']

/**
 * 核心故事展示組件
 *
 * 顯示用戶填寫的三個核心故事，支援按讚和留言
 * 標題和副標題從 API 取得（來自 core_story_questions 資料表）
 */
export function BiographyCoreStories({
  biographyId,
  className,
}: BiographyCoreStoriesProps) {
  const { data: coreStories, isLoading } = useCoreStories(biographyId)
  const likeMutation = useCoreStoryLikeMutation(biographyId)

  // 按照預定順序排序
  const sortedStories = coreStories
    ? [...coreStories].sort((a, b) => {
        const aIndex = CORE_STORY_ORDER.indexOf(a.question_id)
        const bIndex = CORE_STORY_ORDER.indexOf(b.question_id)
        return aIndex - bIndex
      })
    : []

  // 按讚切換
  const handleToggleLike = async (storyId: string) => {
    return likeMutation.mutateAsync(storyId)
  }

  // 獲取留言
  const handleFetchComments = async (storyId: string) => {
    const response = await biographyContentService.getCoreStoryComments(storyId)
    if (response.success && response.data) {
      return response.data
    }
    return []
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

  if (sortedStories.length === 0) {
    return null
  }

  return (
    <section className={cn('py-8', className)}>
      <div className="flex items-center gap-2 mb-6">
        <Feather size={20} className="text-[#3F3D3D]" />
        <h2 className="text-xl font-bold text-[#1B1A1A]">我的故事</h2>
      </div>

      <div className="space-y-6">
        {sortedStories.map((story, index) => (
          <CoreStoryCard
            key={story.id}
            story={story}
            index={index}
            biographyId={biographyId}
            onToggleLike={() => handleToggleLike(story.id)}
            onFetchComments={() => handleFetchComments(story.id)}
          />
        ))}
      </div>
    </section>
  )
}

// 分離的卡片組件，用於正確使用 useCoreStoryCommentMutation
interface CoreStoryCardProps {
  story: {
    id: string
    question_id: string
    content: string
    title?: string
    subtitle?: string
    is_liked?: boolean
    like_count: number
    comment_count: number
  }
  index: number
  biographyId: string
  onToggleLike: () => Promise<{ liked: boolean; like_count: number }>
  onFetchComments: () => Promise<ContentComment[]>
}

function CoreStoryCard({
  story,
  index,
  biographyId,
  onToggleLike,
  onFetchComments,
}: CoreStoryCardProps) {
  const commentMutation = useCoreStoryCommentMutation(biographyId, story.id)

  // 新增留言
  const handleAddComment = async (content: string) => {
    return commentMutation.mutateAsync(content)
  }

  // 使用 API 返回的 title/subtitle，若無則使用 question_id 作為備用
  const displayTitle = story.title || story.question_id
  const displaySubtitle = story.subtitle || ''

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.1 }}
      className="rounded-2xl bg-white p-6 shadow-sm border border-[#EBEAEA]"
    >
      {/* 標題區 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#1B1A1A]">
          {displayTitle}
        </h3>
        {displaySubtitle && (
          <p className="text-sm text-[#9D9B9B] mt-1">
            {displaySubtitle}
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
          onToggle={onToggleLike}
          size="md"
        />
        <ContentCommentSheet
          contentTitle={displayTitle}
          commentCount={story.comment_count}
          onFetchComments={onFetchComments}
          onAddComment={handleAddComment}
          size="md"
        />
      </div>
    </motion.article>
  )
}

export default BiographyCoreStories
