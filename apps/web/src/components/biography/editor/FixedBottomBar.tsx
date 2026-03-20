'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Eye, Loader2, Save } from 'lucide-react'
import type { SaveStatus } from '@/lib/types/biography-v2'

interface FixedBottomBarProps {
  /** 儲存狀態 */
  saveStatus: SaveStatus
  /** 預覽連結 */
  previewHref: string
  /** 手動儲存回調 */
  onManualSave?: () => void
  /** 是否有未儲存變更 */
  hasUnsavedChanges?: boolean
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
  /** 手機版精簡模式：隱藏儲存狀態與手動儲存 */
  compactOnMobile?: boolean
  /** 是否保留底部 safe-area padding */
  showSafeAreaPadding?: boolean
}

/**
 * 固定底部操作列
 *
 * 顯示儲存狀態和預覽/發布按鈕
 */
export function FixedBottomBar({
  saveStatus,
  previewHref,
  onManualSave,
  hasUnsavedChanges = false,
  onPublish,
  canPublish = true,
  isPublishing = false,
  progress = 0,
  className,
  compactOnMobile = false,
  showSafeAreaPadding = true,
}: FixedBottomBarProps) {
  const t = useTranslations('BiographyEditor')
  const mobileActionCount = onManualSave && onPublish ? 3 : onPublish || onManualSave ? 2 : 1

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="flex items-center gap-1 text-[#6D6C6C]">
            <Loader2 size={14} className="animate-spin" />
            {t('savingStatus')}
          </span>
        )
      case 'saved':
        return <span className="text-brand-dark">{t('savedStatus')}</span>
      case 'error':
        return <span className="text-red-500">{t('saveErrorStatus')}</span>
      case 'idle':
      default:
        return <span className="text-[#8E8C8C]">{t('autoSaveEnabled')}</span>
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
      <div
        className={cn(
          'mx-auto flex max-w-4xl items-center px-4 md:py-3',
          compactOnMobile ? 'justify-end py-2 md:justify-between' : 'justify-between py-3'
        )}
      >
        {/* Left: Save Status */}
        <div className={cn('text-sm', compactOnMobile && 'hidden md:block')}>{getSaveStatusText()}</div>

        {/* Right: Actions */}
        <div
          className={cn(
            'flex items-center gap-2',
            compactOnMobile && [
              'w-full md:w-auto',
              mobileActionCount === 3 && 'grid grid-cols-3 md:flex',
              mobileActionCount === 2 && 'grid grid-cols-2 md:flex',
            ]
          )}
        >
          {/* Manual Save Button */}
          {onManualSave && (
            <button
              type="button"
              onClick={onManualSave}
              disabled={!hasUnsavedChanges || saveStatus === 'saving'}
              className={cn(
                'flex items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                compactOnMobile && 'w-full px-3 py-1.5',
                hasUnsavedChanges && saveStatus !== 'saving'
                  ? 'border border-[#1B1A1A] text-[#1B1A1A] hover:bg-[#F5F5F5]'
                  : 'border border-[#DBD8D8] text-[#B6B3B3] cursor-not-allowed'
              )}
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('savingStatus')}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {t('saveButton')}
                </>
              )}
            </button>
          )}

          {/* Preview Button - 在新分頁開啟，方便返回編輯器 */}
          <Link
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center justify-center gap-1 rounded-lg border border-[#B6B3B3] font-medium text-[#3F3D3D] transition-colors hover:bg-[#F5F5F5]',
              compactOnMobile && 'w-full',
              compactOnMobile ? 'px-3 py-1.5 text-sm md:px-4 md:py-2' : 'px-4 py-2 text-sm'
            )}
          >
            <Eye size={16} />
            {t('previewButton')}
          </Link>

          {/* Publish Button */}
          {onPublish && (
            <button
              type="button"
              onClick={onPublish}
              disabled={!canPublish || isPublishing}
              className={cn(
                'flex items-center justify-center gap-1 rounded-lg font-medium transition-colors',
                compactOnMobile && 'w-full',
                compactOnMobile ? 'px-3 py-1.5 text-sm md:px-4 md:py-2' : 'px-4 py-2 text-sm',
                canPublish
                  ? 'bg-brand-dark text-white hover:bg-brand-dark-hover'
                  : 'bg-[#EBEAEA] text-[#B6B3B3] cursor-not-allowed'
              )}
            >
              {isPublishing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('publishingStatus')}
                </>
              ) : (
                t('publishButton')
              )}
            </button>
          )}
        </div>
      </div>

      {/* Safe area for mobile */}
      {showSafeAreaPadding && <div className="pb-safe" />}
    </div>
  )
}

/**
 * 底部空白佔位
 *
 * 用於防止內容被固定底部欄擋住
 */
export function BottomBarSpacer({ className }: { className?: string }) {
  return <div className={cn('h-20', className)} />
}

export default FixedBottomBar
