'use client'

import { AxiosError } from 'axios'
import { Loader2, Mountain } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { bucketListService } from '@/lib/api/services'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

interface LikeButtonProps {
  itemId: string
  initialLiked?: boolean
  initialCount?: number
  onLikeChange?: (_isLiked: boolean, _count: number) => void
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
  const { status } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('BiographyPage')

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (status !== 'signIn') {
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
      const axiosError = error as AxiosError<{ message?: string }>
      const errorMessage = axiosError.response?.data?.message || t('operationFailedDesc')
      toast({
        title: t('operationFailed'),
        description: errorMessage,
        variant: 'destructive',
      })
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
          'inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 transition-colors',
          isLiked && 'text-emerald-600',
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mountain className={cn('h-4 w-4', isLiked && 'fill-current')} />
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
        isLiked && 'text-emerald-600 border-emerald-200 hover:bg-emerald-50',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mountain className={cn('h-4 w-4', isLiked && 'fill-current')} />
      )}
      {showCount && count}
    </Button>
  )
}
