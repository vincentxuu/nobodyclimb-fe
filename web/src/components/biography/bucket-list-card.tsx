'use client'

import { useState } from 'react'
import { MapPin, Target, Calendar, CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react'
import { LikeButton } from './like-button'
import { ReferenceButton } from './reference-button'
import { CommentSection } from './comment-section'
import { BucketListItem } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BucketListCardProps {
  item: BucketListItem
  isOwner?: boolean
  className?: string
}

const categoryLabels: Record<string, string> = {
  outdoor: '戶外攀登',
  indoor: '室內攀登',
  bouldering: '抱石',
  sport: '運動攀登',
  trad: '傳統攀登',
  alpine: '高山攀登',
  training: '訓練目標',
  travel: '攀岩旅行',
  other: '其他',
}

const categoryColors: Record<string, string> = {
  outdoor: 'bg-green-100 text-green-700',
  indoor: 'bg-blue-100 text-blue-700',
  bouldering: 'bg-orange-100 text-orange-700',
  sport: 'bg-purple-100 text-purple-700',
  trad: 'bg-amber-100 text-amber-700',
  alpine: 'bg-cyan-100 text-cyan-700',
  training: 'bg-pink-100 text-pink-700',
  travel: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-700',
}

export function BucketListCard({ item, isOwner = false, className }: BucketListCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isCompleted = item.status === 'completed'

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    try {
      return new Date(dateString).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div
      className={cn(
        'bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow',
        isCompleted && 'bg-green-50/50 border-green-200',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-gray-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3
                className={cn(
                  'font-medium text-gray-900',
                  isCompleted && 'line-through text-gray-500'
                )}
              >
                {item.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    categoryColors[item.category] || categoryColors.other
                  )}
                >
                  {categoryLabels[item.category] || item.category}
                </span>
                {item.target_location && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    {item.target_location}
                  </span>
                )}
                {item.target_grade && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Target className="h-3 w-3" />
                    {item.target_grade}
                  </span>
                )}
                {item.target_date && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {formatDate(item.target_date)}
                  </span>
                )}
              </div>
            </div>

            {!isOwner && (
              <div className="flex items-center gap-1">
                <LikeButton
                  itemId={item.id}
                  initialCount={item.likes_count}
                  variant="icon"
                />
                <ReferenceButton
                  itemId={item.id}
                  initialCount={item.inspired_count}
                  variant="icon"
                  showCount={false}
                />
              </div>
            )}
          </div>

          {item.description && (
            <p className="text-sm text-gray-600 mt-2">{item.description}</p>
          )}

          {item.enable_progress && !isCompleted && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>進度</span>
                <span>{item.progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}

          {isCompleted && item.completion_story && (
            <div className="mt-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    收合完成故事
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    查看完成故事
                  </>
                )}
              </button>

              {isExpanded && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg space-y-3">
                  <div>
                    <p className="text-xs text-green-600 font-medium mb-1">完成日期</p>
                    <p className="text-sm text-gray-700">
                      {formatDate(item.completed_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium mb-1">完成故事</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {item.completion_story}
                    </p>
                  </div>
                  {item.psychological_insights && (
                    <div>
                      <p className="text-xs text-green-600 font-medium mb-1">心理感悟</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {item.psychological_insights}
                      </p>
                    </div>
                  )}
                  {item.technical_insights && (
                    <div>
                      <p className="text-xs text-green-600 font-medium mb-1">技術分享</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {item.technical_insights}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-3 pt-3 border-t">
            <CommentSection itemId={item.id} initialCount={item.comments_count} />
          </div>
        </div>
      </div>
    </div>
  )
}
