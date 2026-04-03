/**
 * Retry、Fallback、Circuit Breaker 三層韌性機制
 *
 * 呼叫順序：
 * 1. Circuit breaker OPEN → 直接跳過 retry，走 fallback
 * 2. 呼叫 fn，失敗時判斷是否可重試
 * 3. 可重試 → exponential backoff 重試最多 2 次
 * 4. 全部失敗 → 觸發 fallback provider（如有配置）
 */

// ---------------------------------------------------------------------------
// Retryable Error Classification
// ---------------------------------------------------------------------------

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504])
const NON_RETRYABLE_STATUS_CODES = new Set([400, 401, 403, 413])

export function isRetryableError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    // Network errors
    if (
      msg.includes('timeout') ||
      msg.includes('connection refused') ||
      msg.includes('econnrefused') ||
      msg.includes('fetch failed')
    ) {
      return true
    }
    // HTTP status code in error message
    for (const code of NON_RETRYABLE_STATUS_CODES) {
      if (msg.includes(`${code}`)) return false
    }
    for (const code of RETRYABLE_STATUS_CODES) {
      if (msg.includes(`${code}`)) return true
    }
  }
  // Check for Response-like objects with status
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const status = (err as { status: number }).status
    if (NON_RETRYABLE_STATUS_CODES.has(status)) return false
    if (RETRYABLE_STATUS_CODES.has(status)) return true
  }
  // 預設不可重試（避免對未知錯誤無意義地等待）
  return false
}

// ---------------------------------------------------------------------------
// Retry with Exponential Backoff
// ---------------------------------------------------------------------------

export interface RetryOptions {
  maxRetries?: number // 預設 2
  baseDelayMs?: number // 預設 1000
  maxJitterMs?: number // 預設 500
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { maxRetries = 2, baseDelayMs = 1000, maxJitterMs = 500 } = opts
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt >= maxRetries || !isRetryableError(err)) {
        throw err
      }
      // Exponential backoff: 1s, 2s + jitter
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * maxJitterMs
      await sleep(delay)
    }
  }

  throw lastError
}

// ---------------------------------------------------------------------------
// Circuit Breaker
// ---------------------------------------------------------------------------

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitBreakerConfig {
  failureThreshold?: number // 連續失敗閾值，預設 3
  cooldownMs?: number // 熔斷冷卻時間，預設 30000
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private consecutiveFailures = 0
  private openedAt = 0
  private readonly failureThreshold: number
  private readonly cooldownMs: number

  constructor(opts: CircuitBreakerConfig = {}) {
    this.failureThreshold = opts.failureThreshold ?? 3
    this.cooldownMs = opts.cooldownMs ?? 30000
  }

  isOpen(): boolean {
    if (this.state === 'CLOSED') return false
    if (this.state === 'OPEN') {
      // 檢查是否過了冷卻期
      if (Date.now() - this.openedAt >= this.cooldownMs) {
        this.state = 'HALF_OPEN'
        return false // 允許一次試探
      }
      return true
    }
    // HALF_OPEN → 允許通過
    return false
  }

  getState(): CircuitState {
    // 同步更新 OPEN → HALF_OPEN
    if (this.state === 'OPEN' && Date.now() - this.openedAt >= this.cooldownMs) {
      this.state = 'HALF_OPEN'
    }
    return this.state
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0
    this.state = 'CLOSED'
  }

  recordFailure(): void {
    this.consecutiveFailures++
    if (this.consecutiveFailures >= this.failureThreshold) {
      this.state = 'OPEN'
      this.openedAt = Date.now()
    }
  }
}

// 全域 per-provider circuit breaker（in-memory，isolate 級別）
const circuitBreakers = new Map<string, CircuitBreaker>()

export function getCircuitBreaker(providerKey: string): CircuitBreaker {
  let cb = circuitBreakers.get(providerKey)
  if (!cb) {
    cb = new CircuitBreaker()
    circuitBreakers.set(providerKey, cb)
  }
  return cb
}
