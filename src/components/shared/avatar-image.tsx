import Image from 'next/image'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarImageProps {
  avatarUrl: string | null | undefined
  altText: string
  iconSize?: number
  containerClassName?: string
}

// 檢查是否為 SVG 或 dicebear URL（不需要 Next.js 圖片優化）
function shouldSkipOptimization(url: string): boolean {
  return url.includes('dicebear.com') || url.endsWith('.svg')
}

export function AvatarImage({
  avatarUrl,
  altText,
  iconSize = 64,
  containerClassName,
}: AvatarImageProps) {
  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {avatarUrl ? (
        shouldSkipOptimization(avatarUrl) ? (
          // SVG 或 dicebear 使用原生 img 標籤，避免 Next.js 優化導致 400 錯誤
          <img
            src={avatarUrl}
            alt={altText}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <Image
            src={avatarUrl}
            alt={altText}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#E8E6E3]">
          <User size={iconSize} className="text-[#8E8C8C]" />
        </div>
      )}
    </div>
  )
}
