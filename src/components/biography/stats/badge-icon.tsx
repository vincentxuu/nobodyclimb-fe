'use client'

import { cn } from '@/lib/utils'
import { type BadgeDefinition, BADGES, getBadgeById } from '@/lib/constants/badges'

interface BadgeIconProps {
  badge: BadgeDefinition | string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  unlocked?: boolean
  showTooltip?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
}

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
}

export function BadgeIcon({
  badge,
  size = 'md',
  unlocked = true,
  showTooltip = false,
  className,
}: BadgeIconProps) {
  const badgeData = typeof badge === 'string' ? getBadgeById(badge) : badge

  if (!badgeData) {
    return null
  }

  const Icon = badgeData.icon

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full transition-all',
        sizeClasses[size],
        unlocked ? badgeData.bgColor : 'bg-gray-200',
        unlocked ? '' : 'grayscale opacity-50',
        className
      )}
      title={showTooltip ? `${badgeData.name}: ${badgeData.description}` : undefined}
    >
      <Icon
        className={cn(iconSizeClasses[size], unlocked ? badgeData.color : 'text-gray-400')}
      />
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-gray-400/30" />
        </div>
      )}
    </div>
  )
}

interface BadgeListProps {
  badgeIds: string[]
  unlockedIds?: string[]
  size?: 'sm' | 'md' | 'lg'
  maxDisplay?: number
  className?: string
}

export function BadgeList({
  badgeIds,
  unlockedIds = [],
  size = 'sm',
  maxDisplay,
  className,
}: BadgeListProps) {
  const displayBadges = maxDisplay ? badgeIds.slice(0, maxDisplay) : badgeIds
  const remainingCount = maxDisplay ? Math.max(0, badgeIds.length - maxDisplay) : 0

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {displayBadges.map((badgeId) => (
        <BadgeIcon
          key={badgeId}
          badge={badgeId}
          size={size}
          unlocked={unlockedIds.includes(badgeId)}
          showTooltip
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-sm font-medium',
            sizeClasses[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
