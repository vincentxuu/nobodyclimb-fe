'use client'

import Image from 'next/image'
import { getDefaultAvatarUrl, isSvgUrl } from '@/lib/utils/image'

interface ProfileAvatarProps {
  src?: string | null
  name: string
  alt?: string
  size?: number
  className?: string
  priority?: boolean
}

/**
 * 可重用的頭像元件
 * - 自動處理 SVG 和一般圖片的渲染差異
 * - 當沒有圖片時自動使用 DiceBear 預設頭像
 */
export function ProfileAvatar({
  src,
  name,
  alt,
  size = 160,
  className = 'h-full w-full object-cover',
  priority = false,
}: ProfileAvatarProps) {
  const avatarUrl = src || getDefaultAvatarUrl(name || 'anonymous')
  const altText = alt || `${name} 的頭像`

  if (isSvgUrl(avatarUrl)) {
    return <img src={avatarUrl} alt={altText} className={className} />
  }

  return (
    <Image
      src={avatarUrl}
      alt={altText}
      fill
      className={className}
      sizes={`${size}px`}
      priority={priority}
    />
  )
}
