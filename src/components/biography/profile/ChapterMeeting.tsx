'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Lock, Loader2 } from 'lucide-react'
import { biographyContentService, type CoreStory } from '@/lib/api/services'
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
  const [story, setStory] = useState<CoreStory | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 獲取核心故事
  const fetchStory = useCallback(async () => {
    try {
      const response = await biographyContentService.getCoreStories(biographyId)
      if (response.success && response.data) {
        const found = response.data.find((s) => s.question_id === 'climbing_origin')
        setStory(found || null)
      }
    } catch (error) {
      console.error('Failed to fetch climbing origin story:', error)
    } finally {
      setIsLoading(false)
    }
  }, [biographyId])

  useEffect(() => {
    fetchStory()
  }, [fetchStory])

  // 按讚切換
  const handleToggleLike = async () => {
    if (!story) throw new Error('No story')
    const response = await biographyContentService.toggleCoreStoryLike(story.id)
    if (response.success && response.data) {
      setStory((prev) =>
        prev ? { ...prev, is_liked: response.data!.liked, like_count: response.data!.like_count } : null
      )
      return response.data
    }
    throw new Error('Failed to toggle like')
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
    if (!story) throw new Error('No story')
    const response = await biographyContentService.addCoreStoryComment(story.id, { content })
    if (response.success && response.data) {
      setStory((prev) =>
        prev ? { ...prev, comment_count: prev.comment_count + 1 } : null
      )
      return response.data
    }
    throw new Error('Failed to add comment')
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
