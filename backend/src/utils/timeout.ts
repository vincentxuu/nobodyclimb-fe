/**
 * Pipeline 超時工具函式
 */

export class TimeoutError extends Error {
  public readonly label: string
  public readonly timeoutMs: number

  constructor(label: string, ms: number) {
    super(`${label} 超時（${ms}ms）`)
    this.name = 'TimeoutError'
    this.label = label
    this.timeoutMs = ms
  }
}

/**
 * 為 Promise 加上超時保護。
 * 超時時拋出 TimeoutError，原始 Promise 的結果被忽略。
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  if (ms <= 0) return promise

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
