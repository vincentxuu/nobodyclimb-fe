'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { normalizeNewlines } from '@/lib/utils'

interface RelatedStory {
  id: string
  type: 'core-stories' | 'one-liners' | 'stories'
  title: string
  preview: string
  category?: string
  categoryEmoji?: string
}

interface RelatedStoriesProps {
  stories: RelatedStory[]
  authorName: string
  authorSlug?: string
}

const TYPE_LABEL_KEYS: Record<RelatedStory['type'], string> = {
  'core-stories': 'typeCoreStory',
  'one-liners': 'typeOneLiner',
  stories: 'typeStory',
}

export function RelatedStories({ stories, authorName }: RelatedStoriesProps) {
  const t = useTranslations('StoryDetail')

  if (stories.length === 0) {
    return null
  }

  return (
    <div className="mt-12">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#1B1A1A]">
          {t('relatedMoreStories', { name: authorName })}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stories.map((story, index) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Link href={`/story/${story.type}/${story.id}`}>
              <div className="group h-full rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                {/* 類型標籤 */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-medium text-[#8E8C8C]">
                    {t(TYPE_LABEL_KEYS[story.type])}
                  </span>
                  {story.category && (
                    <>
                      <span className="text-[#DCDADA]">•</span>
                      <span className="text-xs text-[#8E8C8C]">
                        {story.categoryEmoji && `${story.categoryEmoji} `}
                        {story.category}
                      </span>
                    </>
                  )}
                </div>

                {/* 標題 */}
                {story.title && (
                  <h3 className="mb-2 text-base font-semibold text-[#1B1A1A] line-clamp-1 group-hover:text-brand-yellow-100 transition-colors">
                    {story.title}
                  </h3>
                )}

                {/* 預覽內容 */}
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#6D6C6C] line-clamp-3">
                  {normalizeNewlines(story.preview)}
                </p>

                {/* 查看更多指示 */}
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-yellow-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>{t('relatedReadFull')}</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
