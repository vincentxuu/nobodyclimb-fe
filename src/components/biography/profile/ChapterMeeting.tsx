'use client'

import Image from 'next/image'
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

  const imageUrl = person.cover_image
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

      {/* 內容區 - 使用 Grid 佈局 */}
      <div className="grid gap-8 md:grid-cols-12">
        {/* 圖片 - 占 5 欄 - 只在有圖片時顯示 */}
        {imageUrl && (
          <motion.div
            className="md:col-span-5"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="sticky top-24 overflow-hidden rounded-lg shadow-lg">
              <div className="relative aspect-[4/5]">
                <Image
                  src={imageUrl}
                  alt={`${person.name} 的攀岩相遇`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* 文字 - 有圖片時占 7 欄，沒圖片時占全部 */}
        <div className={imageUrl ? 'md:col-span-7' : 'md:col-span-12'}>
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
      </div>
    </motion.section>
  )
}
