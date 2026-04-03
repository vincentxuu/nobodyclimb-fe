import { calculateCostUSD, convertToTWD } from './pricing'
import type { ModelTokenUsage, ProviderName, TokenTracker, TurnRecord } from './types'

export interface CostSummary {
  totalCostUSD: number
  totalCostTWD: number
  perProvider: Array<{
    provider: string
    model: string
    costUSD: number
    costTWD: number
  }>
}

export class DefaultTokenTracker implements TokenTracker {
  private perModel: Map<string, ModelTokenUsage> = new Map()
  private turns: TurnRecord[] = []
  private currentTurn: TurnRecord | null = null
  private totalInput = 0
  private totalOutput = 0
  private usdToTwd: number

  constructor(usdToTwd = 32.0) {
    this.usdToTwd = usdToTwd
  }

  record(provider: ProviderName, model: string, input: number, output: number): void {
    this.totalInput += input
    this.totalOutput += output

    const key = `${provider}:${model}`
    const existing = this.perModel.get(key)
    if (existing) {
      existing.inputTokens += input
      existing.outputTokens += output
      existing.calls++
    } else {
      this.perModel.set(key, {
        provider,
        model,
        inputTokens: input,
        outputTokens: output,
        calls: 1,
      })
    }
  }

  startTurn(turn: number): void {
    this.currentTurn = {
      turn,
      orchestratorUsage: { inputTokens: 0, outputTokens: 0 },
      toolCalls: [],
    }
    this.turns.push(this.currentTurn)
  }

  recordOrchestratorUsage(input: number, output: number): void {
    if (this.currentTurn) {
      this.currentTurn.orchestratorUsage = { inputTokens: input, outputTokens: output }
    }
  }

  recordToolCall(name: string, latencyMs: number, internalLLMTokens?: number): void {
    if (this.currentTurn) {
      this.currentTurn.toolCalls.push({ name, latencyMs, internalLLMTokens })
    }
  }

  getTotalInputTokens(): number {
    return this.totalInput
  }

  getTotalOutputTokens(): number {
    return this.totalOutput
  }

  getTotalTokens(): number {
    return this.totalInput + this.totalOutput
  }

  getPerModelStats(): ModelTokenUsage[] {
    return Array.from(this.perModel.values())
  }

  getTurnRecords(): TurnRecord[] {
    return this.turns
  }

  getCostSummary(): CostSummary {
    let totalCostUSD = 0
    const perProvider: CostSummary['perProvider'] = []

    for (const usage of this.perModel.values()) {
      const costUSD = calculateCostUSD(
        usage.provider,
        usage.model,
        usage.inputTokens,
        usage.outputTokens
      )
      totalCostUSD += costUSD
      perProvider.push({
        provider: usage.provider,
        model: usage.model,
        costUSD,
        costTWD: convertToTWD(costUSD, this.usdToTwd),
      })
    }

    return {
      totalCostUSD,
      totalCostTWD: convertToTWD(totalCostUSD, this.usdToTwd),
      perProvider,
    }
  }
}
