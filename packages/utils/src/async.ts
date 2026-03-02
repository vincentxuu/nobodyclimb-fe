/**
 * 非同步相關工具函數
 */

/**
 * 延遲函數
 * @param ms 毫秒
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 指數退避延遲計算
 * @param retryCount 當前重試次數
 * @param baseDelay 基礎延遲時間 (毫秒)
 */
export function getExponentialBackoffDelay(retryCount: number, baseDelay = 1000): number {
  return baseDelay * Math.pow(2, retryCount)
}

/**
 * 帶重試的非同步函數執行器
 * @param fn 要執行的函數
 * @param maxRetries 最大重試次數
 * @param baseDelay 基礎延遲時間
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | unknown

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        await delay(getExponentialBackoffDelay(i, baseDelay))
      }
    }
  }

  throw lastError
}

/**
 * 防抖函數
 * @param fn 要執行的函數
 * @param wait 等待時間 (毫秒)
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args)
    }, wait)
  }
}

/**
 * 節流函數
 * @param fn 要執行的函數
 * @param limit 限制時間 (毫秒)
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
