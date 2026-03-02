'use client'

import { cn } from '@/lib/utils'
import { Ghost, EyeOff } from 'lucide-react'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AnonymousAvatarProps {
  /** 尺寸 */
  size?: AvatarSize
  /** 變體樣式 */
  variant?: 'default' | 'minimal'
  /** 自訂樣式 */
  className?: string
}

const sizeClasses: Record<AvatarSize, { container: string; icon: string }> = {
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4' },
  md: { container: 'w-12 h-12', icon: 'w-6 h-6' },
  lg: { container: 'w-20 h-20', icon: 'w-10 h-10' },
  xl: { container: 'w-32 h-32 md:w-40 md:h-40', icon: 'w-16 h-16 md:w-20 md:h-20' },
}

/**
 * 匿名頭像組件
 *
 * 用於顯示匿名用戶的佔位頭像
 */
export function AnonymousAvatar({
  size = 'md',
  variant = 'default',
  className,
}: AnonymousAvatarProps) {
  const sizeClass = sizeClasses[size]

  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'rounded-full bg-[#F5F5F5] flex items-center justify-center',
          sizeClass.container,
          className
        )}
      >
        <Ghost className={cn('text-[#8E8C8C]', sizeClass.icon)} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-[#E8E6E6] to-[#D4D1D1] flex items-center justify-center border-2 border-white shadow-inner',
        sizeClass.container,
        className
      )}
    >
      <EyeOff className={cn('text-[#8E8C8C]', sizeClass.icon)} />
    </div>
  )
}

/**
 * 匿名名稱組件
 *
 * 用於顯示匿名用戶的名稱
 */
interface AnonymousNameProps {
  /** 自訂名稱 */
  name?: string
  /** 自訂樣式 */
  className?: string
}

export function AnonymousName({
  name = '匿名岩友',
  className,
}: AnonymousNameProps) {
  return (
    <span className={cn('text-[#6D6C6C] italic', className)}>
      {name}
    </span>
  )
}

/**
 * 匿名標籤組件
 *
 * 用於標示匿名身份
 */
interface AnonymousBadgeProps {
  /** 自訂樣式 */
  className?: string
}

export function AnonymousBadge({ className }: AnonymousBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5F5F5] text-xs text-[#8E8C8C]',
        className
      )}
    >
      <EyeOff size={12} />
      匿名分享
    </span>
  )
}

export default AnonymousAvatar
