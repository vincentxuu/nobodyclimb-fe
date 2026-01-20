'use client'

import { PostCategory, getCategoryLabel } from '@/lib/types'
import {
  Sprout,
  Newspaper,
  Backpack,
  Lightbulb,
  Dumbbell,
  Map,
  Globe,
  Building2,
  Plane,
  Trophy,
  Calendar,
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
 * 漸層配色選項
 * 參考 docs/color-system.md
 */
const GRADIENTS = {
  /** 品牌黃色漸層 - 活力感 */
  yellow: 'from-amber-400 to-amber-600',
  /** 暖橘色漸層 - 溫暖感 */
  orange: 'from-orange-400 to-orange-600',
  /** 青綠色漸層 - 戶外/自然感 */
  teal: 'from-teal-500 to-teal-700',
  /** 石板藍漸層 - 專業/冷靜感 */
  slate: 'from-slate-500 to-slate-700',
  /** 玫瑰色漸層 - 溫馨感 */
  rose: 'from-rose-400 to-rose-600',
  /** 紫色漸層 - 神秘感 */
  violet: 'from-violet-500 to-violet-700',
} as const

/**
 * 每個分類的配色方案
 * 使用多彩漸層，各分類有獨特配色
 * Icon 選擇遵循 docs/icon-usage-guide.md
 *
 * 注意：Mountain icon 專用於「按讚功能」，不可用於其他用途
 */
const CATEGORY_THEMES: Record<
  PostCategory,
  {
    gradient: string
    Icon: LucideIcon
    pattern: PatternType
  }
> = {
  // 新手入門 - Sprout - 黃色，友善/活力感
  beginner: {
    gradient: GRADIENTS.yellow,
    Icon: Sprout,
    pattern: 'dots',
  },
  // 新聞動態 - Newspaper - 石板藍，資訊感
  news: {
    gradient: GRADIENTS.slate,
    Icon: Newspaper,
    pattern: 'grid',
  },
  // 裝備分享 - Backpack - 橘色，溫暖感
  gear: {
    gradient: GRADIENTS.orange,
    Icon: Backpack,
    pattern: 'triangles',
  },
  // 技巧分享 - Lightbulb - 黃色，創意感
  skills: {
    gradient: GRADIENTS.yellow,
    Icon: Lightbulb,
    pattern: 'lines',
  },
  // 訓練計畫 - Dumbbell - 青綠色，運動感
  training: {
    gradient: GRADIENTS.teal,
    Icon: Dumbbell,
    pattern: 'waves',
  },
  // 路線攻略 - Map - 青綠色，戶外感
  routes: {
    gradient: GRADIENTS.teal,
    Icon: Map,
    pattern: 'lines',
  },
  // 岩場開箱 - Globe - 青綠色，自然/探索感
  crags: {
    gradient: GRADIENTS.teal,
    Icon: Globe,
    pattern: 'triangles',
  },
  // 岩館開箱 - Building2 - 紫色，室內/現代感
  gyms: {
    gradient: GRADIENTS.violet,
    Icon: Building2,
    pattern: 'grid',
  },
  // 攀岩旅遊 - Plane - 橘色，冒險感
  travel: {
    gradient: GRADIENTS.orange,
    Icon: Plane,
    pattern: 'waves',
  },
  // 賽事介紹 - Trophy - 黃色，榮耀感
  competition: {
    gradient: GRADIENTS.yellow,
    Icon: Trophy,
    pattern: 'dots',
  },
  // 活動介紹 - Calendar - 紫色，活動感
  events: {
    gradient: GRADIENTS.violet,
    Icon: Calendar,
    pattern: 'dots',
  },
  // 社群資源 - Users - 玫瑰色，親和感
  community: {
    gradient: GRADIENTS.rose,
    Icon: Users,
    pattern: 'grid',
  },
  // 傷害防護 - HeartPulse - 玫瑰色，健康/關懷感
  injury: {
    gradient: GRADIENTS.rose,
    Icon: HeartPulse,
    pattern: 'waves',
  },
}

// 預設主題（當分類為空時使用）
const DEFAULT_THEME = {
  gradient: GRADIENTS.slate,
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
 * 使用品牌色系：深灰基底 + 黃色強調
 * 參考 docs/color-system.md
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
      {/* 背景圖案 - 使用 brand-yellow-100 */}
      <PatternOverlay pattern={theme.pattern} />

      {/* 內容區塊 - 響應式設計 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-white sm:p-4 md:p-6">
        {/* 圖標 - 響應式大小，白色帶陰影 */}
        {showIcon && (
          <div className="mb-2 rounded-full bg-white/20 p-2.5 backdrop-blur-sm sm:mb-3 sm:p-3 md:p-4">
            <IconComponent
              className="h-8 w-8 text-white drop-shadow-md sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14"
              strokeWidth={1.5}
            />
          </div>
        )}

        {/* 標題 - 響應式字體大小與行數 */}
        {showTitle && title && (
          <h3 className="line-clamp-2 max-w-[90%] text-center text-base font-bold text-white drop-shadow-md sm:max-w-[85%] sm:text-lg md:max-w-[80%] md:text-xl">
            {title}
          </h3>
        )}

        {/* 分類標籤 - 響應式大小，白色半透明背景 */}
        {categoryLabel && (
          <span className="mt-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-gray-800 sm:mt-3 sm:px-4 sm:py-1.5 sm:text-xs md:text-sm">
            {categoryLabel}
          </span>
        )}
      </div>

      {/* 品牌標識 - 響應式位置 */}
      <div className="absolute bottom-1.5 right-2 text-[10px] font-medium text-white/50 sm:bottom-2 sm:right-2 sm:text-xs md:bottom-3 md:right-3 md:text-sm">
        NobodyClimb
      </div>
    </div>
  )
}

/**
 * 背景圖案組件
 * 使用白色作為圖案顏色，在彩色漸層背景上提供良好對比
 */
function PatternOverlay({ pattern }: { pattern: PatternType }) {
  const patternColor = 'rgba(255, 255, 255, 0.9)'

  const patternStyles: Record<PatternType, React.ReactNode> = {
    dots: (
      <div
        className="absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage: `radial-gradient(circle, ${patternColor} 1.5px, transparent 1.5px)`,
          backgroundSize: '18px 18px',
        }}
      />
    ),
    lines: (
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${patternColor} 0, ${patternColor} 1px, transparent 0, transparent 50%)`,
          backgroundSize: '16px 16px',
        }}
      />
    ),
    grid: (
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `linear-gradient(${patternColor} 1px, transparent 1px), linear-gradient(90deg, ${patternColor} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
    ),
    waves: (
      <svg className="absolute inset-0 h-full w-full opacity-[0.15]" preserveAspectRatio="none">
        <pattern id="waves" width="60" height="12" patternUnits="userSpaceOnUse">
          <path
            d="M0 6 Q 15 0, 30 6 T 60 6"
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
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `linear-gradient(135deg, ${patternColor} 25%, transparent 25%), linear-gradient(225deg, ${patternColor} 25%, transparent 25%)`,
          backgroundSize: '32px 32px',
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
