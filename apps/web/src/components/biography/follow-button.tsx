'use client'

import { useState, useEffect } from 'react'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { biographyService } from '@/lib/api/services'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface FollowButtonProps {
  biographyId: string
  initialFollowing?: boolean
  onFollowChange?: (_isFollowing: boolean) => void
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

export function FollowButton({
  biographyId,
  initialFollowing = false,
  onFollowChange,
  className,
  size = 'default',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  // Fetch follow status when component mounts or biographyId changes
  useEffect(() => {
    const fetchFollowStatus = async () => {
      try {
        const response = await biographyService.getFollowStatus(biographyId)
        if (response.success && response.data) {
          setIsFollowing(response.data.following)
        }
      } catch (error) {
        console.error('Failed to fetch follow status:', error)
      }
    }

    fetchFollowStatus()
  }, [biographyId])

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    setIsLoading(true)
    try {
      if (isFollowing) {
        await biographyService.unfollow(biographyId)
        setIsFollowing(false)
        onFollowChange?.(false)
      } else {
        await biographyService.follow(biographyId)
        setIsFollowing(true)
        onFollowChange?.(true)
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isFollowing ? 'secondary' : 'primary'}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'min-w-[100px]',
        isFollowing && 'hover:bg-red-50 hover:text-red-600 hover:border-red-300',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-1" />
          取消追蹤
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" />
          追蹤
        </>
      )}
    </Button>
  )
}
