'use client'

import { cn } from '@/lib/utils'
import { ContentLikeButton } from './ContentLikeButton'
import { ContentCommentSheet } from './ContentCommentSheet'
import { ShareButton } from '@/components/shared/share-button'
import type { ContentComment } from '@/lib/api/services'

interface ContentActionsProps {
  /** 是否已按讚 */
  isLiked: boolean
  /** 按讚數 */
  likeCount: number
  /** 留言數 */
  commentCount: number
  /** 按讚切換回呼 */
  onToggleLike: () => Promise<{ liked: boolean; like_count: number }>
  /** 獲取留言回呼 */
  onFetchComments: () => Promise<ContentComment[]>
  /** 新增留言回呼 */
  onAddComment: (_content: string) => Promise<ContentComment>
  /** 刪除留言回呼 */
  onDeleteComment?: (_commentId: string) => Promise<void>
  /** 分享連結（選填，未傳時使用當前頁面 URL） */
  shareUrl?: string
  /** 分享標題 */
  shareTitle?: string
  /** 按鈕大小 */
  size?: 'sm' | 'md'
  /** 是否置中對齊 */
  centered?: boolean
  /** 自訂樣式 */
  className?: string
}

/**
 * 內容互動操作列
 * 整合按讚、留言、分享三個操作的統一元件
 */
export function ContentActions({
  isLiked,
  likeCount,
  commentCount,
  onToggleLike,
  onFetchComments,
  onAddComment,
  onDeleteComment,
  shareUrl,
  shareTitle,
  size = 'sm',
  centered = false,
  className,
}: ContentActionsProps) {
  const iconSize = size === 'sm' ? 14 : 16

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-4 pl-1',
        centered && 'justify-center',
        className
      )}
    >
      <ContentLikeButton
        isLiked={isLiked}
        likeCount={likeCount}
        onToggle={onToggleLike}
        size={size}
      />
      <ContentCommentSheet
        commentCount={commentCount}
        onFetchComments={onFetchComments}
        onAddComment={onAddComment}
        onDeleteComment={onDeleteComment}
        size={size}
        panelClassName="order-last"
      />
      <ShareButton
        url={shareUrl}
        title={shareTitle}
        variant="ghost"
        size="sm"
        iconSize={iconSize}
        className={cn(
          'h-auto p-0 hover:bg-transparent',
          size === 'sm' ? 'text-xs' : 'text-sm',
          'text-[#9D9B9B] hover:text-[#6D6C6C]'
        )}
      />
    </div>
  )
}

export default ContentActions
