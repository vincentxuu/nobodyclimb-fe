'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Lock, ArrowRight, Mountain } from 'lucide-react'

interface PrivateEmptyStateProps {
  /** 自訂樣式 */
  className?: string
}

/**
 * 私密人物誌空狀態頁面
 *
 * 當訪客訪問設為私密的人物誌時顯示
 */
export function PrivateEmptyState({ className }: PrivateEmptyStateProps) {
  return (
    <div
      className={cn(
        'min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center',
        className
      )}
    >
      {/* Icon */}
      <div className="relative mb-8">
        {/* 背景圓圈 */}
        <div className="w-32 h-32 rounded-full bg-[#F5F5F5] flex items-center justify-center">
          <Lock className="w-12 h-12 text-[#8E8C8C]" />
        </div>
        {/* 裝飾小圓 */}
        <div className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center">
          <Mountain className="w-4 h-4 text-brand-dark" />
        </div>
      </div>

      {/* 標題 */}
      <h1 className="text-2xl font-bold text-[#1B1A1A] mb-3">
        這位岩友的人物誌是私密的
      </h1>

      {/* 說明 */}
      <p className="text-[#6D6C6C] max-w-md mb-2">
        他們可能正在準備中，或選擇保持低調。
      </p>
      <p className="text-[#8E8C8C] text-sm max-w-md mb-8">
        每個人都有自己的節奏，尊重他們的選擇。
      </p>

      {/* CTA 按鈕 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/biography"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-dark text-white font-medium hover:bg-brand-dark-hover transition-colors"
        >
          探索其他岩友的故事
          <ArrowRight size={18} />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#B6B3B3] text-[#3F3D3D] font-medium hover:bg-[#F5F5F5] transition-colors"
        >
          回到首頁
        </Link>
      </div>

      {/* 底部提示 */}
      <div className="mt-12 p-4 bg-brand-accent/10 rounded-lg max-w-sm">
        <p className="text-sm text-[#3F3D3D]">
          想建立自己的人物誌嗎？記錄攀岩故事，與社群分享你的經歷。
        </p>
        <Link
          href="/auth/login"
          className="inline-block mt-2 text-sm text-brand-dark font-medium hover:underline"
        >
          立即開始 &rarr;
        </Link>
      </div>
    </div>
  )
}

export default PrivateEmptyState
