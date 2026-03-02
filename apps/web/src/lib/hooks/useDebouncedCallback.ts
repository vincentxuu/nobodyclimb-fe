import { useCallback, useEffect, useRef } from 'react'

interface DebouncedOptions {
  /** 延遲時間（毫秒） */
  delay: number
  /** 最大等待時間（毫秒），超過此時間必定執行一次 */
  maxWait?: number
}

interface DebouncedCallbackWithFlush<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  /** 立即執行 pending 的回調（如果有） */
  flush: () => void
}

/**
 * 防抖回調 Hook
 *
 * 支援 maxWait 選項，確保即使持續觸發也會定期執行
 * 支援 flush 方法，確保元件卸載前可以執行 pending 的回調
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: DebouncedOptions
): DebouncedCallbackWithFlush<T> {
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

  // flush: 立即執行 pending 的回調
  const flush = useCallback(() => {
    if (latestArgsRef.current) {
      cleanup()
      const args = latestArgsRef.current
      latestArgsRef.current = undefined
      callback(...args)
    }
  }, [callback, cleanup])

  // 組件卸載時清理 timers（但不執行 flush）
  // 設計決策：用戶離開頁面是有意識的行為，不應強制儲存
  // 正常編輯已有 debounce + maxWait 機制保證定期儲存
  // 如需「離開前儲存」應在業務層面處理（例如 beforeunload）
  useEffect(() => {
    return () => {
      cleanup()
    }
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
  )

  // 將 flush 方法附加到 debouncedCallback
  const debouncedCallbackWithFlush = debouncedCallback as DebouncedCallbackWithFlush<T>
  debouncedCallbackWithFlush.flush = flush

  return debouncedCallbackWithFlush
}
