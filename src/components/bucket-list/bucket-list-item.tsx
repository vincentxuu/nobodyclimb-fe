'use client'

import * as React from 'react'
import {
  Target,
  MapPin,
  Calendar,
  Heart,
  MessageCircle,
  Link as LinkIcon,
  Edit,
  Trash2,
  Check,
  MoreVertical,
  Mountain,
  Home,
  Trophy,
  Dumbbell,
  Plane,
  Award,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BucketListItem, BucketListCategory } from '@/lib/types'
import { ProgressBar, ProgressTracker } from './progress-tracker'
import { Button } from '@/components/ui/button'

// 分類圖標和標籤映射
const categoryConfig: Record<
  BucketListCategory,
  { icon: React.ElementType; label: string; color: string }
> = {
  outdoor_route: { icon: Mountain, label: '戶外路線', color: 'bg-green-100 text-green-700' },
  indoor_grade: { icon: Home, label: '室內難度', color: 'bg-blue-100 text-blue-700' },
  competition: { icon: Trophy, label: '比賽目標', color: 'bg-yellow-100 text-yellow-700' },
  training: { icon: Dumbbell, label: '訓練目標', color: 'bg-purple-100 text-purple-700' },
  adventure: { icon: Plane, label: '冒險挑戰', color: 'bg-orange-100 text-orange-700' },
  skill: { icon: Award, label: '技能學習', color: 'bg-pink-100 text-pink-700' },
  injury_recovery: { icon: Activity, label: '受傷復原', color: 'bg-red-100 text-red-700' },
  other: { icon: Target, label: '其他', color: 'bg-gray-100 text-gray-700' },
}

interface BucketListItemCardProps {
  item: BucketListItem
  variant?: 'default' | 'compact' | 'expanded'
  showActions?: boolean
  isOwner?: boolean
  onEdit?: (item: BucketListItem) => void
  onDelete?: (item: BucketListItem) => void
  onComplete?: (item: BucketListItem) => void
  onLike?: (item: BucketListItem) => void
  onComment?: (item: BucketListItem) => void
  onReference?: (item: BucketListItem) => void
  onClick?: (item: BucketListItem) => void
  className?: string
}

/**
 * 人生清單項目卡片
 */
