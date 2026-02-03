'use client'

/**
 * 背景圖案類型
 */
type PatternType = 'dots' | 'lines' | 'grid' | 'waves' | 'triangles' | 'rocks'

/**
 * 岩石類型
 */
type RockType = 'sandstone' | 'limestone' | 'coral' | 'granite' | 'default'

/**
 * 漸層配色選項 - 大自然岩石色調
 */
const GRADIENTS = {
  /** 砂岩 - 溫暖的橙棕色調 */
  sandstone: 'from-amber-300 to-orange-400',
  /** 石灰岩 - 灰白色調 */
  limestone: 'from-stone-300 to-stone-500',
  /** 珊瑚礁石灰岩 - 海洋藍綠色調 */
  coral: 'from-teal-300 to-cyan-500',
  /** 花崗岩 - 深灰色調 */
  granite: 'from-slate-400 to-slate-600',
  /** 預設 - 自然綠色調 */
  default: 'from-emerald-300 to-emerald-500',
} as const

/**
 * 每種岩石類型的配色方案
 */
const ROCK_TYPE_THEMES: Record<
  RockType,
  {
    gradient: string
    pattern: PatternType
  }
> = {
  sandstone: {
    gradient: GRADIENTS.sandstone,
    pattern: 'triangles',
  },
  limestone: {
    gradient: GRADIENTS.limestone,
    pattern: 'rocks',
  },
  coral: {
    gradient: GRADIENTS.coral,
    pattern: 'waves',
  },
  granite: {
    gradient: GRADIENTS.granite,
    pattern: 'dots',
  },
  default: {
    gradient: GRADIENTS.default,
    pattern: 'lines',
  },
}

/**
 * 將中文岩石類型轉換為英文 key
 */
function parseRockType(rockType: string | null | undefined): RockType {
  if (!rockType) return 'default'
  const lower = rockType.toLowerCase()
  if (lower.includes('珊瑚') || lower.includes('coral')) return 'coral'
  if (lower.includes('石灰') || lower.includes('limestone')) return 'limestone'
  if (lower.includes('花崗') || lower.includes('granite')) return 'granite'
  if (lower.includes('砂') || lower.includes('sand')) return 'sandstone'
  return 'default'
}

interface CragCoverGeneratorProps {
  rockType?: string | null
  name: string
  className?: string
  showName?: boolean
  showTypeLabel?: boolean
  typeLabel?: string
  aspectRatio?: 'video' | 'square' | 'wide' | 'card'
}

/**
 * 岩場封面圖產生器
 * 根據岩石類型自動產生設計化的封面
 */
export function CragCoverGenerator({
  rockType,
  name,
  className = '',
  showName = true,
  showTypeLabel = true,
  typeLabel,
  aspectRatio = 'video',
}: CragCoverGeneratorProps) {
  const parsedType = parseRockType(rockType)
  const theme = ROCK_TYPE_THEMES[parsedType]

  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]',
    card: 'aspect-[16/10]',
  }

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient} ${aspectClasses[aspectRatio]} ${className}`}
    >
      {/* 背景圖案 */}
      <PatternOverlay pattern={theme.pattern} />

      {/* 內容區塊 - 響應式設計 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-white sm:p-4 md:p-6">
        {/* 岩場名稱 - 響應式字體大小與行數 */}
        {showName && name && (
          <h3 className="line-clamp-2 max-w-[90%] text-center text-lg font-bold text-white drop-shadow-md sm:max-w-[85%] sm:text-xl md:max-w-[80%] md:text-2xl">
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
        <pattern id="crag-waves" width="60" height="12" patternUnits="userSpaceOnUse">
          <path
            d="M0 6 Q 15 0, 30 6 T 60 6"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#crag-waves)" />
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
    rocks: (
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(ellipse 20px 15px at 20px 20px, ${patternColor} 40%, transparent 50%), radial-gradient(ellipse 15px 20px at 50px 35px, ${patternColor} 40%, transparent 50%)`,
          backgroundSize: '70px 55px',
        }}
      />
    ),
  }

  return patternStyles[pattern]
}

/**
 * 取得岩石類型的主題配色（用於其他組件）
 */
export function getCragTypeTheme(rockType: string | null | undefined) {
  const parsedType = parseRockType(rockType)
  return ROCK_TYPE_THEMES[parsedType]
}

/**
 * 取得岩石類型的漸層 CSS 類別
 */
export function getCragTypeGradient(rockType: string | null | undefined): string {
  const theme = getCragTypeTheme(rockType)
  return `bg-gradient-to-br ${theme.gradient}`
}

export default CragCoverGenerator
