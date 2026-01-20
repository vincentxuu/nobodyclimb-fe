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
 * 品牌色彩常數
 * 參考 docs/color-system.md
 *
 * 注意：inline style 無法使用 Tailwind class，
 * 因此在此定義常數供 PatternOverlay 使用
 */
const COLORS = {
  /** Yellow 100 - 品牌強調色 (brand-yellow-100) */
  BRAND_YELLOW_100: '#FFE70C',
  /** W&B 90 - 深灰 hover (brand-dark-hover) */
  WB_90: '#3F3D3D',
  /** W&B 100 - 近黑 (brand-dark) */
  WB_100: '#1B1A1A',
} as const

/**
 * 統一漸層配色 - 使用品牌色
 * from: brand-dark-hover (wb-90 / #3F3D3D)
 * to: brand-dark (wb-100 / #1B1A1A)
 * 參考 docs/color-system.md
 */
const BRAND_GRADIENT = 'from-brand-dark-hover to-brand-dark'

/**
 * 每個分類的配色方案
 * 使用品牌色系：深灰基底 + 黃色強調
 * 各分類透過「圖案」區分，配色統一使用品牌色
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
    gradient: BRAND_GRADIENT,
    Icon: Sprout,
    pattern: 'dots',
  },
  // 新聞動態 - Newspaper
  news: {
    gradient: BRAND_GRADIENT,
    Icon: Newspaper,
    pattern: 'grid',
  },
  // 裝備分享 - Backpack
  gear: {
    gradient: BRAND_GRADIENT,
    Icon: Backpack,
    pattern: 'triangles',
  },
  // 技巧分享 - Lightbulb
  skills: {
    gradient: BRAND_GRADIENT,
    Icon: Lightbulb,
    pattern: 'lines',
  },
  // 訓練計畫 - Dumbbell（運動/訓練相關）
  training: {
    gradient: BRAND_GRADIENT,
    Icon: Dumbbell,
    pattern: 'waves',
  },
  // 路線攻略 - Map
  routes: {
    gradient: BRAND_GRADIENT,
    Icon: Map,
    pattern: 'lines',
  },
  // 岩場開箱 - Globe（Mountain 專用於按讚，改用 Globe 表示地點/探索）
  crags: {
    gradient: BRAND_GRADIENT,
    Icon: Globe,
    pattern: 'triangles',
  },
  // 岩館開箱 - Building2
  gyms: {
    gradient: BRAND_GRADIENT,
    Icon: Building2,
    pattern: 'grid',
  },
  // 攀岩旅遊 - Plane（國際旅行徽章）
  travel: {
    gradient: BRAND_GRADIENT,
    Icon: Plane,
    pattern: 'waves',
  },
  // 賽事介紹 - Trophy（成就獎盃）
  competition: {
    gradient: BRAND_GRADIENT,
    Icon: Trophy,
    pattern: 'dots',
  },
  // 活動介紹 - Calendar（日期資訊）
  events: {
    gradient: BRAND_GRADIENT,
    Icon: Calendar,
    pattern: 'dots',
  },
  // 社群資源 - Users（社群功能）
  community: {
    gradient: BRAND_GRADIENT,
    Icon: Users,
    pattern: 'grid',
  },
  // 傷害防護 - HeartPulse
  injury: {
    gradient: BRAND_GRADIENT,
    Icon: HeartPulse,
    pattern: 'waves',
  },
}

// 預設主題（當分類為空時使用）
const DEFAULT_THEME = {
  gradient: BRAND_GRADIENT,
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
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-wb-0 sm:p-4 md:p-6">
        {/* 圖標 - 響應式大小 */}
        {showIcon && (
          <div className="mb-2 rounded-full bg-brand-accent/10 p-2.5 sm:mb-3 sm:p-3 md:p-4">
            <IconComponent
              className="h-8 w-8 text-brand-accent drop-shadow-lg sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14"
              strokeWidth={1.5}
            />
          </div>
        )}

        {/* 標題 - 響應式字體大小與行數 */}
        {showTitle && title && (
          <h3 className="line-clamp-2 max-w-[90%] text-center text-base font-bold drop-shadow-lg sm:max-w-[85%] sm:text-lg md:max-w-[80%] md:text-xl">
            {title}
          </h3>
        )}

        {/* 分類標籤 - 響應式大小 */}
        {categoryLabel && (
          <span className="mt-2 rounded-full bg-brand-accent px-3 py-1 text-[10px] font-medium text-brand-dark sm:mt-3 sm:px-4 sm:py-1.5 sm:text-xs md:text-sm">
            {categoryLabel}
          </span>
        )}
      </div>

      {/* 品牌標識 - 響應式位置 */}
      <div className="absolute bottom-1.5 right-2 text-[10px] font-medium text-wb-0/40 sm:bottom-2 sm:right-2 sm:text-xs md:bottom-3 md:right-3 md:text-sm">
        NobodyClimb
      </div>
    </div>
  )
}

/**
 * 背景圖案組件
 * 使用 brand-yellow-100 (#FFE70C) 作為圖案顏色
 * 參考 docs/color-system.md
 */
function PatternOverlay({ pattern }: { pattern: PatternType }) {
  const { BRAND_YELLOW_100 } = COLORS

  const patternStyles: Record<PatternType, React.ReactNode> = {
    dots: (
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(circle, ${BRAND_YELLOW_100} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />
    ),
    lines: (
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${BRAND_YELLOW_100} 0, ${BRAND_YELLOW_100} 1px, transparent 0, transparent 50%)`,
          backgroundSize: '20px 20px',
        }}
      />
    ),
    grid: (
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `linear-gradient(${BRAND_YELLOW_100} 1px, transparent 1px), linear-gradient(90deg, ${BRAND_YELLOW_100} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />
    ),
    waves: (
      <svg className="absolute inset-0 h-full w-full opacity-[0.08]" preserveAspectRatio="none">
        <pattern id="waves" width="80" height="16" patternUnits="userSpaceOnUse">
          <path
            d="M0 8 Q 20 0, 40 8 T 80 8"
            fill="none"
            stroke={BRAND_YELLOW_100}
            strokeWidth="1.5"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#waves)" />
      </svg>
    ),
    triangles: (
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `linear-gradient(135deg, ${BRAND_YELLOW_100} 25%, transparent 25%), linear-gradient(225deg, ${BRAND_YELLOW_100} 25%, transparent 25%)`,
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
