'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Lightbulb, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

type EmptyStateType = 'no_content' | 'private' | 'anonymous' | 'not_found'

interface EmptyStateProps {
  /** 空狀態類型 */
  type: EmptyStateType
  /** 是否為當前用戶的頁面 */
  isOwner?: boolean
  /** 自訂樣式 */
  className?: string
}

const EmptyStateEmojis: Record<EmptyStateType, string> = {
  no_content: '📝',
  private: '🔒',
  anonymous: '🎭',
  not_found: '🔍',
}

/**
 * 空狀態組件
 *
 * 用於各種空狀態的展示
 */
export function EmptyState({
  type,
  isOwner = false,
  className,
}: EmptyStateProps) {
  const t = useTranslations('BiographyPage')
  const emoji = EmptyStateEmojis[type]

  const contentMap: Record<EmptyStateType, { title: string; description: string; actionLabel?: string; actionHref?: string }> = {
    no_content: {
      title: t('emptyStateNoContent'),
      description: t('emptyStateNoContentDesc'),
      actionLabel: t('emptyStateNoContentAction'),
      actionHref: '/profile',
    },
    private: {
      title: t('emptyStatePrivate'),
      description: t('emptyStatePrivateDesc'),
      actionLabel: t('emptyStatePrivateAction'),
      actionHref: '/biography',
    },
    anonymous: {
      title: t('anonymousName'),
      description: t('emptyStatePrivateDesc'),
    },
    not_found: {
      title: t('emptyStateNotFound'),
      description: t('emptyStateNotFoundDesc'),
      actionLabel: t('emptyStateNotFoundAction'),
      actionHref: '/biography',
    },
  }

  const content = contentMap[type]

  // 如果是用戶自己的頁面且沒有內容，顯示引導
  const showOwnerGuide = type === 'no_content' && isOwner

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <div className="w-20 h-20 rounded-full bg-[#EBEAEA] flex items-center justify-center mb-6">
        <span className="text-4xl">{emoji}</span>
      </div>

      <h2 className="text-xl font-semibold text-[#1B1A1A] mb-2">
        {content.title}
      </h2>

      <p className="text-[#6D6C6C] max-w-sm mb-6">{content.description}</p>

      {showOwnerGuide && (
        <div className="bg-brand-accent/10 rounded-lg p-4 mb-6 max-w-sm">
          <p className="text-sm text-brand-dark flex items-center gap-2">
            <Lightbulb size={16} className="flex-shrink-0" />
            {t('ownerGuide')}
          </p>
        </div>
      )}

      {content.actionLabel && content.actionHref && (
        <Link
          href={content.actionHref}
          className="px-6 py-3 rounded-full bg-brand-dark text-white font-medium hover:bg-[#3F3D3D] transition-colors"
        >
          {content.actionLabel}
        </Link>
      )}
    </div>
  )
}

/**
 * 區塊空狀態組件
 *
 * 用於頁面內某個區塊的空狀態
 */
interface SectionEmptyStateProps {
  /** Emoji 圖示 */
  emoji?: string
  /** 標題 */
  title: string
  /** 說明文字 */
  description?: string
  /** 是否為編輯模式 */
  editable?: boolean
  /** 新增按鈕文字 */
  addLabel?: string
  /** 新增回調 */
  onAdd?: () => void
  /** 自訂樣式 */
  className?: string
}

export function SectionEmptyState({
  emoji = '📝',
  title,
  description,
  editable = false,
  addLabel,
  onAdd,
  className,
}: SectionEmptyStateProps) {
  const t = useTranslations('BiographyPage')
  const resolvedAddLabel = addLabel ?? t('sectionEmptyAddLabel')
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-[#DBD8D8] rounded-lg',
        className
      )}
    >
      <span className="text-3xl mb-3">{emoji}</span>
      <p className="text-[#6D6C6C] mb-2">{title}</p>
      {description && <p className="text-sm text-[#8E8C8C] mb-4">{description}</p>}

      {editable && onAdd && (
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-brand-accent/20 text-brand-dark font-medium hover:bg-brand-accent/30 transition-colors"
        >
          <Plus size={16} />
          {resolvedAddLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
