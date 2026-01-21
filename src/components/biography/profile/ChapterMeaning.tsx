'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { biographyContentService, type CoreStory } from '@/lib/api/services'
import { ContentLikeButton } from '../display/ContentLikeButton'
import { ContentCommentSheet } from '../display/ContentCommentSheet'

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
  const [story, setStory] = useState<CoreStory | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 獲取核心故事
  const fetchStory = useCallback(async () => {
    try {
      const response = await biographyContentService.getCoreStories(biographyId)
      if (response.success && response.data) {
        const found = response.data.find((s) => s.question_id === 'climbing_meaning')
        setStory(found || null)
      }
    } catch (error) {
      console.error('Failed to fetch climbing meaning story:', error)
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
          <div className="flex items-center justify-center gap-4 mt-8">
            <ContentLikeButton
              isLiked={story.is_liked || false}
              likeCount={story.like_count}
              onToggle={handleToggleLike}
              size="md"
            />
            <ContentCommentSheet
              contentTitle="攀岩對你來說是什麼"
              commentCount={story.comment_count}
              onFetchComments={handleFetchComments}
              onAddComment={handleAddComment}
              size="md"
            />
          </div>
        )}
      </div>
    </motion.section>
  )
}
