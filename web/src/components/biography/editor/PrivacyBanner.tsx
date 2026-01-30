'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Check, Globe, Users, Lock, Glasses } from 'lucide-react'
import type { VisibilityLevel } from '@/lib/types/biography-v2'

interface PrivacyBannerProps {
  /** 當前可見性設定 */
  visibility: VisibilityLevel
  /** 可見性變更回調 */
  onVisibilityChange: (_visibility: VisibilityLevel) => void
  /** 是否可以編輯 */
  editable?: boolean
  /** 自訂樣式 */
  className?: string
}

const visibilityOptions: {
  value: VisibilityLevel
  icon: React.ElementType
  label: string
  description: string
}[] = [
  {
    value: 'public',
    icon: Globe,
    label: '公開',
    description: '所有人都可以看到',
  },
  {
    value: 'community',
    icon: Users,
    label: '社群',
    description: '只有社群成員可以看到',
  },
  {
    value: 'private',
    icon: Lock,
    label: '私密',
    description: '只有自己可以看到',
  },
  {
    value: 'anonymous',
    icon: Glasses,
    label: '匿名公開',
    description: '公開但不顯示你的名字',
  },
]

/**
 * 隱私設定橫幅
 *
 * 讓用戶設定人物誌的可見性
 */
export function PrivacyBanner({
  visibility,
  onVisibilityChange,
  editable = true,
  className,
}: PrivacyBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const currentOption = visibilityOptions.find((opt) => opt.value === visibility)
  const CurrentIcon = currentOption?.icon || Globe

  if (!editable) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3 bg-[#F5F5F5] rounded-xl',
          className
        )}
      >
        <CurrentIcon size={18} className="text-[#3F3D3D]" />
        <span className="text-sm text-[#6D6C6C]">
          目前設定：{currentOption?.label}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('bg-[#F5F5F5] rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#EBEAEA] transition-colors"
      >
        <div className="flex items-center gap-2">
          <CurrentIcon size={18} className="text-[#3F3D3D]" />
          <div className="text-left">
            <span className="text-sm font-medium text-[#1B1A1A]">
              {currentOption?.label}
            </span>
            <span className="text-sm text-[#6D6C6C] ml-2">
              {currentOption?.description}
            </span>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={cn(
            'text-[#6D6C6C] transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Options */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {visibilityOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onVisibilityChange(option.value)
                  setIsExpanded(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  visibility === option.value
                    ? 'bg-brand-accent/20 border-2 border-brand-accent'
                    : 'bg-white border border-[#B6B3B3] hover:border-[#6D6C6C]'
                )}
              >
                <Icon size={20} className="text-[#3F3D3D]" />
                <div className="flex-1 text-left">
                  <span
                    className={cn(
                      'font-medium',
                      visibility === option.value
                        ? 'text-[#1B1A1A]'
                        : 'text-[#3F3D3D]'
                    )}
                  >
                    {option.label}
                  </span>
                  <p className="text-sm text-[#6D6C6C]">{option.description}</p>
                </div>
                {visibility === option.value && (
                  <Check size={20} className="text-[#1B1A1A]" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PrivacyBanner
