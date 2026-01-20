'use client'

import { PostCategory, getCategoryLabel } from '@/lib/types'
import {
  Sprout,
  Newspaper,
  Backpack,
  Lightbulb,
  Dumbbell,
  Map,
  Mountain,
  Building2,
  Plane,
  Trophy,
  PartyPopper,
  Users,
  HeartPulse,
  FileText,
  LucideIcon,
} from 'lucide-react'

/**
 * 背景圖案類型
 */
type PatternType = 'dots' | 'lines' | 'grid' | 'waves' | 'triangles'

/**
 * 每個分類的配色方案
 * 使用低飽和度、柔和的色調
 */
const CATEGORY_THEMES: Record<
  PostCategory,
  {
    gradient: string
    Icon: LucideIcon
    pattern: PatternType
  }
> = {
  beginner: {
    gradient: 'from-emerald-600/80 to-teal-700/90',
    Icon: Sprout,
    pattern: 'dots',
  },
  news: {
    gradient: 'from-slate-500/80 to-slate-700/90',
    Icon: Newspaper,
    pattern: 'grid',
  },
  gear: {
    gradient: 'from-amber-600/80 to-orange-700/90',
    Icon: Backpack,
    pattern: 'triangles',
  },
  skills: {
    gradient: 'from-violet-600/80 to-purple-800/90',
    Icon: Lightbulb,
    pattern: 'lines',
  },
  training: {
    gradient: 'from-rose-600/80 to-red-800/90',
    Icon: Dumbbell,
    pattern: 'waves',
  },
  routes: {
    gradient: 'from-cyan-600/80 to-blue-800/90',
    Icon: Map,
    pattern: 'lines',
  },
  crags: {
    gradient: 'from-stone-500/80 to-stone-700/90',
    Icon: Mountain,
    pattern: 'triangles',
  },
  gyms: {
    gradient: 'from-indigo-600/80 to-indigo-800/90',
    Icon: Building2,
    pattern: 'grid',
  },
  travel: {
    gradient: 'from-sky-600/80 to-blue-700/90',
    Icon: Plane,
    pattern: 'waves',
  },
  competition: {
    gradient: 'from-amber-500/80 to-yellow-700/90',
    Icon: Trophy,
    pattern: 'dots',
  },
  events: {
    gradient: 'from-pink-600/80 to-rose-800/90',
    Icon: PartyPopper,
    pattern: 'dots',
  },
  community: {
    gradient: 'from-teal-600/80 to-emerald-800/90',
    Icon: Users,
    pattern: 'grid',
  },
  injury: {
    gradient: 'from-red-600/80 to-rose-800/90',
    Icon: HeartPulse,
    pattern: 'waves',
  },
}

// 預設主題（當分類為空時使用）
const DEFAULT_THEME = {
  gradient: 'from-gray-600/80 to-gray-800/90',
  Icon: FileText,
  pattern: 'dots' as PatternType,
}

interface ArticleCoverGeneratorProps {
  category: PostCategory | string | null | undefined
  title?: string
  className?: string
  showIcon?: boolean
  showTitle?: boolean
  aspectRatio?: 'video' | 'square' | 'wide'
}

/**
 * 文章封面圖產生器
 * 根據文章分類自動產生設計化的封面
 */
export function ArticleCoverGenerator({
  category,
  title,
  className = '',
  showIcon = true,
  showTitle = true,
  aspectRatio = 'video',
}: ArticleCoverGeneratorProps) {
  const theme = getCategoryTheme(category)
  const categoryLabel = category ? getCategoryLabel(category as PostCategory) : ''
  const IconComponent = theme.Icon

  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]',
  }

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient} ${aspectClasses[aspectRatio]} ${className}`}
    >
      {/* 背景圖案 */}
      <PatternOverlay pattern={theme.pattern} />

      {/* 內容 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white">
        {showIcon && (
          <IconComponent className="mb-3 h-12 w-12 drop-shadow-lg md:h-16 md:w-16" strokeWidth={1.5} />
        )}

        {showTitle && title && (
          <h3 className="line-clamp-2 max-w-[80%] text-center text-lg font-bold drop-shadow-lg md:text-xl">
            {title}
          </h3>
        )}

        {categoryLabel && (
          <span className="mt-3 rounded-full bg-white/20 px-4 py-1.5 text-xs font-medium backdrop-blur-sm md:text-sm">
            {categoryLabel}
          </span>
        )}
      </div>

      {/* 品牌標識 */}
      <div className="absolute bottom-2 right-2 text-xs font-medium text-white/60 md:bottom-3 md:right-3 md:text-sm">
        NobodyClimb
      </div>
    </div>
  )
}

/**
 * 背景圖案組件
 */
function PatternOverlay({ pattern }: { pattern: PatternType }) {
  const patternStyles: Record<PatternType, React.ReactNode> = {
    dots: (
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
    ),
    lines: (
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
      />
    ),
    grid: (
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
    ),
    waves: (
      <svg className="absolute inset-0 h-full w-full opacity-10" preserveAspectRatio="none">
        <pattern id="waves" width="100" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M0 10 Q 25 0, 50 10 T 100 10"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#waves)" />
      </svg>
    ),
    triangles: (
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(135deg, white 25%, transparent 25%), linear-gradient(225deg, white 25%, transparent 25%)',
          backgroundSize: '40px 40px',
        }}
      />
    ),
  }

  return patternStyles[pattern]
}

/**
 * 取得分類的主題配色（用於其他組件）
 */
export function getCategoryTheme(category: PostCategory | string | null | undefined) {
  if (category && category in CATEGORY_THEMES) {
    return CATEGORY_THEMES[category as PostCategory]
  }
  return DEFAULT_THEME
}

/**
 * 取得分類的漸層 CSS 類別
 */
export function getCategoryGradient(category: PostCategory | string | null | undefined): string {
  const theme = getCategoryTheme(category)
  return `bg-gradient-to-br ${theme.gradient}`
}

export default ArticleCoverGenerator
