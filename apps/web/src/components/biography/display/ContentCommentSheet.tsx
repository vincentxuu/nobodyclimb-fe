'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, MessageCircle, Send, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import type { ContentComment } from '@/lib/api/services'
import { motion, AnimatePresence } from 'framer-motion'

interface ContentCommentSheetProps {
  /** 留言數量 */
  commentCount: number
  /** 取得留言列表 */
  onFetchComments: () => Promise<ContentComment[]>
  /** 新增留言 */
  onAddComment: (_content: string) => Promise<ContentComment>
  /** 刪除留言 */
  onDeleteComment?: (_commentId: string) => Promise<void>
  /** 按鈕大小 */
  size?: 'sm' | 'md'
  /** 自訂樣式 */
  className?: string
}

// 格式化時間
const formatTime = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: zhTW,
    })
  } catch {
    return dateString
  }
}

// 單個留言元件
function CommentItem({
  comment,
  currentUserId,
  onDelete,
}: {
  comment: ContentComment
  currentUserId?: string
  onDelete?: (_id: string) => void
}) {
  const displayName = comment.display_name || comment.username || '匿名用戶'

  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
        {comment.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={comment.avatar_url}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{displayName}</span>
          <span className="text-xs text-gray-400">{formatTime(comment.created_at)}</span>
          {onDelete && currentUserId === comment.user_id && (
            <button
              onClick={() => onDelete(comment.id)}
              className="ml-auto text-gray-400 hover:text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        <p className="mt-1 break-words text-sm text-gray-700">{comment.content}</p>
      </div>
    </div>
  )
}

// 留言輸入框
function CommentForm({
  onSubmit,
  isSubmitting,
  isLoggedIn,
}: {
  onSubmit: (_content: string) => Promise<void>
  isSubmitting: boolean
  isLoggedIn: boolean
}) {
  const [content, setContent] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    await onSubmit(content)
    setContent('')
  }

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-gray-500">
        <a href="/auth/login" className="text-brand-600 hover:underline">
          登入
        </a>
        {' '}後才能留言
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="寫下你的留言..."
        className="min-h-[60px] flex-1 resize-none"
        disabled={isSubmitting}
      />
      <Button
        type="submit"
        size="sm"
        disabled={!content.trim() || isSubmitting}
        className="self-end"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
}

/**
 * 內容留言區塊
 * 用於一句話、小故事、核心故事的留言功能
 * 點擊後在下方展開顯示留言列表
 */
export function ContentCommentSheet({
  commentCount,
  onFetchComments,
  onAddComment,
  onDeleteComment,
  size = 'sm',
  className,
}: ContentCommentSheetProps) {
  const { isAuthenticated, user } = useAuthStore()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [comments, setComments] = useState<ContentComment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [count, setCount] = useState(commentCount)

  // 獲取留言列表
  const fetchComments = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await onFetchComments()
      setComments(data)
      setCount(data.length)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      toast({
        title: '載入留言失敗',
        description: '請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [onFetchComments, toast])

  useEffect(() => {
    if (isOpen) {
      fetchComments()
    }
  }, [isOpen, fetchComments])

  // 新增留言
  const handleAddComment = async (content: string) => {
    setIsSubmitting(true)
    try {
      const newComment = await onAddComment(content)
      setComments([newComment, ...comments])
      setCount((prev) => prev + 1)
      toast({
        title: '留言發表成功',
        description: '感謝你的分享！',
      })
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast({
        title: '留言發表失敗',
        description: '請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 刪除留言
  const handleDeleteComment = async (commentId: string) => {
    if (!onDeleteComment) return
    try {
      await onDeleteComment(commentId)
      setComments(comments.filter((c) => c.id !== commentId))
      setCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast({
        title: '刪除留言失敗',
        description: '請稍後再試',
        variant: 'destructive',
      })
    }
  }

  const iconSize = size === 'sm' ? 14 : 16

  return (
    <>
      {/* 留言按鈕 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-1 transition-colors',
          size === 'sm' ? 'text-xs' : 'text-sm',
          'text-[#9D9B9B] hover:text-[#6D6C6C]',
          className
        )}
      >
        <MessageCircle size={iconSize} />
        {count > 0 && <span>{count}</span>}
        {isOpen ? (
          <ChevronUp size={iconSize} className="ml-0.5" />
        ) : (
          <ChevronDown size={iconSize} className="ml-0.5" />
        )}
      </button>

      {/* 留言區塊展開 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full overflow-hidden basis-full"
          >
            <div className="mt-4 space-y-4 border-t border-[#EBEAEA] pt-4">
              {/* 留言輸入框 */}
              <CommentForm
                onSubmit={handleAddComment}
                isSubmitting={isSubmitting}
                isLoggedIn={isAuthenticated}
              />

              {/* 留言列表 */}
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUserId={user?.id}
                      onDelete={onDeleteComment ? handleDeleteComment : undefined}
                    />
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-gray-500">
                  還沒有留言，成為第一個留言的人吧！
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ContentCommentSheet
