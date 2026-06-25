'use client'

import type { PersonalityType } from '@nobodyclimb/types'
import { motion } from 'framer-motion'
import { Mountain } from 'lucide-react'

export function ResultHero({ personality }: { personality: PersonalityType }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-10 text-center"
    >
      <div
        className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl md:h-36 md:w-36"
        style={{ backgroundColor: `${personality.color}15` }}
      >
        <Mountain className="h-14 w-14 md:h-20 md:w-20" style={{ color: personality.color }} />
      </div>

      <div
        className="mb-2 text-sm font-semibold uppercase tracking-widest"
        style={{ color: personality.color }}
      >
        {personality.code}
      </div>

      <h1 className="mb-1 text-3xl font-bold text-gray-900 md:text-4xl">{personality.nameZh}</h1>
      <p className="mb-4 text-lg text-gray-500">{personality.nameEn}</p>

      <p className="text-lg italic text-gray-600" style={{ color: personality.color }}>
        「{personality.tagline}」
      </p>
    </motion.div>
  )
}
