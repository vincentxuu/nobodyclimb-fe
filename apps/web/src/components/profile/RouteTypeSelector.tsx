'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// 路線型態分類
const ROUTE_TYPE_CATEGORIES = [
  {
    name: '攀登方式',
    options: ['抱石', '運動攀登', '頂繩攀登', '速度攀登', '傳統攀登'],
  },
  {
    name: '地形型態',
    options: ['平板岩', '垂直岩壁', '外傾岩壁', '屋簷', '裂隙', '稜線', '壁面', '煙囪'],
  },
  {
    name: '動作風格',
    options: ['動態', '跑酷', '協調', '靜態', '技術', '力量', '耐力'],
  },
]

interface RouteTypeSelectorProps {
  value: string[]
  onChange: (_types: string[]) => void
  disabled?: boolean
  className?: string
}

/**
 * 路線型態選擇器
 * 可複選，按類別分組顯示
 */
export function RouteTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: RouteTypeSelectorProps) {
  const handleToggle = (option: string) => {
    if (disabled) return

    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {ROUTE_TYPE_CATEGORIES.map((category) => (
        <div key={category.name}>
          <p className="mb-2 text-sm font-medium text-gray-600">{category.name}</p>
          <div className="flex flex-wrap gap-2">
            {category.options.map((option) => {
              const isSelected = value.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleToggle(option)}
                  disabled={disabled}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                    isSelected
                      ? 'border-gray-800 bg-gray-800 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400',
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 將逗號分隔的字串轉換為陣列
 */
export function stringToRouteTypes(str: string): string[] {
  if (!str) return []
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * 將陣列轉換為逗號分隔的字串
 */
export function routeTypesToString(types: string[]): string {
  return types.join(', ')
}
