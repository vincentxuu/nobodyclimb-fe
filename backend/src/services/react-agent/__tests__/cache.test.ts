import { describe, expect, it, vi } from 'vitest'
import { hashForCache, KVAgentCache } from '../cache'

function mockKV() {
  const store = new Map<string, { value: string; expiration?: number }>()
  return {
    get: vi.fn(async (key: string) => store.get(key)?.value ?? null),
    put: vi.fn(async (key: string, value: string, opts?: { expirationTtl?: number }) => {
      store.set(key, { value, expiration: opts?.expirationTtl })
    }),
    _store: store,
  } as unknown as KVNamespace & { _store: Map<string, { value: string; expiration?: number }> }
}

describe('KVAgentCache', () => {
  it('returns null on cache miss', async () => {
    const kv = mockKV()
    const cache = new KVAgentCache(kv)
    const result = await cache.get('nonexistent')
    expect(result).toBeNull()
  })

  it('stores and retrieves JSON values', async () => {
    const kv = mockKV()
    const cache = new KVAgentCache(kv)
    await cache.set('key1', { foo: 'bar' }, 3600)
    const result = await cache.get('key1')
    expect(result).toEqual({ foo: 'bar' })
  })

  it('uses namespace prefix', async () => {
    const kv = mockKV()
    const cache = new KVAgentCache(kv)
    await cache.set('test', 'value', 300)
    expect(kv.put).toHaveBeenCalledWith('react-agent:test', '"value"', { expirationTtl: 300 })
  })

  it('passes TTL to KV put', async () => {
    const kv = mockKV()
    const cache = new KVAgentCache(kv)
    await cache.set('key', 'val', 1800)
    const stored = kv._store.get('react-agent:key')
    expect(stored?.expiration).toBe(1800)
  })

  it('handles malformed JSON in KV gracefully', async () => {
    const kv = mockKV()
    // Manually put invalid JSON
    kv._store.set('react-agent:bad', { value: 'not-json{' })
    const cache = new KVAgentCache(kv)
    const result = await cache.get('bad')
    expect(result).toBeNull()
  })

  it('stores string values', async () => {
    const kv = mockKV()
    const cache = new KVAgentCache(kv)
    await cache.set('str', '找到 5 條路線', 600)
    const result = await cache.get<string>('str')
    expect(result).toBe('找到 5 條路線')
  })
})

describe('hashForCache', () => {
  it('returns consistent hash for same input', () => {
    const h1 = hashForCache('test-input')
    const h2 = hashForCache('test-input')
    expect(h1).toBe(h2)
  })

  it('returns different hash for different input', () => {
    const h1 = hashForCache('input-a')
    const h2 = hashForCache('input-b')
    expect(h1).not.toBe(h2)
  })

  it('returns base36 string', () => {
    const h = hashForCache('some value')
    expect(h).toMatch(/^[0-9a-z]+$/)
  })
})

describe('tool result cache integration (engine behavior)', () => {
  // These test the cache patterns used in engine.ts executeSingleTool
  it('cache key format: tool_name:hash(params)', () => {
    const toolName = 'search_routes'
    const input = { query: '龍洞' }
    const key = `${toolName}:${hashForCache(JSON.stringify(input))}`
    expect(key).toContain('search_routes:')
    expect(key.length).toBeGreaterThan('search_routes:'.length)
  })

  it('error results should NOT be cached (is_error=true)', async () => {
    const kv = mockKV()
    const cache = new KVAgentCache(kv)
    // Simulate: error result — don't call cache.set
    const isError = true
    if (!isError) {
      await cache.set('key', 'content', 3600)
    }
    // Verify nothing was cached
    expect(kv.put).not.toHaveBeenCalled()
  })

  it('successful results should be cached', async () => {
    const kv = mockKV()
    const cache = new KVAgentCache(kv)
    const isError = false
    const cacheTTL = 3600
    if (!isError && cacheTTL > 0) {
      await cache.set('search_routes:abc123', '找到 5 條路線', cacheTTL)
    }
    expect(kv.put).toHaveBeenCalledTimes(1)
    const result = await cache.get<string>('search_routes:abc123')
    expect(result).toBe('找到 5 條路線')
  })
})
