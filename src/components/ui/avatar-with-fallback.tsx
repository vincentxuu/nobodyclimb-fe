'use client'

import { useState, useEffect, ReactNode } from 'react'
import Image from 'next/image'

interface AvatarWithFallbackProps {
  src?: string | null
  alt: string
  size?: string
  className?: string
  fallback: ReactNode
}

/**
 * 可處理圖片載入失敗的頭像組件
 * 使用 Next.js Image 進行圖片優化
 * 當圖片無法載入時會自動顯示 fallback 內容
 */
export function AvatarWithFallback({
  src,
  alt,
  size = 'w-10 h-10',
  className = '',
  fallback,
}: AvatarWithFallbackProps) {
  const [hasError, setHasError] = useState(false)

  // 當 src 變更時重置錯誤狀態
  useEffect(() => {
    setHasError(false)
  }, [src])

  // 檢查是否有有效的圖片 URL
  const hasValidSrc = src && src.trim() !== '' && !hasError

  if (!hasValidSrc) {
    return <>{fallback}</>
  }

  return (
    <div className={`relative ${size} overflow-hidden rounded-full ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="96px"
        onError={() => setHasError(true)}
        unoptimized={src.startsWith('http')}
      />
    </div>
  )
}
