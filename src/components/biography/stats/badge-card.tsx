'use client'

import { cn } from '@/lib/utils'
import { type BadgeDefinition, getBadgeById } from '@/lib/constants/badges'
import type { BadgeProgress } from '@/lib/types'
import { Check } from 'lucide-react'

interface BadgeCardProps {
  badge: BadgeDefinition | string
  progress?: BadgeProgress
  className?: string
}

export function BadgeCard({ badge, progress, className }: BadgeCardProps) {
  const badgeData = typeof badge === 'string' ? getBadgeById(badge) : badge

  if (!badgeData) {
    return null
  }

  const Icon = badgeData.icon
  const isUnlocked = progress?.unlocked ?? false
  const progressPercent = progress?.progress ?? 0

  return (
    <div
      className={cn(
        'relative flex flex-col items-center p-4 rounded-xl border transition-all',
        isUnlocked
          ? 'bg-white border-subtle shadow-sm'
          : 'bg-page-bg border-subtle/50',
        className
      )}
    >
      {/* 徽章圖標 */}
      <div
        className={cn(
          'relative flex items-center justify-center w-16 h-16 rounded-full mb-3',
          isUnlocked ? badgeData.bgColor : 'bg-brand-light'
        )}
      >
        <Icon
          className={cn('w-8 h-8', isUnlocked ? badgeData.color : 'text-subtle')}
        />
        {isUnlocked && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* 徽章名稱 */}
      <h4
        className={cn(
          'text-sm font-semibold text-center mb-1',
          isUnlocked ? 'text-text-main' : 'text-text-subtle'
        )}
      >
        {badgeData.name}
      </h4>

      {/* 徽章描述 */}
      <p className="text-xs text-text-subtle text-center mb-3">{badgeData.description}</p>

      {/* 進度條 */}
      {!isUnlocked && progress && (
        <div className="w-full">
          <div className="flex justify-between text-xs text-text-subtle mb-1">
            <span>進度</span>
            <span>
              {progress.current_value}/{progress.target_value}
            </span>
          </div>
          <div className="w-full h-2 bg-brand-light rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', badgeData.bgColor)}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 解鎖時間 */}
      {isUnlocked && progress?.unlocked_at && (
        <p className="text-xs text-subtle mt-2">
          {new Date(progress.unlocked_at).toLocaleDateString('zh-TW')} 解鎖
        </p>
      )}
    </div>
  )
}

interface BadgeGridProps {
  badges: Array<{
    badgeId: string
    progress?: BadgeProgress
  }>
  columns?: 2 | 3 | 4
  className?: string
}

export function BadgeGrid({ badges, columns = 3, className }: BadgeGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {badges.map(({ badgeId, progress }) => (
        <BadgeCard key={badgeId} badge={badgeId} progress={progress} />
      ))}
    </div>
  )
}
