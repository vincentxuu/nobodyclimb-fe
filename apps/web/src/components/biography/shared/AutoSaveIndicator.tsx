'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import type { SaveStatus } from '@/lib/types/biography-v2'

interface AutoSaveIndicatorProps {
  /** 儲存狀態 */
  status: SaveStatus
  /** 最後儲存時間 */
  lastSavedAt: Date | null
  /** 錯誤訊息 */
  error?: string
  /** 自訂樣式 */
  className?: string
}

/**
 * 自動儲存指示器
 *
 * 顯示自動儲存的狀態
 */
export function AutoSaveIndicator({
  status,
  lastSavedAt,
  error,
  className,
}: AutoSaveIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('')

  // 計算相對時間
  useEffect(() => {
    if (!lastSavedAt) return

    const updateTimeAgo = () => {
      const now = new Date()
      const diffInSeconds = Math.floor(
        (now.getTime() - lastSavedAt.getTime()) / 1000
      )

      if (diffInSeconds < 5) {
        setTimeAgo('剛剛')
      } else if (diffInSeconds < 60) {
        setTimeAgo(`${diffInSeconds} 秒前`)
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        setTimeAgo(`${minutes} 分鐘前`)
      } else {
        const hours = Math.floor(diffInSeconds / 3600)
        setTimeAgo(`${hours} 小時前`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 10000) // 每 10 秒更新

    return () => clearInterval(interval)
  }, [lastSavedAt])

  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return (
          <span className="flex items-center gap-1.5 text-[#6D6C6C]">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">儲存中...</span>
          </span>
        )
      case 'saved':
        return (
          <span className="flex items-center gap-1.5 text-brand-dark">
            <Check size={16} />
            <span className="text-sm">已儲存</span>
          </span>
        )
      case 'error':
        return (
          <span className="flex items-center gap-1.5 text-red-600">
            <AlertCircle size={16} />
            <span className="text-sm">{error || '儲存失敗，請重試'}</span>
          </span>
        )
      case 'idle':
      default:
        if (lastSavedAt) {
          return (
            <span className="text-sm text-[#6D6C6C]">
              上次儲存：{timeAgo}
            </span>
          )
        }
        return null
    }
  }

  return <div className={cn('flex items-center', className)}>{getStatusDisplay()}</div>
}

/**
 * 儲存狀態 Hook
 *
 * 管理自動儲存的狀態
 */
export function useSaveStatus(initialStatus: SaveStatus = 'idle') {
  const [status, setStatus] = useState<SaveStatus>(initialStatus)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | undefined>()

  const setSaving = () => {
    setStatus('saving')
    setError(undefined)
  }

  const setSaved = () => {
    setStatus('saved')
    setLastSavedAt(new Date())
    setError(undefined)
    // 2 秒後恢復為 idle
    setTimeout(() => {
      setStatus('idle')
    }, 2000)
  }

  const setErrorStatus = (message: string) => {
    setStatus('error')
    setError(message)
  }

  const reset = () => {
    setStatus('idle')
    setError(undefined)
  }

  return {
    status,
    lastSavedAt,
    error,
    setSaving,
    setSaved,
    setError: setErrorStatus,
    reset,
  }
}

export default AutoSaveIndicator
