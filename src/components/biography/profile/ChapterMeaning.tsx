'use client'

import { motion } from 'framer-motion'
import { Biography } from '@/lib/types'

interface ChapterMeaningProps {
  person: Biography
}

/**
 * Chapter 2 - 意義篇
 * 攀岩對你來說是什麼 - 引言式設計
 */
export function ChapterMeaning({ person }: ChapterMeaningProps) {
  if (!person.climbing_meaning) return null

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
          <p className="px-8 text-xl italic leading-relaxed text-gray-800">
            {person.climbing_meaning}
          </p>
          <span className="absolute -bottom-8 -right-4 text-6xl bg-brand-accent/30">
            &rdquo;
          </span>
        </blockquote>

        {/* 簽名 */}
        <p className="mt-12 text-gray-600">— {person.name}</p>
      </div>
    </motion.section>
  )
}
