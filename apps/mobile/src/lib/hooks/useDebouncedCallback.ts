/**
 * useDebouncedCallback Hook
 *
 * 對應 apps/web/src/lib/hooks/useDebouncedCallback.ts
 */
import { useCallback, useRef, useEffect, useMemo } from 'react'

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  flush: () => void
  cancel: () => void
}

interface UseDebouncedCallbackOptions {
  delay?: number
  maxWait?: number
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  optionsOrDelay: number | UseDebouncedCallbackOptions = 500
): DebouncedFunction<T> {
  const options = typeof optionsOrDelay === 'number'
    ? { delay: optionsOrDelay }
    : optionsOrDelay
  const { delay = 500, maxWait } = options

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)
  const lastArgsRef = useRef<Parameters<T> | null>(null)

  // 更新 callback ref
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // 清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current)
      }
    }
  }, [])

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current)
      maxWaitTimeoutRef.current = null
    }
    if (lastArgsRef.current) {
      callbackRef.current(...lastArgsRef.current)
      lastArgsRef.current = null
    }
  }, [])

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current)
      maxWaitTimeoutRef.current = null
    }
    lastArgsRef.current = null
  }, [])

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
        lastArgsRef.current = null
        if (maxWaitTimeoutRef.current) {
          clearTimeout(maxWaitTimeoutRef.current)
          maxWaitTimeoutRef.current = null
        }
      }, delay)

      // Set up maxWait timeout if specified and not already set
      if (maxWait && !maxWaitTimeoutRef.current) {
        maxWaitTimeoutRef.current = setTimeout(() => {
          flush()
        }, maxWait)
      }
    },
    [delay, maxWait, flush]
  )

  return useMemo(() => {
    const fn = debouncedFn as DebouncedFunction<T>
    fn.flush = flush
    fn.cancel = cancel
    return fn
  }, [debouncedFn, flush, cancel])
}
