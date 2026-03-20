'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Mountain, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/use-toast'
import {
  ContentInteractorsPanel,
  type InteractorUser,
} from './ContentInteractorsPanel'
import { useTranslations } from 'next-intl'

interface ContentLikeButtonProps {
  /** 是否已按讚 */
  isLiked: boolean
  /** 按讚數 */
  likeCount: number
  /** 按讚/取消按讚回呼 */
  onToggle: () => Promise<{ liked: boolean; like_count: number }>
  /** 取得按讚者列表（選填，有傳才顯示可點擊的讚數） */
  onFetchLikers?: () => Promise<InteractorUser[]>
  /** 大小 */
  size?: 'sm' | 'md'
  /** 自訂樣式 */
  className?: string
}

/**
 * 內容按讚按鈕
 * 用於一句話、小故事、核心故事的按讚功能
 * 若有傳入 onFetchLikers，讚數數字可點擊展開按讚者列表
 */
export function ContentLikeButton({
  isLiked,
  likeCount,
  onToggle,
  onFetchLikers,
  size = 'sm',
  className,
}: ContentLikeButtonProps) {
  const t = useTranslations('BiographyPage')
  const { status } = useAuthStore()
  const { toast } = useToast()
  const [liked, setLiked] = useState(isLiked)
  const [count, setCount] = useState(likeCount)
  const [isLoading, setIsLoading] = useState(false)

  // 按讚者 panel 狀態
  const [isLikersOpen, setIsLikersOpen] = useState(false)
  const [likers, setLikers] = useState<InteractorUser[]>([])
  const [isLoadingLikers, setIsLoadingLikers] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (status !== 'signIn') {
      toast({
        title: t('loginRequired'),
        description: t('loginRequiredDesc'),
        variant: 'destructive',
      })
      return
    }

    if (isLoading) return

    setIsLoading(true)
    // Optimistic update
    setLiked(!liked)
    setCount(liked ? count - 1 : count + 1)

    try {
      const result = await onToggle()
      setLiked(result.liked)
      setCount(result.like_count)
      setLikers([]) // 按讚狀態改變後清除快取
    } catch (error) {
      // Rollback on error
      setLiked(liked)
      setCount(count)
      console.error('Failed to toggle like:', error)
      toast({
        title: t('operationFailed'),
        description: t('operationFailedDesc'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleShowLikers = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!onFetchLikers) return

    const next = !isLikersOpen
    setIsLikersOpen(next)

    if (next && likers.length === 0) {
      setIsLoadingLikers(true)
      try {
        const data = await onFetchLikers()
        setLikers(data)
      } catch (error) {
        console.error('Failed to fetch likers:', error)
      } finally {
        setIsLoadingLikers(false)
      }
    }
  }

  const iconSize = size === 'sm' ? 14 : 16

  return (
    <>
      <div className={cn('inline-flex items-center gap-1', className)}>
        {/* 按讚圖示按鈕 */}
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={cn(
            'inline-flex items-center transition-colors',
            size === 'sm' ? 'text-xs' : 'text-sm',
            liked
              ? 'text-emerald-600 hover:text-emerald-700'
              : 'text-[#9D9B9B] hover:text-emerald-600',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 size={iconSize} className="animate-spin" />
          ) : (
            <Mountain
              size={iconSize}
              className={cn(liked && 'fill-current')}
            />
          )}
        </button>

        {/* 讚數：有 onFetchLikers 則可點擊開啟 panel */}
        {count > 0 && (
          onFetchLikers ? (
            <button
              onClick={handleShowLikers}
              className={cn(
                'transition-colors leading-none',
                size === 'sm' ? 'text-xs' : 'text-sm',
                liked ? 'text-emerald-600' : 'text-[#9D9B9B]',
                'hover:underline'
              )}
            >
              {count}
            </button>
          ) : (
            <span
              className={cn(
                'leading-none',
                size === 'sm' ? 'text-xs' : 'text-sm',
                liked ? 'text-emerald-600' : 'text-[#9D9B9B]'
              )}
            >
              {count}
            </span>
          )
        )}
      </div>

      {/* 按讚者列表 panel */}
      {onFetchLikers && (
        <ContentInteractorsPanel
          isOpen={isLikersOpen}
          users={likers}
          isLoading={isLoadingLikers}
          emptyMessage={t('noLikers')}
          panelClassName="order-last"
        />
      )}
    </>
  )
}

export default ContentLikeButton
