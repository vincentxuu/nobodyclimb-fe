'use client'

import { cn } from '@/lib/utils'
import { ContentActions } from './ContentActions'
import { QuickReactionBar } from './QuickReactionBar'
import type { ContentComment } from '@/lib/api/services'

type ContentType = 'core-stories' | 'one-liners' | 'stories'

interface ContentInteractionBarProps {
  /** 內容類型 */
  contentType: ContentType
  /** 內容 ID */
  contentId: string
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
  /** 按鈕大小 */
  size?: 'sm' | 'md'
  /** 自訂樣式 */
  className?: string
  /** 是否顯示分隔線 */
  showBorder?: boolean
  /** 是否置中對齊 */
  centered?: boolean
  /** 分享連結（選填，未傳時使用當前頁面 URL） */
  shareUrl?: string
  /** 分享標題 */
  shareTitle?: string
}

/**
 * 內容互動列
 * 整合快速回應、按讚、留言、分享功能的共用元件
 */
export function ContentInteractionBar({
  contentType,
  contentId,
  isLiked,
  likeCount,
  commentCount,
  onToggleLike,
  onFetchComments,
  onAddComment,
  onDeleteComment,
  size = 'sm',
  className,
  showBorder = true,
  centered = false,
  shareUrl,
  shareTitle,
}: ContentInteractionBarProps) {
  return (
    <div
      className={cn(
        showBorder && 'mt-4 pt-3 border-t border-[#EBEAEA]',
        centered && 'flex flex-col items-center',
        className
      )}
    >
      <QuickReactionBar
        contentType={contentType}
        contentId={contentId}
        size={size}
        className={size === 'sm' ? 'mb-2' : 'mb-3'}
      />
      <ContentActions
        isLiked={isLiked}
        likeCount={likeCount}
        commentCount={commentCount}
        onToggleLike={onToggleLike}
        onFetchComments={onFetchComments}
        onAddComment={onAddComment}
        onDeleteComment={onDeleteComment}
        shareUrl={shareUrl}
        shareTitle={shareTitle}
        size={size}
        centered={centered}
      />
    </div>
  )
}

export default ContentInteractionBar
