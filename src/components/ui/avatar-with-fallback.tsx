'use client'

import { useState, useEffect, ReactNode } from 'react'

interface AvatarWithFallbackProps {
  src?: string | null
  alt: string
  size?: string
  className?: string
  fallback: ReactNode
}

/**
 * 可處理圖片載入失敗的頭像組件
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
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      className={`${size} rounded-full object-cover ${className}`}
      onError={() => setHasError(true)}
    />
  )
}
