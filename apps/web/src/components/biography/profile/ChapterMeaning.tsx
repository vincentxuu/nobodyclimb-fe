'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { biographyContentService } from '@/lib/api/services'
import { useClimbingMeaningStory, useCoreStoryLikeMutation, useCoreStoryCommentMutation } from '@/lib/hooks/useCoreStories'
import { ContentInteractionBar } from '../display/ContentInteractionBar'

/** 預設的攀岩意義文字 */
const DEFAULT_CLIMBING_MEANING = '這題還在想，等我爬完這條再說'

interface ChapterMeaningProps {
  biographyId: string
  personName?: string
}

/**
 * Chapter 2 - 意義篇
 * 攀岩對你來說是什麼 - 引言式設計
 */
export function ChapterMeaning({ biographyId, personName }: ChapterMeaningProps) {
  const { story, isLoading } = useClimbingMeaningStory(biographyId)
  const likeMutation = useCoreStoryLikeMutation(biographyId)
  const commentMutation = useCoreStoryCommentMutation(biographyId, story?.id)

  // 按讚切換
  const handleToggleLike = async () => {
    if (!story) throw new Error('No story')
    return likeMutation.mutateAsync(story.id)
  }

  // 獲取留言
  const handleFetchComments = async () => {
    if (!story) return []
    const response = await biographyContentService.getCoreStoryComments(story.id)
    if (response.success && response.data) {
      return response.data
    }
    return []
  }

  // 新增留言
  const handleAddComment = async (content: string) => {
    return commentMutation.mutateAsync(content)
  }

  if (isLoading) {
    return (
      <section className="my-16 bg-gradient-to-br from-brand-accent/10 to-brand-light px-8 py-20">
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </section>
    )
  }

  // 預設內容
  const displayMeaning = story?.content || DEFAULT_CLIMBING_MEANING
  const isDefault = !story?.content

  return (
    <motion.section
      className="my-16 bg-gradient-to-br from-brand-accent/10 to-brand-light px-8 py-20"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
    >
      <div className="mx-auto max-w-3xl text-center">
        {/* 章節標題 */}
        <span className="mb-4 inline-block text-sm font-medium uppercase tracking-wider bg-brand-accent">
          Chapter 2
        </span>
        <h2 className="mb-8 text-2xl font-semibold text-gray-900">
          攀岩對你來說是什麼
        </h2>

        {/* 引言框 */}
        <blockquote className="relative">
          <span className="absolute -left-4 -top-4 text-6xl bg-brand-accent/30">
            &ldquo;
          </span>
          <p className={`px-8 text-xl italic leading-relaxed ${isDefault ? 'text-gray-400' : 'text-gray-800'}`}>
            {displayMeaning}
          </p>
          <span className="absolute -bottom-8 -right-4 text-6xl bg-brand-accent/30">
            &rdquo;
          </span>
        </blockquote>

        {/* 簽名 */}
        <p className="mt-12 text-gray-600">— {personName}</p>

        {/* 互動按鈕 */}
        {story && !isDefault && (
          <ContentInteractionBar
            contentType="core-stories"
            contentId={story.id}
            isLiked={story.is_liked || false}
            likeCount={story.like_count}
            commentCount={story.comment_count}
            onToggleLike={handleToggleLike}
            onFetchComments={handleFetchComments}
            onAddComment={handleAddComment}
            size="md"
            className="mt-8"
            showBorder={false}
            centered
          />
        )}
      </div>
    </motion.section>
  )
}
