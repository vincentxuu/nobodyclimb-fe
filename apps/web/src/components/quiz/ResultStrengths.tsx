'use client'

import type { PersonalityType } from '@nobodyclimb/types'
import { motion } from 'framer-motion'
import { AlertTriangle, Sparkles } from 'lucide-react'

export function ResultStrengths({ personality }: { personality: PersonalityType }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mb-10"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Sparkles className="h-5 w-5 text-amber-500" />
            優勢
          </h2>
          <ul className="space-y-2">
            {personality.strengths.map((s, i) => (
              <li key={i} className="rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            盲點
          </h2>
          <ul className="space-y-2">
            {personality.blindSpots.map((b, i) => (
              <li key={i} className="rounded-lg bg-orange-50 px-4 py-2.5 text-sm text-orange-800">
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}
