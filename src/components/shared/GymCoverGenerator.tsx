'use client'

import { Building2, Mountain, ArrowUpFromLine, LucideIcon } from 'lucide-react'

/**
 * 背景圖案類型
 */
type PatternType = 'dots' | 'lines' | 'grid' | 'waves' | 'triangles'

/**
 * 岩館類型
 */
type GymType = 'bouldering' | 'lead' | 'mixed'

/**
 * 漸層配色選項
 */
const GRADIENTS = {
  /** 橘色漸層 - 抱石的活力感 */
  orange: 'from-orange-400 to-orange-600',
  /** 青綠色漸層 - 上攀的專業感 */
  teal: 'from-teal-500 to-teal-700',
  /** 紫色漸層 - 混合類型的多元感 */
  violet: 'from-violet-500 to-violet-700',
  /** 石板藍漸層 - 預設 */
  slate: 'from-slate-500 to-slate-700',
} as const

/**
 * 每種岩館類型的配色方案
 */
const GYM_TYPE_THEMES: Record<
  GymType,
  {
    gradient: string
    Icon: LucideIcon
    pattern: PatternType
  }
> = {
  // 抱石 - 橘色，活力/溫暖感，使用 Mountain 代表抱石岩牆
  bouldering: {
    gradient: GRADIENTS.orange,
    Icon: Mountain,
    pattern: 'triangles',
  },
  // 上攀 - 青綠色，專業/挑戰感，使用向上箭頭代表上攀
  lead: {
    gradient: GRADIENTS.teal,
    Icon: ArrowUpFromLine,
    pattern: 'lines',
  },
  // 上攀和抱石 - 紫色，多元/綜合感，使用 Building2 代表綜合岩館
  mixed: {
    gradient: GRADIENTS.violet,
    Icon: Building2,
    pattern: 'grid',
  },
}

// 預設主題（當類型為空時使用）
const DEFAULT_THEME = {
  gradient: GRADIENTS.slate,
  Icon: Building2,
  pattern: 'dots' as PatternType,
}

interface GymCoverGeneratorProps {
  type?: GymType | string | null
  name: string
  className?: string
  showIcon?: boolean
  showName?: boolean
  showTypeLabel?: boolean
  typeLabel?: string
  aspectRatio?: 'video' | 'square' | 'wide' | 'card'
}

/**
 * 岩館封面圖產生器
 * 根據岩館類型自動產生設計化的封面
 */
export function GymCoverGenerator({
  type,
  name,
  className = '',
  showIcon = true,
  showName = true,
  showTypeLabel = true,
  typeLabel,
  aspectRatio = 'video',
}: GymCoverGeneratorProps) {
  const theme = getGymTypeTheme(type)
  const IconComponent = theme.Icon

  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]',
    card: 'h-48', // 固定高度，適用於卡片
  }

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient} ${aspectClasses[aspectRatio]} ${className}`}
    >
      {/* 背景圖案 */}
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

        {/* 岩館名稱 - 響應式字體大小與行數 */}
        {showName && name && (
          <h3 className="line-clamp-2 max-w-[90%] text-center text-base font-bold text-white drop-shadow-md sm:max-w-[85%] sm:text-lg md:max-w-[80%] md:text-xl">
            {name}
          </h3>
        )}

        {/* 類型標籤 - 響應式大小，白色半透明背景 */}
        {showTypeLabel && typeLabel && (
          <span className="mt-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-gray-800 sm:mt-3 sm:px-4 sm:py-1.5 sm:text-xs md:text-sm">
            {typeLabel}
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
        <pattern id="gym-waves" width="60" height="12" patternUnits="userSpaceOnUse">
          <path
            d="M0 6 Q 15 0, 30 6 T 60 6"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#gym-waves)" />
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
 * 取得岩館類型的主題配色（用於其他組件）
 */
export function getGymTypeTheme(type: GymType | string | null | undefined) {
  if (type && type in GYM_TYPE_THEMES) {
    return GYM_TYPE_THEMES[type as GymType]
  }
  return DEFAULT_THEME
}

/**
 * 取得岩館類型的漸層 CSS 類別
 */
export function getGymTypeGradient(type: GymType | string | null | undefined): string {
  const theme = getGymTypeTheme(type)
  return `bg-gradient-to-br ${theme.gradient}`
}

export default GymCoverGenerator
