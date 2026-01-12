'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, MessageCircle, User } from 'lucide-react'
import { postService } from '@/lib/api/services'
import { useToast } from '@/components/ui/use-toast'
import { AvatarWithFallback } from '@/components/ui/avatar-with-fallback'

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

// 單個評論元件
const CommentItem = ({ comment }: { comment: CommentData }) => {
  const displayName = comment.display_name || comment.username
  const formattedDate = new Date(comment.created_at).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex gap-4 border-b border-gray-100 py-4 last:border-b-0">
      {/* Avatar */}
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
        <AvatarWithFallback
          src={comment.avatar_url}
          alt={displayName}
          size="h-10 w-10"
          fallback={
            <div
              role="img"
              aria-label={displayName}
              className="flex h-full w-full items-center justify-center"
            >
              <User size={20} className="text-gray-400" />
            </div>
          }
        />
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-medium text-[#1B1A1A]">{displayName}</span>
          <span className="text-sm text-[#8E8C8C]">{formattedDate}</span>
        </div>
        <p className="whitespace-pre-wrap text-[#3F3D3D]">{comment.content}</p>
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
      <div className="rounded-lg bg-gray-50 p-4 text-center">
        <p className="mb-2 text-[#6D6C6C]">請先登入以發表評論</p>
        <Button
          variant="outline"
          className="border-[#1B1A1A] text-[#1B1A1A] hover:bg-[#F5F5F5]"
          onClick={() => (window.location.href = '/login')}
        >
          登入
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="分享你的想法..."
        className="min-h-[100px] resize-none border-[#DBD8D8] focus:border-[#1B1A1A] focus:ring-[#1B1A1A]"
        disabled={isSubmitting}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              發送中...
            </>
          ) : (
            '發表評論'
          )}
        </Button>
      </div>
    </form>
  )
}

// 空評論狀態
const EmptyComments = () => (
  <div className="py-8 text-center">
    <MessageCircle className="mx-auto mb-2 h-12 w-12 text-gray-300" />
    <p className="text-[#6D6C6C]">還沒有評論，成為第一個留言的人吧！</p>
  </div>
)

// 載入狀態
const LoadingComments = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-6 w-6 animate-spin text-[#6D6C6C]" />
    <span className="ml-2 text-[#6D6C6C]">載入評論中...</span>
  </div>
)

export function CommentSection({ postId, isLoggedIn = false }: CommentSectionProps) {
  const { toast } = useToast()
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
        // 重新獲取評論列表
        await fetchComments()
        toast({
          title: '評論發表成功',
          description: '感謝你的分享！',
        })
      }
    } catch (err) {
      console.error('Failed to submit comment:', err)
      toast({
        title: '評論發表失敗',
        description: '請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-12 rounded-lg bg-white p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h2 className="text-xl font-medium">評論</h2>
        <span className="text-[#6D6C6C]">({totalComments})</span>
      </div>

      {/* Comment Form */}
      <div className="mb-6">
        <CommentForm
          onSubmit={handleSubmitComment}
          isSubmitting={isSubmitting}
          isLoggedIn={isLoggedIn}
        />
      </div>

      {/* Divider */}
      <div className="mb-6 h-px bg-gray-200" />

      {/* Comments List */}
      {isLoading ? (
        <LoadingComments />
      ) : comments.length > 0 ? (
        <div>
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <EmptyComments />
      )}
    </div>
  )
}
