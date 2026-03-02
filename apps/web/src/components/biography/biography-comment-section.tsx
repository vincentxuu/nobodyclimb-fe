'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageCircle, Send, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { biographyService } from '@/lib/api/services'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { AxiosError } from 'axios'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface BiographyComment {
  id: string
  biography_id: string
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  content: string
  created_at: string
}

interface BiographyCommentSectionProps {
  biographyId: string
  initialCount?: number
  className?: string
  defaultOpen?: boolean
  isEmbedded?: boolean
  onCountChange?: (_count: number) => void
}

/**
 * 人物誌評論區組件
 */
export function BiographyCommentSection({
  biographyId,
  initialCount = 0,
  className,
  defaultOpen = false,
  isEmbedded = false,
  onCountChange,
}: BiographyCommentSectionProps) {
  const [comments, setComments] = useState<BiographyComment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [content, setContent] = useState('')
  const [count, setCount] = useState(initialCount)
  const { status, user } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()

  const loadComments = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await biographyService.getComments(biographyId)
      if (response.success && response.data) {
        setComments(response.data)
        const newCount = response.data.length
        setCount(newCount)
        onCountChange?.(newCount)
      }
    } catch (error) {
      console.error('Failed to load comments:', error)
      const axiosError = error as AxiosError<{ message?: string }>
      const errorMessage = axiosError.response?.data?.message || '無法載入留言，請稍後再試'
      toast({
        title: '載入失敗',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [biographyId, toast, onCountChange])

  // 初始化時載入評論數（如果有 onCountChange 回調）
  useEffect(() => {
    if (onCountChange) {
      loadComments()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 當展開時載入評論
  useEffect(() => {
    if (isOpen || isEmbedded) {
      loadComments()
    }
  }, [isOpen, isEmbedded, loadComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status !== 'signIn') {
      router.push('/auth/login')
      return
    }

    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      const response = await biographyService.addComment(biographyId, content.trim())
      if (response.success && response.data) {
        setComments([response.data, ...comments])
        setContent('')
        const newCount = count + 1
        setCount(newCount)
        onCountChange?.(newCount)
        toast({
          title: '留言成功',
          description: '你的留言已發布',
        })
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
      const axiosError = error as AxiosError<{ message?: string }>
      const errorMessage = axiosError.response?.data?.message || '留言失敗，請稍後再試'
      toast({
        title: '留言失敗',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      await biographyService.deleteComment(commentId)
      setComments(comments.filter((c) => c.id !== commentId))
      const newCount = Math.max(0, count - 1)
      setCount(newCount)
      onCountChange?.(newCount)
      toast({
        title: '刪除成功',
        description: '留言已刪除',
      })
    } catch (error) {
      console.error('Failed to delete comment:', error)
      const axiosError = error as AxiosError<{ message?: string }>
      const errorMessage = axiosError.response?.data?.message || '刪除留言失敗，請稍後再試'
      toast({
        title: '刪除失敗',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

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

  const getDisplayName = (comment: BiographyComment) => {
    return comment.display_name || comment.username || '匿名用戶'
  }

  // 如果是嵌入模式，直接返回评论内容
  if (isEmbedded) {
    return (
      <div className={cn('space-y-4', className)}>
        {status === 'signIn' && (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="寫下你的留言..."
              className="flex-1 min-h-[60px] resize-none"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !content.trim()}
              className="self-end"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        )}

        {status !== 'signIn' && (
          <p className="text-sm text-gray-500">
            <button
              onClick={() => router.push('/auth/login')}
              className="text-brand-600 hover:underline"
            >
              登入
            </button>
            {' '}後才能留言
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            還沒有留言，成為第一個留言的人吧！
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                  {comment.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={comment.avatar_url}
                      alt={getDisplayName(comment)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                      {getDisplayName(comment).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {getDisplayName(comment)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(comment.created_at)}
                    </span>
                    {user?.id === comment.user_id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-gray-400 hover:text-red-500 ml-auto"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1 break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 非嵌入模式，显示按钮和浮层
  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn('flex items-center gap-1.5 hover:text-brand-dark transition-colors', className)}
      >
        <MessageCircle className="h-4 w-4" />
        <span>{count}</span>
      </button>

      {isOpen && (
        <div className="absolute left-4 right-4 top-full mt-4 bg-white border border-gray-200 rounded-lg shadow-lg p-6 z-50 max-h-[600px] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            {status === 'signIn' && (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="寫下你的留言..."
                  className="flex-1 min-h-[60px] resize-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !content.trim()}
                  className="self-end"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            )}

            {status !== 'signIn' && (
              <p className="text-sm text-gray-500">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="text-brand-600 hover:underline"
                >
                  登入
                </button>
                {' '}後才能留言
              </p>
            )}

            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                還沒有留言，成為第一個留言的人吧！
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                      {comment.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={comment.avatar_url}
                          alt={getDisplayName(comment)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                          {getDisplayName(comment).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {getDisplayName(comment)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTime(comment.created_at)}
                        </span>
                        {user?.id === comment.user_id && (
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-gray-400 hover:text-red-500 ml-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1 break-words">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
