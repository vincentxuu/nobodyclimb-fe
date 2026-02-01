'use client'

import React from 'react'
import { FileText, Search, Image, Video, MapPin, User, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

type IconType = 'file' | 'search' | 'image' | 'video' | 'location' | 'user' | 'target'

interface EmptyStateProps {
  /** 圖示類型或自訂 React 節點 */
  icon?: IconType | React.ReactNode
  /** 標題文字 */
  title?: string
  /** 描述文字 */
  description?: string
  /** 按鈕文字（可選） */
  actionText?: string
  /** 按鈕點擊事件（可選） */
  onAction?: () => void
  /** 自訂操作按鈕（可選，優先於 actionText/onAction） */
  action?: React.ReactNode
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
  target: Target,
}

export function EmptyState({
  icon = 'file',
  title = '沒有資料',
  description,
  actionText,
  onAction,
  action,
  className,
}: EmptyStateProps) {
  // 支援自訂圖示或預設圖示
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return <div className="mb-4">{icon}</div>
    }
    const Icon = iconMap[icon as IconType] || FileText
    return <Icon className="mb-4 h-16 w-16 text-neutral-300" />
  }

  return (
    <div
      className={`flex min-h-[300px] flex-col items-center justify-center py-12 ${className ?? ''}`}
    >
      {renderIcon()}
      <h3 className="mb-2 text-xl font-medium text-text-main">{title}</h3>
      {description && <p className="mb-4 text-text-subtle">{description}</p>}
      {action ? (
        action
      ) : actionText && onAction ? (
        <Button
          variant="outline"
          onClick={onAction}
          className="border-text-main text-text-main hover:bg-neutral-200"
        >
          {actionText}
        </Button>
      ) : null}
    </div>
  )
}
