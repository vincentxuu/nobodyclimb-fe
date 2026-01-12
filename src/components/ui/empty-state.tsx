'use client'

import React from 'react'
import { FileText, Search, Image, Video, MapPin, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

type IconType = 'file' | 'search' | 'image' | 'video' | 'location' | 'user'

interface EmptyStateProps {
  /** 圖示類型 */
  icon?: IconType
  /** 標題文字 */
  title?: string
  /** 描述文字 */
  description?: string
  /** 按鈕文字（可選） */
  actionText?: string
  /** 按鈕點擊事件（可選） */
  onAction?: () => void
  /** 自訂樣式類名 */
  className?: string
}

const iconMap = {
  file: FileText,
  search: Search,
  image: Image,
  video: Video,
  location: MapPin,
  user: User,
}

export function EmptyState({
  icon = 'file',
  title = '沒有資料',
  description,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  const Icon = iconMap[icon]

  return (
    <div
      className={`flex min-h-[300px] flex-col items-center justify-center py-12 ${className ?? ''}`}
    >
      <Icon className="mb-4 h-16 w-16 text-neutral-300" />
      <h3 className="mb-2 text-xl font-medium text-text-main">{title}</h3>
      {description && <p className="mb-4 text-text-subtle">{description}</p>}
      {actionText && onAction && (
        <Button
          variant="outline"
          onClick={onAction}
          className="border-text-main text-text-main hover:bg-neutral-200"
        >
          {actionText}
        </Button>
      )}
    </div>
  )
}
