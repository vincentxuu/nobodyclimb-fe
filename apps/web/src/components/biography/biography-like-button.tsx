'use client'

import { Loader2, Mountain } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { biographyService } from '@/lib/api/services'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

interface BiographyLikeButtonProps {
  biographyId: string
  initialLiked?: boolean
  initialCount?: number
  onLikeChange?: (_isLiked: boolean, _count: number) => void
  className?: string
  showCount?: boolean
}

export function BiographyLikeButton({
  biographyId,
  initialLiked = false,
  initialCount = 0,
  onLikeChange,
  className,
  showCount = true,
}: BiographyLikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const { status } = useAuthStore()
  const router = useRouter()

  // Fetch initial like status when component mounts
  useEffect(() => {
    if (hasFetched) return

    const fetchLikeStatus = async () => {
      try {
        const response = await biographyService.getLikeStatus(biographyId)
        if (response.success && response.data) {
          setIsLiked(response.data.liked)
          setCount(response.data.likes)
        }
      } catch (error) {
        console.error('Failed to fetch like status:', error)
      } finally {
        setHasFetched(true)
      }
    }

    fetchLikeStatus()
  }, [biographyId, hasFetched])

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (status !== 'signIn') {
      router.push('/auth/login')
      return
    }

    setIsLoading(true)
    try {
      const response = await biographyService.toggleLike(biographyId)
      if (response.success && response.data) {
        setIsLiked(response.data.liked)
        setCount(response.data.likes)
        onLikeChange?.(response.data.liked, response.data.likes)
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
