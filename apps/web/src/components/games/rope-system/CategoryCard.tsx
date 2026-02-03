'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Star,
  Target,
  PersonStanding,
  Link as LinkIcon,
  ArrowDown,
  Anchor,
  Wrench,
  Mountain,
  LifeBuoy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category, CategoryProgress, CategoryIconName } from '@/lib/games/rope-system/types'
import {
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  ROUTES,
} from '@/lib/games/rope-system/constants'

/** 類別圖示對應 */
const CategoryIcons: Record<CategoryIconName, React.ComponentType<{ className?: string }>> = {
  Target,
  PersonStanding,
  Link: LinkIcon,
  ArrowDown,
  Anchor,
  Wrench,
  Mountain,
  LifeBuoy,
  Dumbbell: Target, // fallback
  MountainSnow: Mountain, // fallback
}

interface CategoryCardProps {
  category: Category
  progress?: CategoryProgress
  className?: string
}

export function CategoryCard({
  category,
  progress,
  className,
}: CategoryCardProps) {
  const difficultyColor = DIFFICULTY_COLORS[category.difficulty]
  const difficultyLabel = DIFFICULTY_LABELS[category.difficulty]

  // 計算進度百分比
  const progressPercent = progress
    ? Math.round((progress.completedCount / progress.totalCount) * 100)
    : 0

  return (
    <Link href={ROUTES.LEARN(category.id)}>
      <motion.div
        className={cn(
          'group cursor-pointer rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm transition-shadow',
          'hover:shadow-md',
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* 圖示與標題 */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {(() => {
              const IconComponent = CategoryIcons[category.icon]
              return <IconComponent className="h-6 w-6 text-[#1B1A1A]" />
            })()}
            <div>
              <h3 className="font-medium text-[#1B1A1A]">{category.name}</h3>
              <p className="text-sm text-[#535353]">{category.description}</p>
            </div>
          </div>
        </div>

        {/* 難度 */}
        <div
          className="mb-3 inline-flex items-center gap-1 rounded-full px-2 py-1"
          style={{ backgroundColor: difficultyColor.bg }}
        >
          {Array.from({ length: category.difficulty }).map((_, i) => (
            <Star
              key={i}
              className="h-3 w-3"
              style={{ fill: difficultyColor.star, color: difficultyColor.star }}
            />
          ))}
          <span
            className="ml-1 text-xs font-medium"
            style={{ color: difficultyColor.star }}
          >
            {difficultyLabel}
          </span>
        </div>

        {/* 題數 */}
        <div className="mb-3 text-sm text-[#535353]">
          {category.questionCount} 題
        </div>

        {/* 進度條 */}
        <div className="relative h-2 overflow-hidden rounded-full bg-[#E5E5E5]">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full bg-[#FFE70C]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="mt-1 text-right text-xs text-[#535353]">
          {progressPercent}%
        </div>
      </motion.div>
    </Link>
  )
}
