'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BiographyV2 } from '@/lib/types/biography-v2'

/** 預設的攀岩意義文字 */
const DEFAULT_CLIMBING_MEANING = '這題還在想，等我爬完這條再說'

interface ChapterMeaningProps {
  person: BiographyV2 | null
}

/**
 * Chapter 2 - 意義篇
 * 攀岩對你來說是什麼 - 引言式設計
 */
export function ChapterMeaning({ person }: ChapterMeaningProps) {
  // 從 one_liners 陣列中取得 climbing_meaning
  const climbingMeaning = useMemo(() => {
    if (!person?.one_liners) return null
    const item = person.one_liners.find(o => o.question_id === 'climbing_meaning')
    return item?.answer || null
  }, [person?.one_liners])

  // 預設內容
  const displayMeaning = climbingMeaning || DEFAULT_CLIMBING_MEANING
  const isDefault = !climbingMeaning

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
        <p className="mt-12 text-gray-600">— {person?.name}</p>
      </div>
    </motion.section>
  )
}