export function BucketListItemCard({
  item,
  variant = 'default',
  showActions = true,
  isOwner = false,
  onEdit,
  onDelete,
  onComplete,
  onLike,
  onComment,
  onReference,
  onClick,
  className,
}: BucketListItemCardProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const category = categoryConfig[item.category]
  const CategoryIcon = category.icon
  const isCompleted = item.status === 'completed'
  const isArchived = item.status === 'archived'

  // 點擊外部關閉選單
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 計算進度
  const displayProgress = React.useMemo(() => {
    if (!item.enable_progress) return null
    if (item.progress_mode === 'milestone' && item.milestones) {
      const completed = item.milestones.filter((m) => m.completed).length
      return Math.round((completed / item.milestones.length) * 100)
    }
    return item.progress
  }, [item])

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md',
        isCompleted && 'border-[#FAF40A] bg-yellow-50/30',
        isArchived && 'opacity-60',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={() => onClick?.(item)}
    >
      <div className={cn('p-4', variant === 'compact' && 'p-3')}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Category Badge */}
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                category.color
              )}
            >
              <CategoryIcon className="h-3 w-3" />
              {category.label}
            </span>

            {/* Title */}
            <h3
              className={cn(
                'mt-2 font-medium text-[#1B1A1A] line-clamp-2',
                variant === 'compact' ? 'text-sm' : 'text-base',
                isCompleted && 'line-through decoration-[#FAF40A] decoration-2'
              )}
            >
              {item.title}
            </h3>

            {/* Meta info */}
            {variant !== 'compact' && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                {item.target_grade && (
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {item.target_grade}
                  </span>
                )}
                {item.target_location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {item.target_location}
                  </span>
                )}
                {item.target_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {item.target_date}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Status & Actions */}
          <div className="flex items-center gap-2">
            {isCompleted && (
              <span className="flex items-center gap-1 rounded-full bg-[#FAF40A] px-2 py-0.5 text-xs font-medium text-[#1B1A1A]">
                <Check className="h-3 w-3" />
                已完成
              </span>
            )}

            {showActions && isOwner && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(!showMenu)
                  }}
                  className="rounded-full p-1 opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-32 overflow-hidden rounded-md border bg-white shadow-lg">
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onComplete?.(item)
                          setShowMenu(false)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <Check className="h-4 w-4" />
                        標記完成
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit?.(item)
                        setShowMenu(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4" />
                      編輯
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete?.(item)
                        setShowMenu(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      刪除
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {variant === 'expanded' && item.description && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-3">{item.description}</p>
        )}

        {/* Progress */}
        {item.enable_progress && displayProgress !== null && !isCompleted && (
          <div className="mt-3">
            {item.progress_mode === 'milestone' && item.milestones ? (
              <ProgressTracker
                mode="milestone"
                progress={displayProgress}
                milestones={item.milestones}
                size="sm"
                showLabels={variant === 'expanded'}
              />
            ) : (
              <ProgressBar progress={displayProgress} size="sm" />
            )}
          </div>
        )}

        {/* Completion Story Preview */}
        {isCompleted && item.completion_story && variant === 'expanded' && (
          <div className="mt-3 rounded-md bg-yellow-50 p-3">
            <p className="text-sm font-medium text-[#1B1A1A]">完成故事</p>
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{item.completion_story}</p>
          </div>
        )}

        {/* Completed Date */}
        {isCompleted && item.completed_at && (
          <p className="mt-2 text-xs text-gray-500">
            完成於 {new Date(item.completed_at).toLocaleDateString('zh-TW')}
          </p>
        )}

        {/* Social Stats */}
        {item.is_public && variant !== 'compact' && (
          <div className="mt-3 flex items-center gap-4 border-t pt-3 text-sm text-gray-500">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onLike?.(item)
              }}
              className="flex items-center gap-1 hover:text-red-500"
            >
              <Heart className="h-4 w-4" />
              {item.likes_count || 0}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onComment?.(item)
              }}
              className="flex items-center gap-1 hover:text-blue-500"
            >
              <MessageCircle className="h-4 w-4" />
              {item.comments_count || 0}
            </button>
            {!isOwner && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onReference?.(item)
                }}
                className="flex items-center gap-1 hover:text-green-500"
              >
                <LinkIcon className="h-4 w-4" />
                {item.inspired_count || 0} 人也想做
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface BucketListSectionProps {
  title: string
  items: BucketListItem[]
  emptyText?: string
  showCount?: boolean
  isOwner?: boolean
  onEdit?: (item: BucketListItem) => void
  onDelete?: (item: BucketListItem) => void
  onComplete?: (item: BucketListItem) => void
  onLike?: (item: BucketListItem) => void
  onComment?: (item: BucketListItem) => void
  onReference?: (item: BucketListItem) => void
  onClick?: (item: BucketListItem) => void
  className?: string
}

/**
 * 人生清單區塊（含標題和項目列表）
 */
export function BucketListSection({
  title,
  items,
  emptyText = '還沒有任何目標',
  showCount = true,
  isOwner = false,
  onEdit,
  onDelete,
  onComplete,
  onLike,
  onComment,
  onReference,
  onClick,
  className,
}: BucketListSectionProps) {
  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-medium text-[#1B1A1A]">
          {title}
          {showCount && <span className="ml-2 text-sm text-gray-500">({items.length})</span>}
        </h3>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-gray-500">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <BucketListItemCard
              key={item.id}
              item={item}
              isOwner={isOwner}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
              onLike={onLike}
              onComment={onComment}
              onReference={onReference}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * 快速新增目標按鈕
 */
export function AddBucketListButton({
  onClick,
  className,
}: {
  onClick: () => void
  className?: string
}) {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      className={cn('w-full border-dashed', className)}
    >
      <Target className="mr-2 h-4 w-4" />
      新增目標
    </Button>
  )
}
