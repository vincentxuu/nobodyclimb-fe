'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Lock, Loader2 } from 'lucide-react'
import { biographyContentService } from '@/lib/api/services'
import { useAdviceToSelfStory, useCoreStoryLikeMutation, useCoreStoryCommentMutation } from '@/lib/hooks/useCoreStories'
import { ContentInteractionBar } from '../display/ContentInteractionBar'

interface ChapterAdviceProps {
  biographyId: string
  personName?: string
  updatedAt?: string
}

/**
 * Chapter 4 - 給自己的話
 * 信件/便條紙風格設計
 */
export function ChapterAdvice({ biographyId, personName, updatedAt }: ChapterAdviceProps) {
  const { story, isLoading } = useAdviceToSelfStory(biographyId)
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

  // 格式化日期
  const displayDate = useMemo(() => {
    const dateStr = story?.updated_at || updatedAt
    if (!dateStr) return null

    try {
      return new Date(dateStr).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    } catch {
      return null
    }
  }, [story?.updated_at, updatedAt])

  if (isLoading) {
    return (
      <section className="my-16 bg-gradient-to-br from-brand-light to-gray-100 px-8 py-20">
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </section>
    )
  }

  const isPlaceholder = !story?.content

  return (
    <motion.section
      className="my-16 bg-gradient-to-br from-brand-light to-gray-100 px-8 py-20"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      data-placeholder={isPlaceholder}
    >
      <div className="mx-auto max-w-2xl">
        {/* 章節標題 */}
        <div className="mb-8 text-center">
          <span className="mb-2 inline-block text-sm font-medium uppercase tracking-wider text-brand-dark">
            Chapter 4
          </span>
          <h2 className="text-2xl font-semibold text-gray-900">
            給剛開始攀岩的自己
          </h2>
        </div>

        {/* 內容框 - 像是一張便條紙 */}
        <div className="relative rounded-lg bg-white p-8 shadow-lg">
          {/* 頂部裝飾線 */}
          <div className="absolute -top-1 left-8 h-2 w-16 rounded-full bg-brand-accent" />

          {isPlaceholder ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="flex items-center gap-2 text-lg text-gray-400">
                <Lock size={18} />
                <span>等這個人心情好再來問</span>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-lg leading-relaxed text-gray-700">
                {story?.content}
              </p>

              {/* 簽名 */}
              <div className="mt-6 text-right text-gray-600">
                <p className="font-medium">— {personName}</p>
                {displayDate && <p className="text-sm">{displayDate}</p>}
              </div>

              {/* 互動按鈕 */}
              {story && (
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
                  className="mt-6 pt-4 border-t border-gray-200"
                  showBorder={false}
                />
              )}
            </>
          )}
        </div>
      </div>
    </motion.section>
  )
}
