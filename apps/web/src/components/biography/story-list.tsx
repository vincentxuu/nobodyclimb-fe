'use client'

import { motion } from 'framer-motion'
import { ArrowRightCircle, Loader2, MessageCircle, Mountain } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { biographyContentService, CoreStory, OneLiner, Story } from '@/lib/api/services'
import { useBiographyQuestionText } from '@/lib/hooks/useBiographyQuestions'
import { normalizeNewlines } from '@/lib/utils'
import { getDefaultAvatarUrl, isSvgUrl } from '@/lib/utils/image'

type FeaturedContent =
  | (CoreStory & {
      type: 'core-story'
      author_name: string
      author_avatar?: string
      biography_slug?: string
    })
  | (OneLiner & {
      type: 'one-liner'
      author_name: string
      author_avatar?: string
      biography_slug?: string
    })
  | (Story & {
      type: 'story'
      author_name: string
      author_avatar?: string
      biography_slug?: string
    })

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
    const differentAuthorIndex = remaining.findIndex((item) => item.biography_id !== lastAuthor)

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
  const t = useTranslations('BiographyPage')
  const { getOneLinerText, getStoryTitle, getCategoryName } = useBiographyQuestionText()
  const displayName = content.author_name || t('anonymousUser')

  // 根據類型取得標題和內容
  const getDisplayContent = () => {
    switch (content.type) {
      case 'core-story':
        return {
          label: getOneLinerText(content.question_id, content.title || ''),
          text: content.content,
        }
      case 'one-liner':
        return {
          label: getOneLinerText(content.question_id, content.question || ''),
          text: content.answer,
        }
      case 'story':
        return {
          label: getStoryTitle(
            content.question_id,
            content.title || getCategoryName(content.category_id, content.category_name || '')
          ),
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
      story: 'stories',
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
                <p className="line-clamp-4 whitespace-pre-line text-base font-medium leading-relaxed text-[#1B1A1A]">
                  &ldquo;{normalizeNewlines(text)}&rdquo;
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
  const t = useTranslations('BiographyPage')
  const INITIAL_VISIBLE_COUNT = 12
  const LOAD_MORE_COUNT = 12

  const [contents, setContents] = useState<FeaturedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)
  const hasFetched = useRef(false)

  const loadStories = useCallback(async () => {
    if (hasFetched.current) return
    hasFetched.current = true

    try {
      // 並行獲取三種類型的熱門內容（較多數量用於列表頁）
      const [coreStoriesRes, oneLinersRes, storiesRes] = await Promise.all([
        biographyContentService.getPopularCoreStories(50),
        biographyContentService.getPopularOneLiners(50),
        biographyContentService.getPopularStories(50),
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
      setError(t('storyLoadError'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStories()
  }, [loadStories])

  useEffect(() => {
    if (!searchTerm) {
      setVisibleCount(INITIAL_VISIBLE_COUNT)
    }
  }, [searchTerm])

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

  const displayedContents = searchTerm ? filteredContents : filteredContents.slice(0, visibleCount)
  const hasMore = !searchTerm && visibleCount < filteredContents.length

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
          {searchTerm ? t('noMatchingStories') : t('noStories')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayedContents.map((content) => (
          <StoryCard key={`${content.type}-${content.id}`} content={content} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="min-w-[160px]"
            onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_COUNT)}
          >
            {t('loadMoreStories')}
          </Button>
        </div>
      )}
    </div>
  )
}
