'use client'

import { motion } from 'framer-motion'
import { Compass, Mountain, Target } from 'lucide-react'
import type { StyleSpectrumData } from '@/lib/api/evolution'

interface StyleSpectrumCardProps {
  data: StyleSpectrumData | undefined
  isLoading: boolean
}

export default function StyleSpectrumCard({ data, isLoading }: StyleSpectrumCardProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse rounded-lg bg-white p-6">
        <div className="mb-4 h-6 w-32 rounded bg-gray-200" />
        <div className="mb-3 h-8 w-48 rounded bg-gray-200" />
        <div className="mb-4 h-4 w-full rounded bg-gray-200" />
        <div className="h-20 w-full rounded bg-gray-200" />
      </div>
    )
  }

  if (!data || data.spectrum === null || !data.position) {
    return (
      <div className="rounded-lg bg-white p-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[#1B1A1A]">
          <Compass className="h-5 w-5 text-emerald-600" />
          攀岩光譜
        </h2>
        <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
          <Compass className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">尚未有足夠數據</p>
          <p className="mt-1 text-xs text-gray-300">需要攀登紀錄才能計算你的攀岩光譜</p>
        </div>
      </div>
    )
  }

  const { spectrum, position, onsight_max_grade, redpoint_max_grade } = data
  // spectrum ranges from -100 (pure onsight) to +100 (pure redpoint)
  // Map to percentage: -100 -> 0%, 0 -> 50%, +100 -> 100%
  const markerPercent = ((spectrum! + 100) / 200) * 100

  return (
    <motion.div
      className="rounded-lg bg-white p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#1B1A1A]">
        <Compass className="h-5 w-5 text-emerald-600" />
        攀岩光譜
      </h2>

      {/* Position Name */}
      <div className="mb-4">
        <span className="text-2xl font-bold text-[#1B1A1A]">{position.nameZh}</span>
        <span className="ml-2 text-sm text-gray-400">{position.name}</span>
      </div>

      {/* Spectrum Bar */}
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-gray-400">
          <span>深耕型 (Redpoint)</span>
          <span>即興型 (Onsight)</span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-gradient-to-r from-indigo-400 via-emerald-400 to-amber-400">
          {/* Marker */}
          <motion.div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ left: '50%' }}
            animate={{ left: `${markerPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="h-5 w-5 rounded-full border-2 border-white bg-[#1B1A1A] shadow-md" />
          </motion.div>
        </div>
      </div>

      {/* Description */}
      <p className="mb-4 text-sm leading-relaxed text-gray-600">{position.description}</p>

      {/* Growth Direction */}
      <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3">
        <p className="text-sm text-emerald-700">
          <span className="font-medium">成長方向：</span>
          {position.growthDirection}
        </p>
      </div>

      {/* Grade Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
            <Target className="h-3.5 w-3.5" />
            Onsight 最高
          </div>
          <p className="text-lg font-semibold text-[#1B1A1A]">{onsight_max_grade || '--'}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
            <Mountain className="h-3.5 w-3.5" />
            Redpoint 最高
          </div>
          <p className="text-lg font-semibold text-[#1B1A1A]">{redpoint_max_grade || '--'}</p>
        </div>
      </div>
    </motion.div>
  )
}
