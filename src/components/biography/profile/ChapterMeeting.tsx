'use client'

import { motion } from 'framer-motion'
import { Lock, Loader2 } from 'lucide-react'
import { biographyContentService } from '@/lib/api/services'
import { useClimbingOriginStory, useCoreStoryLikeMutation, useCoreStoryCommentMutation } from '@/lib/hooks/useCoreStories'
import { ContentLikeButton } from '../display/ContentLikeButton'
import { ContentCommentSheet } from '../display/ContentCommentSheet'

interface ChapterMeetingProps {
  biographyId: string
}

/**
 * Chapter 1 - 相遇篇
 * 你與攀岩的相遇故事
 */
export function ChapterMeeting({ biographyId }: ChapterMeetingProps) {
  const { story, isLoading } = useClimbingOriginStory(biographyId)
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
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </section>
    )
  }

  const isPlaceholder = !story?.content
  const paragraphs = story?.content?.split('\n').filter((p) => p.trim()) || []

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      className="mx-auto max-w-5xl px-4 py-16"
      data-placeholder={isPlaceholder}
    >
      {/* 章節標題 */}
      <div className="mb-8">
        <span className="text-sm font-medium uppercase tracking-wider bg-brand-accent">
          Chapter 1
        </span>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">
          你與攀岩的相遇
        </h2>
      </div>

      {/* 文字內容 */}
      <div>
        {isPlaceholder ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex items-center gap-2 text-lg text-gray-400">
              <Lock size={18} />
              <span>成為岩友後解鎖相遇故事</span>
            </div>
          </div>
        ) : (
          <>
            {paragraphs.map((para, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.1 }}
                className="mb-6 text-lg leading-relaxed text-gray-700"
              >
                {para}
              </motion.p>
            ))}

            {/* 互動按鈕 */}
            {story && (
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                <ContentLikeButton
                  isLiked={story.is_liked || false}
                  likeCount={story.like_count}
                  onToggle={handleToggleLike}
                  size="md"
                />
                <ContentCommentSheet
                  contentTitle="你與攀岩的相遇"
                  commentCount={story.comment_count}
                  onFetchComments={handleFetchComments}
                  onAddComment={handleAddComment}
                  size="md"
                />
              </div>
            )}
          </>
        )}
      </div>
    </motion.section>
  )
}
