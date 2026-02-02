/**
 * UnsavedChangesPrompt 組件
 *
 * 未儲存變更提示，對應 apps/web/src/components/shared/unsaved-changes-prompt.tsx
 */
import React, { useCallback, useEffect, useRef } from 'react'
import { Alert, BackHandler } from 'react-native'

interface UnsavedChangesPromptProps {
  /** 是否有未儲存的變更 */
  hasChanges: boolean
  /** 提示標題 */
  title?: string
  /** 提示訊息 */
  message?: string
  /** 確認離開的回調 */
  onConfirmLeave?: () => void
  /** 取消離開的回調 */
  onCancelLeave?: () => void
}

/**
 * 未儲存變更提示組件
 * 當用戶嘗試離開有未儲存變更的頁面時顯示警告
 */
export function UnsavedChangesPrompt({
  hasChanges,
  title = '放棄變更？',
  message = '您有未儲存的變更，確定要離開嗎？',
  onConfirmLeave,
  onCancelLeave,
}: UnsavedChangesPromptProps) {
  const showPrompt = useCallback(() => {
    Alert.alert(
      title,
      message,
      [
        {
          text: '取消',
          style: 'cancel',
          onPress: onCancelLeave,
        },
        {
          text: '離開',
          style: 'destructive',
          onPress: onConfirmLeave,
        },
      ],
      { cancelable: true }
    )
  }, [title, message, onConfirmLeave, onCancelLeave])

  // 攔截 Android 返回鍵
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (hasChanges) {
          showPrompt()
          return true // 阻止默認返回行為
        }
        return false // 允許默認返回行為
      }
    )

    return () => backHandler.remove()
  }, [hasChanges, showPrompt])

  // 這個組件不渲染任何 UI，只處理返回鍵攔截
  return null
}

/**
 * Hook: useUnsavedChanges
 * 用於追蹤未儲存變更並提供提示功能
 */
export function useUnsavedChanges(hasChanges: boolean) {
  const showPromptAndWait = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!hasChanges) {
        resolve(true)
        return
      }

      Alert.alert(
        '放棄變更？',
        '您有未儲存的變更，確定要離開嗎？',
        [
          {
            text: '取消',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: '離開',
            style: 'destructive',
            onPress: () => resolve(true),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      )
    })
  }, [hasChanges])

  return {
    showPromptAndWait,
  }
}

export default UnsavedChangesPrompt
