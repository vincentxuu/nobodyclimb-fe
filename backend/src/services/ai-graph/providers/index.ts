import { Env } from '../../../types'
import { AnthropicProvider } from './anthropic'
import { CloudflareProvider } from './cloudflare'
import { GitHubModelsProvider } from './github'
import { GoogleProvider } from './google'
import { OpenAIProvider } from './openai'
import { AIProvider, ProviderName } from './types'

export interface ProviderConfig {
  /** 主要 LLM provider（chat + streaming） */
  llmProvider: ProviderName
  /** 嵌入向量 provider（embed）；預設與 llmProvider 相同，若不支援 embed 則 fallback 到 cloudflare */
  embeddingProvider?: ProviderName
}

/**
 * 工廠函式：根據 config 和 env 建立 AIProvider 實例。
 * 若 provider 所需的 API key 不存在，拋出明確錯誤。
 */
export function createProvider(name: ProviderName, env: Env): AIProvider {
  switch (name) {
    case 'cloudflare':
    case 'workers-ai':
      return new CloudflareProvider(env.AI)
    case 'openai':
      if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set')
      return new OpenAIProvider(env.OPENAI_API_KEY)
    case 'anthropic':
      if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set')
      return new AnthropicProvider(env.ANTHROPIC_API_KEY)
    case 'google':
      if (!env.GOOGLE_AI_API_KEY) throw new Error('GOOGLE_AI_API_KEY is not set')
      return new GoogleProvider(env.GOOGLE_AI_API_KEY)
    case 'github':
      if (!env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not set')
      return new GitHubModelsProvider(env.GITHUB_TOKEN)
    default:
      throw new Error(`Unknown provider: ${name}`)
  }
}

/** 建立主 LLM provider + embedding provider（自動 fallback） */
export function createProviders(
  config: ProviderConfig,
  env: Env
): {
  llm: AIProvider
  embedding: AIProvider
} {
  const llm = createProvider(config.llmProvider, env)
  let embedding: AIProvider
  const embName = config.embeddingProvider ?? config.llmProvider
  try {
    const ep = createProvider(embName, env)
    // anthropic doesn't support embedding — fallback to cloudflare
    embedding = ep.name === 'anthropic' ? new CloudflareProvider(env.AI) : ep
  } catch (err) {
    // embedding provider creation failed (e.g., missing API key for non-cloudflare provider)
    // fall back to Cloudflare embedding to keep the request alive
    console.warn('[providers] embedding provider creation failed, falling back to Cloudflare:', err)
    embedding = new CloudflareProvider(env.AI)
  }
  return { llm, embedding }
}

export * from './types'
