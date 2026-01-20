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
 * 每個分類的配色方案
 * 使用品牌色系：深灰/石墨色基底 + 黃色強調
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
  // 新手入門 - Sprout（新手徽章）
  beginner: {
    gradient: 'from-[#2d2c2c] to-[#1B1A1A]',
    Icon: Sprout,
    pattern: 'dots',
  },
  // 新聞動態 - Newspaper
  news: {
    gradient: 'from-[#3a3939] to-[#1B1A1A]',
    Icon: Newspaper,
    pattern: 'grid',
  },
  // 裝備分享 - Backpack
  gear: {
    gradient: 'from-[#33312f] to-[#1B1A1A]',
    Icon: Backpack,
    pattern: 'triangles',
  },
  // 技巧分享 - Lightbulb
  skills: {
    gradient: 'from-[#2f2d33] to-[#1B1A1A]',
    Icon: Lightbulb,
    pattern: 'lines',
  },
  // 訓練計畫 - Dumbbell（運動/訓練相關）
  training: {
    gradient: 'from-[#352d2d] to-[#1B1A1A]',
    Icon: Dumbbell,
    pattern: 'waves',
  },
  // 路線攻略 - Map
  routes: {
    gradient: 'from-[#2d3133] to-[#1B1A1A]',
    Icon: Map,
    pattern: 'lines',
  },
  // 岩場開箱 - Globe（Mountain 專用於按讚，改用 Globe 表示地點/探索）
  crags: {
    gradient: 'from-[#3F3D3D] to-[#1B1A1A]',
    Icon: Globe,
    pattern: 'triangles',
  },
  // 岩館開箱 - Building2
  gyms: {
    gradient: 'from-[#2d2d35] to-[#1B1A1A]',
    Icon: Building2,
    pattern: 'grid',
  },
  // 攀岩旅遊 - Plane（國際旅行徽章）
  travel: {
    gradient: 'from-[#2d3235] to-[#1B1A1A]',
    Icon: Plane,
    pattern: 'waves',
  },
  // 賽事介紹 - Trophy（成就獎盃）
  competition: {
    gradient: 'from-[#35332d] to-[#1B1A1A]',
    Icon: Trophy,
    pattern: 'dots',
  },
  // 活動介紹 - Calendar（日期資訊）
  events: {
    gradient: 'from-[#332d31] to-[#1B1A1A]',
    Icon: Calendar,
    pattern: 'dots',
  },
  // 社群資源 - Users（社群功能）
  community: {
    gradient: 'from-[#2d3331] to-[#1B1A1A]',
    Icon: Users,
    pattern: 'grid',
  },
  // 傷害防護 - HeartPulse
  injury: {
    gradient: 'from-[#352d2d] to-[#1B1A1A]',
    Icon: HeartPulse,
    pattern: 'waves',
  },
}

// 預設主題（當分類為空時使用）
const DEFAULT_THEME = {
  gradient: 'from-[#3F3D3D] to-[#1B1A1A]',
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
      {/* 背景圖案 - 使用品牌黃色 */}
      <PatternOverlay pattern={theme.pattern} />

      {/* 內容 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white">
        {showIcon && (
          <div className="mb-3 rounded-full bg-brand-accent/10 p-4">
            <IconComponent
              className="h-10 w-10 text-brand-accent drop-shadow-lg md:h-14 md:w-14"
              strokeWidth={1.5}
            />
          </div>
        )}

        {showTitle && title && (
          <h3 className="line-clamp-2 max-w-[80%] text-center text-lg font-bold drop-shadow-lg md:text-xl">
            {title}
          </h3>
        )}

        {categoryLabel && (
          <span className="mt-3 rounded-full bg-brand-accent px-4 py-1.5 text-xs font-medium text-brand-dark md:text-sm">
            {categoryLabel}
          </span>
        )}
      </div>

      {/* 品牌標識 */}
      <div className="absolute bottom-2 right-2 text-xs font-medium text-white/40 md:bottom-3 md:right-3 md:text-sm">
        NobodyClimb
      </div>
    </div>
  )
}

/**
 * 背景圖案組件
 * 使用品牌黃色 (#FFE70C) 作為圖案顏色
 */
function PatternOverlay({ pattern }: { pattern: PatternType }) {
  const patternStyles: Record<PatternType, React.ReactNode> = {
    dots: (
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: 'radial-gradient(circle, #FFE70C 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
    ),
    lines: (
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #FFE70C 0, #FFE70C 1px, transparent 0, transparent 50%)',
          backgroundSize: '24px 24px',
        }}
      />
    ),
    grid: (
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(#FFE70C 1px, transparent 1px), linear-gradient(90deg, #FFE70C 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    ),
    waves: (
      <svg className="absolute inset-0 h-full w-full opacity-[0.08]" preserveAspectRatio="none">
        <pattern id="waves" width="100" height="20" patternUnits="userSpaceOnUse">
          <path d="M0 10 Q 25 0, 50 10 T 100 10" fill="none" stroke="#FFE70C" strokeWidth="1.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#waves)" />
      </svg>
    ),
    triangles: (
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(135deg, #FFE70C 25%, transparent 25%), linear-gradient(225deg, #FFE70C 25%, transparent 25%)',
          backgroundSize: '48px 48px',
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
