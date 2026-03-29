import { describe, expect, it } from 'vitest'
import { createProvider } from '../providers'

describe('createProvider', () => {
  it('creates CloudflareProvider when provider is cloudflare', () => {
    const provider = createProvider('cloudflare', { AI: {} } as any)
    expect(provider.name).toBe('cloudflare')
  })
  it('throws when OpenAI key missing', () => {
    expect(() => createProvider('openai', {} as any)).toThrow('OPENAI_API_KEY is not set')
  })
  it('creates OpenAIProvider when key is present', () => {
    const provider = createProvider('openai', { OPENAI_API_KEY: 'sk-test' } as any)
    expect(provider.name).toBe('openai')
  })
  it('creates AnthropicProvider when key is present', () => {
    const provider = createProvider('anthropic', { ANTHROPIC_API_KEY: 'ant-test' } as any)
    expect(provider.name).toBe('anthropic')
  })
  it('creates GoogleProvider when key is present', () => {
    const provider = createProvider('google', { GOOGLE_AI_API_KEY: 'gai-test' } as any)
    expect(provider.name).toBe('google')
  })
})
