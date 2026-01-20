'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, MessageCircle, Send, Trash2 } from 'lucide-react'
import { postService } from '@/lib/api/services'
import { useToast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/store/authStore'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

// 評論類型定義
interface CommentData {
  id: string
  content: string
  created_at: string
  user_id: string
  username: string
  display_name?: string
  avatar_url?: string
}

interface CommentSectionProps {
  postId: string
  isLoggedIn?: boolean
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

// 單個評論元件
const CommentItem = ({
  comment,
  currentUserId,
  onDelete,
}: {
  comment: CommentData
  currentUserId?: string
  onDelete: (id: string) => void
}) => {
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
          {currentUserId === comment.user_id && (
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

// 評論輸入框元件
const CommentForm = ({
  onSubmit,
  isSubmitting,
  isLoggedIn,
}: {
  // eslint-disable-next-line no-unused-vars
  onSubmit: (_content: string) => Promise<void>
  isSubmitting: boolean
  isLoggedIn: boolean
}) => {
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

// 空評論狀態
const EmptyComments = () => (
  <p className="py-4 text-center text-sm text-gray-500">
    還沒有留言，成為第一個留言的人吧！
  </p>
)

// 載入狀態
const LoadingComments = () => (
  <div className="flex justify-center py-4">
    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
  </div>
)

export function CommentSection({ postId, isLoggedIn = false }: CommentSectionProps) {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [comments, setComments] = useState<CommentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [totalComments, setTotalComments] = useState(0)

  // 獲取評論列表
  const fetchComments = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await postService.getComments(postId)
      if (response.success && response.data) {
        setComments(response.data as unknown as CommentData[])
        setTotalComments((response.data as unknown as CommentData[]).length)
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    } finally {
      setIsLoading(false)
    }
  }, [postId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // 提交評論
  const handleSubmitComment = async (content: string) => {
    setIsSubmitting(true)
    try {
      const response = await postService.addComment(postId, content)
      if (response.success && response.data) {
        const newComment = response.data as unknown as CommentData
        setComments([newComment, ...comments])
        setTotalComments((prev) => prev + 1)
        toast({
          title: '留言發表成功',
          description: '感謝你的分享！',
        })
      }
    } catch (err) {
      console.error('Failed to submit comment:', err)
      toast({
        title: '留言發表失敗',
        description: '請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 刪除評論
  const handleDeleteComment = async (commentId: string) => {
    try {
      await postService.deleteComment(postId, commentId)
      setComments(comments.filter((c) => c.id !== commentId))
      setTotalComments((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to delete comment:', err)
      toast({
        title: '刪除留言失敗',
        description: '請稍後再試',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="mt-8 border-t pt-6">
      {/* Header */}
      <button className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700">
        <MessageCircle className="h-4 w-4" />
        <span>{totalComments} 則留言</span>
      </button>

      <div className="space-y-4">
        {/* Comment Form */}
        <CommentForm
          onSubmit={handleSubmitComment}
          isSubmitting={isSubmitting}
          isLoggedIn={isLoggedIn}
        />

        {/* Comments List */}
        {isLoading ? (
          <LoadingComments />
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={user?.id}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
        ) : (
          <EmptyComments />
        )}
      </div>
    </div>
  )
}
