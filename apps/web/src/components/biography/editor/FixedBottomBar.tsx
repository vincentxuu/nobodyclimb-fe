'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Eye, Loader2 } from 'lucide-react'
import type { SaveStatus } from '@/lib/types/biography-v2'

interface FixedBottomBarProps {
  /** 儲存狀態 */
  saveStatus: SaveStatus
  /** 預覽連結 */
  previewHref: string
  /** 發布回調 */
  onPublish?: () => void
  /** 是否可以發布 */
  canPublish?: boolean
  /** 是否正在發布 */
  isPublishing?: boolean
  /** 完成進度百分比 */
  progress?: number
  /** 自訂樣式 */
  className?: string
}

/**
 * 固定底部操作列
 *
 * 顯示儲存狀態和預覽/發布按鈕
 */
export function FixedBottomBar({
  saveStatus,
  previewHref,
  onPublish,
  canPublish = true,
  isPublishing = false,
  progress = 0,
  className,
}: FixedBottomBarProps) {
  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="flex items-center gap-1 text-[#6D6C6C]">
            <Loader2 size={14} className="animate-spin" />
            儲存中...
          </span>
        )
      case 'saved':
        return <span className="text-brand-dark">已儲存</span>
      case 'error':
        return <span className="text-red-500">儲存失敗</span>
      case 'idle':
      default:
        return <span className="text-[#8E8C8C]">自動儲存已啟用</span>
    }
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-white border-t border-[#DBD8D8] z-40',
        className
      )}
    >
      {/* Progress Bar */}
      {progress > 0 && progress < 100 && (
        <div className="h-1 bg-[#EBEAEA]">
          <div
            className="h-full bg-brand-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-3 flex items-center justify-between max-w-4xl mx-auto">
        {/* Left: Save Status */}
        <div className="text-sm">{getSaveStatusText()}</div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Preview Button - 在新分頁開啟，方便返回編輯器 */}
          <Link
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[#3F3D3D] border border-[#B6B3B3] rounded-lg hover:bg-[#F5F5F5] transition-colors"
          >
            <Eye size={16} />
            預覽
          </Link>

          {/* Publish Button */}
          {onPublish && (
            <button
              type="button"
              onClick={onPublish}
              disabled={!canPublish || isPublishing}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1',
                canPublish
                  ? 'bg-brand-dark text-white hover:bg-brand-dark-hover'
                  : 'bg-[#EBEAEA] text-[#B6B3B3] cursor-not-allowed'
              )}
            >
              {isPublishing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  發布中...
                </>
              ) : (
                '發布'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Safe area for mobile */}
      <div className="pb-safe" />
    </div>
  )
}

/**
 * 底部空白佔位
 *
 * 用於防止內容被固定底部欄擋住
 */
export function BottomBarSpacer() {
  return <div className="h-20" />
}

export default FixedBottomBar
