'use client'

import { cn } from '@/lib/utils'
import type { RankId } from '@nobodyclimb/types'

interface RankConfig {
  display: string
  bg: string
  text: string
  border: string
  description: string
}

const RANK_CONFIG: Record<RankId, RankConfig> = {
  foothill: {
    display: '麓',
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-300',
    description: '踏上山腳，攀岩旅途的起點',
  },
  wall: {
    display: '壁',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    description: '面對岩壁，開始真正的攀爬',
  },
  ridge: {
    display: '稜',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    description: '站上稜線，俯瞰山谷與天際',
  },
  summit: {
    display: '巔',
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-300',
    description: '登上頂點，攀岩已融入靈魂',
  },
}

const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5 rounded',
  md: 'text-sm px-2 py-1 rounded-md font-medium',
  lg: 'text-base px-3 py-1.5 rounded-lg font-semibold',
}

interface RankBadgeProps {
  tier: RankId
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
}

export function RankBadge({ tier, size = 'sm', showTooltip = false, className }: RankBadgeProps) {
  const config = RANK_CONFIG[tier]

  const badge = (
    <span
      className={cn(
        'inline-flex items-center border font-medium',
        config.bg,
        config.text,
        config.border,
        SIZE_CLASSES[size],
        className
      )}
    >
      {config.display}
    </span>
  )

  if (!showTooltip) return badge

  return (
    <span className="group relative inline-flex">
      {badge}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-lg border border-border bg-white px-3 py-2 text-xs text-text-subtle shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
        <span className="mb-1 block font-semibold text-text-main">段位：{config.display}</span>
        <span className="block">{config.description}</span>
        <span className="mt-1 block text-text-subtle">充實攀岩日誌可提升段位</span>
      </span>
    </span>
  )
}
