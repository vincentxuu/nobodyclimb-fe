'use client'

import { motion } from 'framer-motion'
import { Biography } from '@/lib/types'

interface ChapterMeetingProps {
  person: Biography
}

/**
 * Chapter 1 - 相遇篇
 * 你與攀岩的相遇故事
 */
export function ChapterMeeting({ person }: ChapterMeetingProps) {
  if (!person.climbing_origin) return null

  const paragraphs = person.climbing_origin.split('\n').filter(p => p.trim())

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      className="mx-auto max-w-5xl px-4 py-16"
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
      </div>
    </motion.section>
  )
}
