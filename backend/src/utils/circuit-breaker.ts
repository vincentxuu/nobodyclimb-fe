/**
 * Circuit Breaker 熔斷器
 * 使用 KV 儲存狀態，跨 Worker isolate 共享
 *
 * 注意：KV 是 eventually consistent，read-then-write 不具原子性。
 * 在高並行下 failureCount 可能被低估，導致 CB 觸發略有延遲。
 * 這是 best-effort 保護機制，可接受此限制。
 */

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open'
  failureCount: number
  lastFailureAt: number
  openedAt: number
}

interface CircuitBreakerConfig {
  threshold: number // 連續失敗幾次觸發 Open
  resetMs: number // Open 狀態冷卻時間
}

const KV_KEY = 'circuit:workers-ai'
const KV_TTL = 300 // 5 分鐘無活動自動重置

const DEFAULT_STATE: CircuitBreakerState = {
  state: 'closed',
  failureCount: 0,
  lastFailureAt: 0,
  openedAt: 0,
}

export class CircuitBreaker {
  private kv: KVNamespace
  private config: CircuitBreakerConfig

  constructor(kv: KVNamespace, config: CircuitBreakerConfig) {
    this.kv = kv
    this.config = config
  }

  /**
   * 檢查 Circuit Breaker 狀態，決定是否允許請求通過
   * @returns 'allow' | 'reject' | 'probe'（Half-Open 探測）
   */
  async checkState(): Promise<{
    action: 'allow' | 'reject' | 'probe'
    state: CircuitBreakerState
  }> {
    const current = await this.loadState()

    if (current.state === 'closed') {
      return { action: 'allow', state: current }
    }

    if (current.state === 'open') {
      const elapsed = Date.now() - current.openedAt
      if (elapsed >= this.config.resetMs) {
        // 冷卻時間已到，進入 Half-Open
        const updated: CircuitBreakerState = { ...current, state: 'half-open' }
        await this.saveState(updated)
        return { action: 'probe', state: updated }
      }
      return { action: 'reject', state: current }
    }

    // half-open：允許探測
    return { action: 'probe', state: current }
  }

  /** Workers AI 呼叫成功 */
  async recordSuccess(): Promise<void> {
    const current = await this.loadState()
    const updated: CircuitBreakerState = {
      ...DEFAULT_STATE, // 重置為 closed
    }

    // 只有狀態有變才記錄轉換
    if (current.state !== 'closed' || current.failureCount > 0) {
      await this.saveState(updated)
    }
  }

  /** Workers AI 呼叫失敗（異常或 TimeoutError） */
  async recordFailure(): Promise<{ transitioned: boolean; newState: CircuitBreakerState }> {
    const current = await this.loadState()
    const now = Date.now()

    if (current.state === 'half-open') {
      // Half-Open 探測失敗 → 回到 Open
      const updated: CircuitBreakerState = {
        state: 'open',
        failureCount: current.failureCount + 1,
        lastFailureAt: now,
        openedAt: now,
      }
      await this.saveState(updated)
      return { transitioned: true, newState: updated }
    }

    // Closed 狀態
    const newCount = current.failureCount + 1
    if (newCount >= this.config.threshold) {
      // 觸發 Open
      const updated: CircuitBreakerState = {
        state: 'open',
        failureCount: newCount,
        lastFailureAt: now,
        openedAt: now,
      }
      await this.saveState(updated)
      return { transitioned: true, newState: updated }
    }

    // 還沒到閾值
    const updated: CircuitBreakerState = {
      ...current,
      failureCount: newCount,
      lastFailureAt: now,
    }
    await this.saveState(updated)
    return { transitioned: false, newState: updated }
  }

  private async loadState(): Promise<CircuitBreakerState> {
    try {
      const raw = await this.kv.get(KV_KEY)
      if (!raw) return { ...DEFAULT_STATE }
      return JSON.parse(raw) as CircuitBreakerState
    } catch {
      return { ...DEFAULT_STATE }
    }
  }

  private async saveState(state: CircuitBreakerState): Promise<void> {
    await this.kv.put(KV_KEY, JSON.stringify(state), { expirationTtl: KV_TTL })
  }
}
