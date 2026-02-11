'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRightCircle, Loader2, Mountain, MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { biographyContentService, CoreStory, OneLiner, Story } from '@/lib/api/services'
import { isSvgUrl, getDefaultAvatarUrl } from '@/lib/utils/image'

type FeaturedContent =
  | (CoreStory & { type: 'core-story'; author_name: string; author_avatar?: string; biography_slug?: string })
  | (OneLiner & { type: 'one-liner'; author_name: string; author_avatar?: string; biography_slug?: string })
  | (Story & { type: 'story'; author_name: string; author_avatar?: string; biography_slug?: string })

/**
 * 重新排列故事，讓同作者的故事不會連續出現
 */
function interleaveByAuthor(items: FeaturedContent[]): FeaturedContent[] {
  if (items.length <= 1) return items

  const result: FeaturedContent[] = []
  const remaining = [...items]

  while (remaining.length > 0) {
    const lastAuthor = result.length > 0 ? result[result.length - 1].biography_id : null

    // 找一個不同作者的故事
    const differentAuthorIndex = remaining.findIndex(
      (item) => item.biography_id !== lastAuthor
    )

    if (differentAuthorIndex !== -1) {
      // 找到不同作者，加入結果
      result.push(remaining.splice(differentAuthorIndex, 1)[0])
    } else {
      // 沒有不同作者了，只能加入同作者的
      result.push(remaining.shift()!)
    }
  }

  return result
}

interface StoryCardProps {
  content: FeaturedContent
}

function StoryCard({ content }: StoryCardProps) {
  const displayName = content.author_name || '匿名'

  // 根據類型取得標題和內容
  const getDisplayContent = () => {
    switch (content.type) {
      case 'core-story':
        return {
          label: content.title || '核心故事',
          text: content.content,
        }
      case 'one-liner':
        return {
          label: content.question || '一句話',
          text: content.answer,
        }
      case 'story':
        return {
          label: content.title || content.category_name || '小故事',
          text: content.content,
        }
    }
  }

  const { label, text } = getDisplayContent()

  // 取得連結路徑 - 指向故事詳情頁
  const getLinkHref = () => {
    const typeMap: Record<string, string> = {
      'core-story': 'core-stories',
      'one-liner': 'one-liners',
      'story': 'stories',
    }
    return `/story/${typeMap[content.type]}/${content.id}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Link href={getLinkHref()} className="block h-full">
        <Card className="h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
          <CardContent className="flex h-full flex-col p-6">
            <div className="mb-4 flex-1 space-y-2">
              <p className="text-xs text-[#8E8C8C]">{label}</p>
              <div className="relative">
                <p className="line-clamp-4 text-base font-medium leading-relaxed text-[#1B1A1A]">
                  &ldquo;{text}&rdquo;
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {content.author_avatar ? (
                    isSvgUrl(content.author_avatar) ? (
                      <img
                        src={content.author_avatar}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={content.author_avatar}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    )
                  ) : (
                    <img
                      src={getDefaultAvatarUrl(displayName || 'anonymous', 40)}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-[#1B1A1A]">{displayName}</h3>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-[#8E8C8C]">
                    <span className="flex items-center gap-1">
                      <Mountain size={12} />
                      {content.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} />
                      {content.comment_count}
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRightCircle size={18} className="flex-shrink-0 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

interface StoryListProps {
  /** 搜尋關鍵字（未來可用於過濾） */
  searchTerm?: string
}

export function StoryList({ searchTerm }: StoryListProps) {
  const [contents, setContents] = useState<FeaturedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const loadStories = useCallback(async () => {
    if (hasFetched.current) return
    hasFetched.current = true

    try {
      // 並行獲取三種類型的熱門內容（較多數量用於列表頁）
      const [coreStoriesRes, oneLinersRes, storiesRes] = await Promise.all([
        biographyContentService.getPopularCoreStories(10),
        biographyContentService.getPopularOneLiners(10),
        biographyContentService.getPopularStories(10),
      ])

      const allContents: FeaturedContent[] = []

      if (coreStoriesRes.success && coreStoriesRes.data) {
        allContents.push(
          ...coreStoriesRes.data.map((item) => ({ ...item, type: 'core-story' as const }))
        )
      }

      if (oneLinersRes.success && oneLinersRes.data) {
        allContents.push(
          ...oneLinersRes.data.map((item) => ({ ...item, type: 'one-liner' as const }))
        )
      }

      if (storiesRes.success && storiesRes.data) {
        allContents.push(...storiesRes.data.map((item) => ({ ...item, type: 'story' as const })))
      }

      // 根據 like_count 排序，然後交錯排列讓同作者不連續
      allContents.sort((a, b) => b.like_count - a.like_count)
      const interleaved = interleaveByAuthor(allContents)
      setContents(interleaved)
    } catch (err) {
      console.error('Failed to load stories:', err)
      setError('載入故事時發生錯誤')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStories()
  }, [loadStories])

  // 根據搜尋詞過濾（如果有的話）
  const filteredContents = searchTerm
    ? contents.filter((content) => {
        const searchLower = searchTerm.toLowerCase()
        const authorName = content.author_name?.toLowerCase() || ''
        let contentText = ''
        if (content.type === 'one-liner') {
          contentText = content.answer?.toLowerCase() || ''
        } else {
          contentText = content.content?.toLowerCase() || ''
        }
        return authorName.includes(searchLower) || contentText.includes(searchLower)
      })
    : contents

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    )
  }

  if (filteredContents.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-lg text-[#6D6C6C]">
          {searchTerm ? '找不到符合的故事' : '目前沒有故事'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredContents.map((content) => (
        <StoryCard key={`${content.type}-${content.id}`} content={content} />
      ))}
    </div>
  )
}
