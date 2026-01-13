'use client'

import { useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { bucketListService } from '@/lib/api/services'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  itemId: string
  initialLiked?: boolean
  initialCount?: number
  onLikeChange?: (isLiked: boolean, count: number) => void
  className?: string
  showCount?: boolean
  variant?: 'button' | 'icon'
}

export function LikeButton({
  itemId,
  initialLiked = false,
  initialCount = 0,
  onLikeChange,
  className,
  showCount = true,
  variant = 'button',
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    setIsLoading(true)
    try {
      if (isLiked) {
        await bucketListService.unlikeItem(itemId)
        const newCount = Math.max(0, count - 1)
        setIsLiked(false)
        setCount(newCount)
        onLikeChange?.(false, newCount)
      } else {
        await bucketListService.likeItem(itemId)
        const newCount = count + 1
        setIsLiked(true)
        setCount(newCount)
        onLikeChange?.(true, newCount)
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors',
          isLiked && 'text-red-500',
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart
            className={cn('h-4 w-4', isLiked && 'fill-current')}
          />
        )}
        {showCount && <span>{count}</span>}
      </button>
    )
  }

  return (
    <Button
      variant={isLiked ? 'secondary' : 'ghost'}
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'gap-1',
        isLiked && 'text-red-500 border-red-200 hover:bg-red-50',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
      )}
      {showCount && count}
    </Button>
  )
}
