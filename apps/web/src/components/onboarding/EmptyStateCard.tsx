'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateCardProps {
  icon?: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  className?: string
  variant?: 'default' | 'encouragement' | 'minimal'
}

// 針對不同場景的鼓勵文案
export function useEmptyStateMessages() {
  const t = useTranslations('Onboarding')
  return {
    // 人物誌相關
    biography: {
      noStories: {
        title: t('emptyBiographyNoStoriesTitle'),
        description: t('emptyBiographyNoStoriesDescription'),
        actionLabel: t('emptyBiographyNoStoriesAction'),
      },
      noOneLiners: {
        title: t('emptyBiographyNoOneLinersTitle'),
        description: t('emptyBiographyNoOneLinersDescription'),
        actionLabel: t('emptyBiographyNoOneLinersAction'),
      },
      noTags: {
        title: t('emptyBiographyNoTagsTitle'),
        description: t('emptyBiographyNoTagsDescription'),
        actionLabel: t('emptyBiographyNoTagsAction'),
      },
      noAvatar: {
        title: t('emptyBiographyNoAvatarTitle'),
        description: t('emptyBiographyNoAvatarDescription'),
        actionLabel: t('emptyBiographyNoAvatarAction'),
      },
    },
    // 社群相關
    social: {
      noFollowing: {
        title: t('emptySocialNoFollowingTitle'),
        description: t('emptySocialNoFollowingDescription'),
        actionLabel: t('emptySocialNoFollowingAction'),
      },
      noLikes: {
        title: t('emptySocialNoLikesTitle'),
        description: t('emptySocialNoLikesDescription'),
        actionLabel: t('emptySocialNoLikesAction'),
      },
      noComments: {
        title: t('emptySocialNoCommentsTitle'),
        description: t('emptySocialNoCommentsDescription'),
        actionLabel: t('emptySocialNoCommentsAction'),
      },
    },
    // 書籤相關
    bookmarks: {
      noBookmarks: {
        title: t('emptyBookmarksNoBookmarksTitle'),
        description: t('emptyBookmarksNoBookmarksDescription'),
        actionLabel: t('emptyBookmarksNoBookmarksAction'),
      },
    },
    // 通用
    generic: {
      noContent: {
        title: t('emptyGenericNoContentTitle'),
        description: t('emptyGenericNoContentDescription'),
        actionLabel: t('emptyGenericNoContentAction'),
      },
    },
  }
}

export function EmptyStateCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  variant = 'default',
}: EmptyStateCardProps) {
  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm',
    encouragement: 'bg-primary/5 border border-primary/20',
    minimal: 'bg-transparent',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('rounded-lg p-8 text-center', variants[variant], className)}
    >
      {icon && (
        <div className="mb-4 flex justify-center">
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full',
              variant === 'encouragement' ? 'bg-primary/10' : 'bg-gray-100'
            )}
          >
            {icon}
          </div>
        </div>
      )}

      <h3 className="mb-2 text-lg font-medium text-[#1B1A1A]">{title}</h3>
      <p className="mb-6 text-[#6D6C6C]">{description}</p>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className={cn(
              'min-w-[140px]',
              variant === 'encouragement' ? 'bg-primary text-white hover:bg-primary/90' : ''
            )}
          >
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="outline" onClick={onSecondaryAction} className="min-w-[140px]">
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export default EmptyStateCard
