/**
 * LLM 定價表與成本計算
 * 價格為 per 1M tokens, USD
 */

// ---------------------------------------------------------------------------
// Pricing Table
// ---------------------------------------------------------------------------

interface PriceEntry {
  input: number // USD per 1M input tokens
  output: number // USD per 1M output tokens
}

const PRICING: Record<string, PriceEntry> = {
  // 免費 / 低成本 provider
  'workers-ai/*': { input: 0, output: 0 },
  'github/*': { input: 0, output: 0 },
  // Anthropic
  'anthropic/claude-sonnet': { input: 3, output: 15 },
  'anthropic/claude-haiku': { input: 0.25, output: 1.25 },
  // OpenAI
  'openai/gpt-4o': { input: 2.5, output: 10 },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.6 },
  // Google
  'google/gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'google/gemini-2.5-pro': { input: 1.25, output: 10 },
}

/**
 * 查找定價：先精確匹配 "provider/model-family"，再 wildcard "provider/*"
 */
function findPrice(provider: string, model: string): PriceEntry {
  const modelLower = model.toLowerCase()

  // 嘗試 provider + model family 匹配
  for (const [key, price] of Object.entries(PRICING)) {
    if (key.includes('*')) continue
    const [p, m] = key.split('/')
    if (p === provider && modelLower.includes(m)) {
      return price
    }
  }

  // Wildcard 匹配
  const wildcardKey = `${provider}/*`
  if (PRICING[wildcardKey]) return PRICING[wildcardKey]

  // 預設：免費（未知 provider）
  return { input: 0, output: 0 }
}

// ---------------------------------------------------------------------------
// Cost Calculation
// ---------------------------------------------------------------------------

export function calculateCostUSD(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const price = findPrice(provider, model)
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000
}

export function convertToTWD(usd: number, rate: number): number {
  return usd * rate
}
