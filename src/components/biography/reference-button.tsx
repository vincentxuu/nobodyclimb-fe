'use client'

import { useState } from 'react'
import { BookmarkPlus, BookmarkMinus, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { bucketListService } from '@/lib/api/services'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ReferenceButtonProps {
  itemId: string
  initialReferenced?: boolean
  initialCount?: number
  onReferenceChange?: (_isReferenced: boolean, _count: number) => void
  className?: string
  showCount?: boolean
  variant?: 'button' | 'icon'
}

export function ReferenceButton({
  itemId,
  initialReferenced = false,
  initialCount = 0,
  onReferenceChange,
  className,
  showCount = true,
  variant = 'button',
}: ReferenceButtonProps) {
  const [isReferenced, setIsReferenced] = useState(initialReferenced)
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
      if (isReferenced) {
        await bucketListService.cancelReference(itemId)
        const newCount = Math.max(0, count - 1)
        setIsReferenced(false)
        setCount(newCount)
        onReferenceChange?.(false, newCount)
      } else {
        await bucketListService.addReference(itemId)
        const newCount = count + 1
        setIsReferenced(true)
        setCount(newCount)
        onReferenceChange?.(true, newCount)
      }
    } catch (error) {
      console.error('Failed to toggle reference:', error)
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
          'inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-500 transition-colors',
          isReferenced && 'text-amber-500',
          className
        )}
        title={isReferenced ? '從我的清單移除' : '加入我的清單'}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isReferenced ? (
          <BookmarkMinus className="h-4 w-4" />
        ) : (
          <BookmarkPlus className="h-4 w-4" />
        )}
        {showCount && <span>{count}</span>}
      </button>
    )
  }

  return (
    <Button
      variant={isReferenced ? 'secondary' : 'ghost'}
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'gap-1',
        isReferenced && 'text-amber-500 border-amber-200 hover:bg-amber-50',
        className
      )}
      title={isReferenced ? '從我的清單移除' : '加入我的清單'}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isReferenced ? (
        <>
          <BookmarkMinus className="h-4 w-4" />
          已加入
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          我也想
        </>
      )}
      {showCount && !isReferenced && count > 0 && (
        <span className="ml-1 text-xs text-gray-400">({count})</span>
      )}
    </Button>
  )
}
