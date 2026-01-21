'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Heart, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/use-toast'

interface ContentLikeButtonProps {
  /** 是否已按讚 */
  isLiked: boolean
  /** 按讚數 */
  likeCount: number
  /** 按讚/取消按讚回呼 */
  onToggle: () => Promise<{ liked: boolean; like_count: number }>
  /** 大小 */
  size?: 'sm' | 'md'
  /** 自訂樣式 */
  className?: string
}

/**
 * 內容按讚按鈕
 * 用於一句話、小故事、核心故事的按讚功能
 */
export function ContentLikeButton({
  isLiked,
  likeCount,
  onToggle,
  size = 'sm',
  className,
}: ContentLikeButtonProps) {
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const [liked, setLiked] = useState(isLiked)
  const [count, setCount] = useState(likeCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: '請先登入',
        description: '登入後才能按讚',
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
    } catch (error) {
      // Rollback on error
      setLiked(liked)
      setCount(count)
      console.error('Failed to toggle like:', error)
      toast({
        title: '操作失敗',
        description: '請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const iconSize = size === 'sm' ? 14 : 16

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center gap-1 transition-colors',
        size === 'sm' ? 'text-xs' : 'text-sm',
        liked
          ? 'text-red-500 hover:text-red-600'
          : 'text-[#9D9B9B] hover:text-red-400',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isLoading ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : (
        <Heart
          size={iconSize}
          className={cn(liked && 'fill-current')}
        />
      )}
      {count > 0 && <span>{count}</span>}
    </button>
  )
}

export default ContentLikeButton
