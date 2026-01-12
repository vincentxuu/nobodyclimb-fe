'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  /** 載入中顯示的文字 */
  text?: string
  /** 是否為全頁面載入（置中顯示） */
  fullPage?: boolean
  /** 自訂樣式類名 */
  className?: string
}

export function LoadingSpinner({
  text,
  fullPage = false,
  className,
}: LoadingSpinnerProps) {
  const content = (
    <div className={`flex items-center justify-center ${className ?? ''}`}>
      <Loader2 className="h-8 w-8 animate-spin text-text-subtle" />
      {text && <span className="ml-2 text-text-subtle">{text}</span>}
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
