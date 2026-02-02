import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { XStack, Text } from 'tamagui'
import { Check, AlertCircle } from 'lucide-react-native'
import { COLORS } from '@nobodyclimb/constants'
import type { SaveStatus } from '@nobodyclimb/types'

interface AutoSaveIndicatorProps {
  /** 儲存狀態 */
  status: SaveStatus
  /** 最後儲存時間 */
  lastSavedAt: Date | null
  /** 錯誤訊息 */
  error?: string
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
          <XStack alignItems="center" gap="$1.5">
            <ActivityIndicator size="small" color={COLORS.text.muted} />
            <Text fontSize={14} color={COLORS.text.muted}>
              儲存中...
            </Text>
          </XStack>
        )
      case 'saved':
        return (
          <XStack alignItems="center" gap="$1.5">
            <Check size={16} color={COLORS.brand.dark} />
            <Text fontSize={14} color={COLORS.brand.dark}>
              已儲存
            </Text>
          </XStack>
        )
      case 'error':
        return (
          <XStack alignItems="center" gap="$1.5">
            <AlertCircle size={16} color={COLORS.status.error} />
            <Text fontSize={14} color={COLORS.status.error}>
              {error || '儲存失敗，請重試'}
            </Text>
          </XStack>
        )
      case 'idle':
      default:
        if (lastSavedAt) {
          return (
            <Text fontSize={14} color={COLORS.text.muted}>
              上次儲存：{timeAgo}
            </Text>
          )
        }
        return null
    }
  }

  return <View>{getStatusDisplay()}</View>
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
