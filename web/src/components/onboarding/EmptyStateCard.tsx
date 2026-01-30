'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
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
export const EMPTY_STATE_MESSAGES = {
  // 人物誌相關
  biography: {
    noStories: {
      title: '你的故事值得被分享',
      description: '每位攀岩者都有獨特的經歷，分享你的故事，讓更多人認識你。',
      actionLabel: '開始寫故事',
    },
    noOneLiners: {
      title: '用一句話介紹自己',
      description: '簡短的自我介紹，讓其他岩友快速認識你。',
      actionLabel: '填寫一句話',
    },
    noTags: {
      title: '選擇你的攀岩標籤',
      description: '讓大家知道你喜歡的攀岩類型和風格。',
      actionLabel: '選擇標籤',
    },
    noAvatar: {
      title: '上傳一張照片',
      description: '讓其他岩友認識你，一張攀岩照片最能代表你！',
      actionLabel: '上傳照片',
    },
  },
  // 社群相關
  social: {
    noFollowing: {
      title: '探索更多小人物',
      description: '追蹤你感興趣的攀岩者，獲取他們的最新動態。',
      actionLabel: '探索人物誌',
    },
    noLikes: {
      title: '為喜歡的內容按讚',
      description: '瀏覽其他岩友的故事，為你喜歡的內容點個讚吧！',
      actionLabel: '瀏覽故事',
    },
    noComments: {
      title: '留下你的想法',
      description: '與其他岩友互動，分享你的經驗和建議。',
      actionLabel: '瀏覽內容',
    },
  },
  // 書籤相關
  bookmarks: {
    noBookmarks: {
      title: '收藏你喜歡的內容',
      description: '將感興趣的故事、路線或岩場加入收藏，方便之後查看。',
      actionLabel: '探索內容',
    },
  },
  // 通用
  generic: {
    noContent: {
      title: '這裡還沒有內容',
      description: '開始探索或創建你的第一個內容吧！',
      actionLabel: '開始探索',
    },
  },
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
      className={cn(
        'rounded-xl p-8 text-center',
        variants[variant],
        className
      )}
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
              variant === 'encouragement'
                ? 'bg-primary text-white hover:bg-primary/90'
                : ''
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
