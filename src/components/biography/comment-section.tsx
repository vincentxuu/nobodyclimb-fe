'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Send, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { bucketListService } from '@/lib/api/services'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface Comment {
  id: string
  bucket_list_item_id: string
  user_id: string
  content: string
  created_at: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface CommentSectionProps {
  itemId: string
  initialCount?: number
  className?: string
}

export function CommentSection({
  itemId,
  initialCount = 0,
  className,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const [count, setCount] = useState(initialCount)
  const { isLoggedIn, user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      loadComments()
    }
  }, [isOpen, itemId])

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const response = await bucketListService.getComments(itemId)
      if (response.success && response.data) {
        setComments(response.data)
        setCount(response.data.length)
      }
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoggedIn) {
      router.push('/auth/login')
      return
    }

    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      const response = await bucketListService.addComment(itemId, content.trim())
      if (response.success && response.data) {
        setComments([response.data as Comment, ...comments])
        setContent('')
        setCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      await bucketListService.deleteComment(commentId)
      setComments(comments.filter((c) => c.id !== commentId))
      setCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to delete comment:', error)
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

  return (
    <div className={cn('space-y-4', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        <span>{count} 則留言</span>
      </button>

      {isOpen && (
        <div className="space-y-4 mt-4 border-t pt-4">
          {isLoggedIn && (
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

          {!isLoggedIn && (
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
                      <img
                        src={comment.avatar_url}
                        alt={comment.display_name || comment.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                        {(comment.display_name || comment.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.display_name || comment.username}
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
      )}
    </div>
  )
}
