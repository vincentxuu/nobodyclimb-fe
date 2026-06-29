'use client'

import { FileText, Image, MapPin, Search, Target, User, Video } from 'lucide-react'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyAction, EmptyDescription, EmptyIcon, EmptyTitle } from '@/components/ui/empty'

type IconType = 'file' | 'search' | 'image' | 'video' | 'location' | 'user' | 'target'

interface EmptyStateProps {
  icon?: IconType | React.ReactNode
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
  action?: React.ReactNode
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
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon
    }
    const Icon = iconMap[icon as IconType] || FileText
    return <Icon className="h-8 w-8" />
  }

  return (
    <Empty className={className}>
      <EmptyIcon>{renderIcon()}</EmptyIcon>
      <EmptyTitle>{title}</EmptyTitle>
      {description && <EmptyDescription>{description}</EmptyDescription>}
      {action ? (
        <EmptyAction>{action}</EmptyAction>
      ) : actionText && onAction ? (
        <EmptyAction>
          <Button
            variant="outline"
            onClick={onAction}
            className="border-text-main text-text-main hover:bg-neutral-200"
          >
            {actionText}
          </Button>
        </EmptyAction>
      ) : null}
    </Empty>
  )
}
