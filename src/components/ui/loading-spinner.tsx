'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  /** 大小: sm (h-4 w-4), md (h-6 w-6), lg (h-8 w-8), xl (h-12 w-12) */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** 載入中顯示的文字 */
  text?: string
  /** 自定義 className */
  className?: string
  /** 是否顯示在按鈕中 (帶有 mr-2) */
  inline?: boolean
  /** 是否為全頁面載入（置中顯示） */
  fullPage?: boolean
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

/**
 * 統一的 Loading Spinner 組件
 * 用於顯示載入狀態
 */
export function LoadingSpinner({
  size = 'lg',
  text,
  className,
  inline = false,
  fullPage = false,
}: LoadingSpinnerProps) {
  const content = (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2
        className={cn(
          'animate-spin text-muted-foreground',
          sizeMap[size],
          inline && 'mr-2'
        )}
      />
      {text && <span className="ml-2 text-muted-foreground">{text}</span>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}

/**
 * 全頁載入狀態組件
 * 居中顯示 spinner
 */
export function LoadingPage({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-h-[50vh] items-center justify-center', className)}>
      <LoadingSpinner size="lg" />
    </div>
  )
}

export default LoadingSpinner
