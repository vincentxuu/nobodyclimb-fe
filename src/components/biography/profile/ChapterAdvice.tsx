'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Biography } from '@/lib/types'

interface ChapterAdviceProps {
  person: Biography
}

/**
 * Chapter 4 - 給新手的話
 * 信件/便條紙風格設計
 */
export function ChapterAdvice({ person }: ChapterAdviceProps) {
  // 使用人物誌的更新日期或發布日期（Hooks 必須在條件判斷之前）
  const displayDate = useMemo(() => {
    const dateStr = person.updated_at || person.published_at || person.created_at
    if (!dateStr) return null

    try {
      return new Date(dateStr).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch {
      return null
    }
  }, [person.updated_at, person.published_at, person.created_at])

  if (!person.advice_to_self) return null

  return (
    <motion.section
      className="my-16 bg-gradient-to-br from-blue-50 to-indigo-50 px-8 py-20"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="mx-auto max-w-2xl">
        {/* 章節標題 */}
        <div className="mb-8 text-center">
          <span className="mb-2 inline-block text-sm font-medium uppercase tracking-wider text-blue-500">
            Chapter 4
          </span>
          <h2 className="text-2xl font-semibold text-gray-900">
            給剛開始攀岩的自己
          </h2>
        </div>

        {/* 內容框 - 像是一張便條紙 */}
        <div className="relative rounded-2xl bg-white p-8 shadow-lg">
          {/* 頂部裝飾線 */}
          <div className="absolute -top-1 left-8 h-2 w-16 rounded-full bg-brand-accent" />

          <p className="whitespace-pre-wrap text-lg leading-relaxed text-gray-700">
            {person.advice_to_self}
          </p>

          {/* 簽名 */}
          <div className="mt-6 text-right text-gray-600">
            <p className="font-medium">— {person.name}</p>
            {displayDate && <p className="text-sm">{displayDate}</p>}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
