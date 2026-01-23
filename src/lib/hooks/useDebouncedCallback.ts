import { useCallback, useEffect, useRef } from 'react'

interface DebouncedOptions {
  /** 延遲時間（毫秒） */
  delay: number
  /** 最大等待時間（毫秒），超過此時間必定執行一次 */
  maxWait?: number
}

/**
 * 防抖回調 Hook
 *
 * 支援 maxWait 選項，確保即使持續觸發也會定期執行
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: DebouncedOptions
): T {
  const { delay, maxWait } = options
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const maxWaitTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const latestArgsRef = useRef<Parameters<T> | undefined>(undefined)

  // 清理所有 timer
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current)
      maxWaitTimeoutRef.current = undefined
    }
  }, [])

  // 組件卸載時清理
  useEffect(() => {
    return cleanup
  }, [cleanup])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // 每次呼叫都更新最新參數
      latestArgsRef.current = args

      // 清除現有的 delay timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 如果是第一次呼叫，設定 maxWait timeout
      if (maxWait && !maxWaitTimeoutRef.current) {
        maxWaitTimeoutRef.current = setTimeout(() => {
          cleanup()
          // 使用最新參數執行
          if (latestArgsRef.current) {
            const args = latestArgsRef.current
            latestArgsRef.current = undefined
            callback(...args)
          }
        }, maxWait)
      }

      // 設定新的 delay timeout
      timeoutRef.current = setTimeout(() => {
        cleanup()
        // 使用最新參數執行
        if (latestArgsRef.current) {
          const args = latestArgsRef.current
          latestArgsRef.current = undefined
          callback(...args)
        }
      }, delay)
    },
    [callback, delay, maxWait, cleanup]
  ) as T

  return debouncedCallback
}
