'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRightCircle, Loader2, Heart, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { biographyContentService, CoreStory, OneLiner, Story } from '@/lib/api/services'
import { isSvgUrl, getDefaultAvatarUrl } from '@/lib/utils/image'

type FeaturedContent =
  | (CoreStory & { type: 'core-story'; author_name: string; author_avatar?: string })
  | (OneLiner & { type: 'one-liner'; author_name: string; author_avatar?: string })
  | (Story & { type: 'story'; author_name: string; author_avatar?: string })

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

  // 取得連結路徑
  const getLinkHref = () => {
    // 連結到對應的人物誌頁面
    return `/biography/profile/${content.biography_id}`
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
                    <Heart size={12} />
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

export function FeaturedStoriesSection() {
  const [contents, setContents] = useState<FeaturedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const loadFeaturedStories = useCallback(async () => {
    if (hasFetched.current) return
    hasFetched.current = true

    try {
      // 並行獲取三種類型的熱門內容
      const [coreStoriesRes, oneLinersRes, storiesRes] = await Promise.all([
        biographyContentService.getPopularCoreStories(2),
        biographyContentService.getPopularOneLiners(2),
        biographyContentService.getPopularStories(2),
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

      // 根據 like_count 排序並取前 3 個
      allContents.sort((a, b) => b.like_count - a.like_count)
      setContents(allContents.slice(0, 3))
    } catch (err) {
      console.error('Failed to load featured stories:', err)
      setError('載入精選故事時發生錯誤')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeaturedStories()
  }, [loadFeaturedStories])

  // 如果沒有內容，不顯示此區塊
  if (!loading && contents.length === 0) {
    return null
  }

  return (
    <section className="bg-[#F5F4F4] py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-[40px]">精選故事</h2>
          <p className="mt-4 text-base text-[#6D6C6C]">來自社群的真實攀岩故事與感悟</p>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
          </div>
        ) : error ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-lg text-red-600">{error}</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {contents.map((content) => (
              <StoryCard key={`${content.type}-${content.id}`} content={content} />
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link href="/biography">
            <Button
              variant="outline"
              className="h-11 border border-[#1B1A1A] px-8 text-base text-[#1B1A1A] hover:bg-[#DBD8D8]"
            >
              探索更多故事
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
