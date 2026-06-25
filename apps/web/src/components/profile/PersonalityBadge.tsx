'use client'

import { getPersonalityColor, getPersonalityType } from '@nobodyclimb/constants'
import type { PersonalityTypeCode } from '@nobodyclimb/types'
import { ChevronDown, ChevronUp, Flame, Wind } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface PersonalityBadgeProps {
  personalityType: string
  gritIndex?: number | null
  flowIndex?: number | null
  className?: string
}

export function PersonalityBadge({
  personalityType,
  gritIndex,
  flowIndex,
  className,
}: PersonalityBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const typeInfo = getPersonalityType(personalityType as PersonalityTypeCode)
  const color = getPersonalityColor(personalityType as PersonalityTypeCode)
  if (!typeInfo) return null

  const isGoalType = personalityType.charAt(1) === 'G'
  const indexValue = isGoalType ? gritIndex : flowIndex
  const indexLabel = isGoalType ? 'Grit Index' : 'Flow Index'

  return (
    <div className={cn('inline-block', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-colors hover:shadow-sm bg-gray-50"
        style={{ borderColor: color + '40' }}
      >
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="2" opacity="0.3" />
          <circle cx="20" cy="20" r="10" fill={color} opacity="0.8" />
          <text x="20" y="24" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
            {typeInfo.code.charAt(0)}
          </text>
        </svg>
        <div className="text-left">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold" style={{ color }}>
              {typeInfo.code}
            </span>
            <span className="text-xs font-medium text-gray-700">{typeInfo.nameZh}</span>
          </div>
          {indexValue != null && (
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400">{indexLabel}</span>
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: indexValue + '%', backgroundColor: color }}
                />
              </div>
            </div>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div
          className="mt-2 rounded-xl border p-4 shadow-sm"
          style={{ borderColor: color + '30', backgroundColor: color + '08' }}
        >
          <div className="mb-2">
            <span className="text-sm font-bold" style={{ color }}>
              {typeInfo.code} {typeInfo.nameZh}
            </span>
            <span className="ml-1 text-sm text-gray-500">{typeInfo.nameEn}</span>
          </div>
          <p className="mb-3 text-sm italic text-gray-600">「{typeInfo.tagline}」</p>
          <div className="mb-2">
            <span className="text-xs font-medium text-gray-500">優勢</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {typeInfo.strengths.map((s) => (
                <span
                  key={s}
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={{ backgroundColor: color + '15', color }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-2">
            <span className="text-xs font-medium text-gray-500">盲點</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {typeInfo.blindSpots.map((w) => (
                <span
                  key={w}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500">最佳狀態</span>
            {typeInfo.flowState ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700">
                <Wind className="h-3 w-3" />
                Flow
              </span>
            ) : null}
            {typeInfo.clutchState ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                <Flame className="h-3 w-3" />
                Clutch
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
