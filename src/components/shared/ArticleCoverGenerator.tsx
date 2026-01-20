'use client'

import { PostCategory, getCategoryLabel } from '@/lib/types'

/**
 * 每個分類的配色方案
 * - gradient: 漸層背景
 * - icon: 代表性圖標（使用 emoji 或 SVG）
 * - pattern: 背景圖案樣式
 */
const CATEGORY_THEMES: Record<
  PostCategory,
  {
    gradient: string
    icon: string
    pattern: 'dots' | 'lines' | 'grid' | 'waves' | 'triangles'
  }
> = {
  beginner: {
    gradient: 'from-emerald-400 to-teal-600',
    icon: '🌱',
    pattern: 'dots',
  },
  news: {
    gradient: 'from-blue-500 to-indigo-600',
    icon: '📰',
    pattern: 'grid',
  },
  gear: {
    gradient: 'from-orange-400 to-red-500',
    icon: '🎒',
    pattern: 'triangles',
  },
  skills: {
    gradient: 'from-purple-500 to-pink-500',
    icon: '💡',
    pattern: 'lines',
  },
  training: {
    gradient: 'from-red-500 to-orange-600',
    icon: '💪',
    pattern: 'waves',
  },
  routes: {
    gradient: 'from-cyan-500 to-blue-600',
    icon: '🗺️',
    pattern: 'lines',
  },
  crags: {
    gradient: 'from-stone-500 to-stone-700',
    icon: '🏔️',
    pattern: 'triangles',
  },
  gyms: {
    gradient: 'from-violet-500 to-purple-600',
    icon: '🧗',
    pattern: 'grid',
  },
  travel: {
    gradient: 'from-sky-400 to-cyan-500',
    icon: '✈️',
    pattern: 'waves',
  },
  competition: {
    gradient: 'from-amber-400 to-yellow-500',
    icon: '🏆',
    pattern: 'dots',
  },
  events: {
    gradient: 'from-pink-500 to-rose-500',
    icon: '🎉',
    pattern: 'dots',
  },
  community: {
    gradient: 'from-green-500 to-emerald-600',
    icon: '🤝',
    pattern: 'grid',
  },
  injury: {
    gradient: 'from-rose-500 to-red-600',
    icon: '🩹',
    pattern: 'waves',
  },
}

// 預設主題（當分類為空時使用）
const DEFAULT_THEME = {
  gradient: 'from-gray-500 to-gray-700',
  icon: '📝',
  pattern: 'dots' as const,
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
        {showIcon && <span className="mb-2 text-4xl drop-shadow-lg md:text-5xl">{theme.icon}</span>}

        {showTitle && title && (
          <h3 className="line-clamp-2 max-w-[80%] text-center text-lg font-bold drop-shadow-lg md:text-xl">
            {title}
          </h3>
        )}

        {categoryLabel && (
          <span className="mt-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm md:text-sm">
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
 * 背景圖案類型
 */
type PatternType = 'dots' | 'lines' | 'grid' | 'waves' | 'triangles'

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
