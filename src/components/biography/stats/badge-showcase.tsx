'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BadgeGrid } from './badge-card'
import { BadgeIcon } from './badge-icon'
import {
  BADGES,
  BADGE_CATEGORIES,
  getBadgesByCategory,
  type BadgeCategory,
} from '@/lib/constants/badges'
import type { BadgeProgress } from '@/lib/types'

interface BadgeShowcaseProps {
  badgeProgress: BadgeProgress[]
  className?: string
}

export function BadgeShowcase({ badgeProgress, className }: BadgeShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all')

  // 將進度數據轉換為 Map 以便查找
  const progressMap = new Map(badgeProgress.map((p) => [p.badge_id, p]))

  // 計算解鎖統計
  const unlockedCount = badgeProgress.filter((p) => p.unlocked).length
  const totalCount = Object.keys(BADGES).length

  // 獲取顯示的徽章
  const displayBadges =
    selectedCategory === 'all'
      ? Object.values(BADGES)
      : getBadgesByCategory(selectedCategory)

  // 按解鎖狀態排序（已解鎖在前）
  const sortedBadges = [...displayBadges].sort((a, b) => {
    const aUnlocked = progressMap.get(a.id)?.unlocked ?? false
    const bUnlocked = progressMap.get(b.id)?.unlocked ?? false
    if (aUnlocked === bUnlocked) return 0
    return aUnlocked ? -1 : 1
  })

  return (
    <div className={cn('space-y-6', className)}>
      {/* 頭部統計 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-main">徽章收藏</h2>
          <p className="text-sm text-text-subtle">
            已解鎖 {unlockedCount}/{totalCount} 個徽章
          </p>
        </div>

        {/* 已解鎖徽章預覽 */}
        <div className="flex gap-1">
          {badgeProgress
            .filter((p) => p.unlocked)
            .slice(0, 5)
            .map((p) => (
              <BadgeIcon key={p.badge_id} badge={p.badge_id} size="sm" showTooltip />
            ))}
          {unlockedCount > 5 && (
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-brand-light text-xs text-text-subtle font-medium">
              +{unlockedCount - 5}
            </div>
          )}
        </div>
      </div>

      {/* 分類篩選 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
            selectedCategory === 'all'
              ? 'bg-brand-dark text-white'
              : 'bg-brand-light text-strong hover:bg-subtle'
          )}
        >
          全部
        </button>
        {(Object.keys(BADGE_CATEGORIES) as BadgeCategory[]).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              selectedCategory === category
                ? 'bg-brand-dark text-white'
                : 'bg-brand-light text-strong hover:bg-subtle'
            )}
          >
            {BADGE_CATEGORIES[category]}
          </button>
        ))}
      </div>

      {/* 徽章網格 */}
      <BadgeGrid
        badges={sortedBadges.map((badge) => ({
          badgeId: badge.id,
          progress: progressMap.get(badge.id),
        }))}
        columns={4}
      />

      {/* 下一個可解鎖提示 */}
      {unlockedCount < totalCount && (
        <div className="p-4 bg-brand-accent/10 rounded-xl border border-brand-accent/30">
          <h3 className="text-sm font-semibold text-text-main mb-2">即將解鎖</h3>
          <div className="flex flex-wrap gap-4">
            {badgeProgress
              .filter((p) => !p.unlocked && p.progress >= 50)
              .sort((a, b) => b.progress - a.progress)
              .slice(0, 3)
              .map((p) => {
                const badge = BADGES[p.badge_id]
                if (!badge) return null
                return (
                  <div key={p.badge_id} className="flex items-center gap-3">
                    <BadgeIcon badge={p.badge_id} size="sm" unlocked={false} />
                    <div>
                      <p className="text-sm font-medium text-text-main">{badge.name}</p>
                      <p className="text-xs text-text-subtle">
                        {p.current_value}/{p.target_value} ({p.progress}%)
                      </p>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

interface CompactBadgeDisplayProps {
  badgeProgress: BadgeProgress[]
  maxDisplay?: number
  className?: string
}

export function CompactBadgeDisplay({
  badgeProgress,
  maxDisplay = 6,
  className,
}: CompactBadgeDisplayProps) {
  const unlockedBadges = badgeProgress.filter((p) => p.unlocked)
  const displayBadges = unlockedBadges.slice(0, maxDisplay)
  const remainingCount = Math.max(0, unlockedBadges.length - maxDisplay)

  if (unlockedBadges.length === 0) {
    return (
      <div className={cn('text-sm text-text-subtle', className)}>尚未解鎖任何徽章</div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {displayBadges.map((p) => (
        <BadgeIcon key={p.badge_id} badge={p.badge_id} size="sm" showTooltip />
      ))}
      {remainingCount > 0 && (
        <span className="text-sm text-text-subtle">+{remainingCount}</span>
      )}
    </div>
  )
}
