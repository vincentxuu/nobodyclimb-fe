'use client'

import { cn } from '@/lib/utils'
import { Check, Sparkles } from 'lucide-react'
import type { TagOption } from '@/lib/types/biography-v2'

interface TagChipProps {
  /** 標籤資料 */
  tag: TagOption
  /** 是否被選中 */
  selected?: boolean
  /** 是否為編輯模式（可點擊） */
  editable?: boolean
  /** 點擊回調 */
  onClick?: () => void
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 是否顯示說明文字 */
  showDescription?: boolean
  /** 自訂樣式 */
  className?: string
}

/**
 * 標籤組件
 *
 * 支援系統標籤和用戶自訂標籤的不同樣式
 */
export function TagChip({
  tag,
  selected = false,
  editable = false,
  onClick,
  size = 'md',
  className,
}: TagChipProps) {
  const isCustom = tag.source === 'user'

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const baseClasses = cn(
    'inline-flex items-center gap-1 rounded-full font-medium transition-all duration-200',
    sizeClasses[size],
    editable && 'cursor-pointer hover:scale-105',
    // 系統標籤 vs 用戶自訂標籤
    isCustom
      ? selected
        ? 'bg-brand-accent/30 text-[#1B1A1A] border-2 border-brand-accent'
        : 'bg-brand-accent/10 text-[#3F3D3D] border border-brand-accent/50 hover:bg-brand-accent/20'
      : selected
        ? 'bg-brand-dark text-white'
        : 'bg-[#EBEAEA] text-[#3F3D3D] hover:bg-[#DBD8D8]',
    className
  )

  const content = (
    <>
      {isCustom && <Sparkles size={12} className="text-brand-accent" />}
      <span>{tag.label}</span>
      {editable && selected && (
        <Check size={12} className="ml-0.5 opacity-70" />
      )}
    </>
  )

  if (editable && onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClasses}>
        {content}
      </button>
    )
  }

  return (
    <span className={baseClasses}>
      {content}
    </span>
  )
}

/**
 * 標籤卡片組件（含說明文字）
 *
 * 用於編輯器中的標籤選擇
 */
interface TagCardProps extends TagChipProps {
  /** 是否為複選模式 */
  multiSelect?: boolean
}

export function TagCard({
  tag,
  selected = false,
  editable = true,
  onClick,
  multiSelect = true,
  className,
}: TagCardProps) {
  const isCustom = tag.source === 'user'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-1 p-3 rounded-lg border-2 text-left transition-all duration-200',
        'hover:shadow-md',
        selected
          ? isCustom
            ? 'border-brand-accent bg-brand-accent/10'
            : 'border-brand-dark bg-brand-dark/5'
          : 'border-[#DBD8D8] hover:border-[#B6B3B3]',
        editable && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-center justify-between w-full">
        <span
          className={cn(
            'font-medium flex items-center gap-1',
            selected
              ? isCustom
                ? 'text-[#1B1A1A]'
                : 'text-[#1B1A1A]'
              : 'text-[#3F3D3D]'
          )}
        >
          {isCustom && <Sparkles size={14} className="text-brand-accent" />}
          {tag.label}
        </span>
        <span
          className={cn(
            'w-5 h-5 border-2 flex items-center justify-center transition-colors',
            selected
              ? isCustom
                ? 'border-brand-accent bg-brand-accent text-brand-dark'
                : 'border-brand-dark bg-brand-dark text-white'
              : 'border-[#B6B3B3]',
            multiSelect ? 'rounded' : 'rounded-full'
          )}
        >
          {selected && <Check size={12} />}
        </span>
      </div>
      {tag.description && (
        <span className="text-xs text-[#6D6C6C]">{tag.description}</span>
      )}
    </button>
  )
}

export default TagChip
