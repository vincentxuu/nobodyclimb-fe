'use client'

import { getPersonalityType } from '@nobodyclimb/constants'
import type { PersonalityType } from '@nobodyclimb/types'
import { motion } from 'framer-motion'
import { Heart, Mountain, Swords } from 'lucide-react'
import { Link } from '@/i18n/navigation'

export function ResultCompat({ personality }: { personality: PersonalityType }) {
  const partner = getPersonalityType(personality.bestPartner)
  const rival = getPersonalityType(personality.worstMatch)

  if (!partner || !rival) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="mb-10"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">相性分析</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href={`/quiz/result/${partner.code.toLowerCase()}`}
          className="group rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 transition-colors hover:bg-emerald-50"
        >
          <div className="mb-3 flex items-center gap-2">
            <Heart className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">最佳拍檔</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${partner.color}15` }}
            >
              <Mountain className="h-6 w-6" style={{ color: partner.color }} />
            </div>
            <div>
              <div className="font-semibold text-gray-900 group-hover:underline">
                {partner.nameZh}
              </div>
              <div className="text-sm text-gray-500">{partner.nameEn}</div>
            </div>
          </div>
        </Link>

        <Link
          href={`/quiz/result/${rival.code.toLowerCase()}`}
          className="group rounded-2xl border border-orange-200 bg-orange-50/50 p-5 transition-colors hover:bg-orange-50"
        >
          <div className="mb-3 flex items-center gap-2">
            <Swords className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium text-orange-700">最大剋星</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${rival.color}15` }}
            >
              <Mountain className="h-6 w-6" style={{ color: rival.color }} />
            </div>
            <div>
              <div className="font-semibold text-gray-900 group-hover:underline">
                {rival.nameZh}
              </div>
              <div className="text-sm text-gray-500">{rival.nameEn}</div>
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  )
}
